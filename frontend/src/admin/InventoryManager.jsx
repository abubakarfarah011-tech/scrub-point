import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/useAuth';
import {
  Plus, Trash2, Edit2, Archive, CheckCircle, AlertCircle, RefreshCw,
  Upload, Layers, Palette, ShieldCheck, Clock, Calendar, ChevronRight,
  Package, DollarSign, Eye, EyeOff, Sparkles, Scissors, ClipboardList
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL;

export default function InventoryManager() {
  const { admin } = useAuth();

  const [productsList, setProductsList] = useState([]);
  const [packagesList, setPackagesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [activeTab, setActiveTab] = useState('add_product');

  const [productForm, setProductForm] = useState({
    name: '',
    price: '',
    category: '',
    description: '',
    stock_quantity: '',
    sizes_input: '',
    colors_input: '',
    custom_message_input: '',
    is_on_offer: false,
    offer_price: '',
    offer_expiry_date: '',
    offer_expiry_time: ''
  });

  const [packageForm, setPackageForm] = useState({
    name: '',
    description: '',
    package_price: '',
    stock_quantity: '',
    available_from_date: '',
    available_until_date: '',
    available_until_time: '',
    is_time_limited: false
  });

  const [selectedPackageItems, setSelectedPackageItems] = useState([]);

  const [productImageFile, setProductImageFile] = useState(null);
  const [packageImageFile, setPackageImageFile] = useState(null);
  const [productImagePreview, setProductImagePreview] = useState('');
  const [packageImagePreview, setPackageImagePreview] = useState('');
  const [isDragOverActive, setIsDragOverActive] = useState(false);

  const [renewingPackageId, setRenewingPackageId] = useState(null);
  const [renewDate, setRenewDate] = useState('');
  const [activeEditingPackageId, setActiveEditingPackageId] = useState(null);
  const [deletedProductsList, setDeletedProductsList] = useState([]);
  const [trashLoading, setTrashLoading] = useState(false);

  const [successNotice, setSuccessNotice] = useState('');
  const [errorNotice, setErrorNotice] = useState('');
  const [activeEditingProductId, setActiveEditingProductId] = useState(null);

  function int(val) { return parseInt(val || 0, 10); }
  function float(val) { return parseFloat(val || 0.0); }

  const syncRepositoryRecords = async () => {
    setLoading(true);
    setErrorNotice('');
    try {
      const itemsResponse = await fetch(`${API_BASE_URL}/api/products?limit=200&timestamp=` + new Date().getTime());
      const itemsJson = await itemsResponse.json();
      if (itemsJson.success) {
        setProductsList(itemsJson.data || []);
      }

      const packagesResponse = await fetch(`${API_BASE_URL}/api/packages?limit=100&timestamp=` + new Date().getTime());
      const packagesJson = await packagesResponse.json();
      if (packagesJson.success) {
        setPackagesList(packagesJson.data || []);
      }
    } catch (err) {
      setErrorNotice("Failed to sync storage registry data models with the centralized cloud server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    syncRepositoryRecords();
  }, []);

  const fetchTrashRecords = useCallback(async () => {
    setTrashLoading(true);
    setErrorNotice('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/trash`, {
        headers: { 'Authorization': 'Bearer ' + admin.token }
      });
      const result = await response.json();
      if (result.success) setDeletedProductsList(result.data || []);
    } catch (err) {
      setErrorNotice("Failed to load trash bin contents.");
    } finally {
      setTrashLoading(false);
    }
  }, [admin.token]);

  useEffect(() => {
  if (activeTab === 'trash') {
    fetchTrashRecords();
  }
}, [activeTab, fetchTrashRecords]);

  const handleRenewPackage = async (pkg) => {
    if (!renewDate) {
      setErrorNotice("Please pick a new expiry date before renewing.");
      return;
    }
    setActionLoading(true);
    setErrorNotice('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/packages/${pkg.id}`, {
        method: 'PUT',
        headers: { 'Authorization': 'Bearer ' + admin.token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ available_until_date: renewDate })
      });
      const result = await response.json();
      if (response.ok && result.success) {
        setSuccessNotice(`"${pkg.name}" renewed — visible again until ${renewDate}.`);
        setRenewingPackageId(null);
        setRenewDate('');
        syncRepositoryRecords();
      } else {
        setErrorNotice(result.message || "Failed to renew package.");
      }
    } catch (err) {
      setErrorNotice("Network error while renewing package.");
    } finally {
      setActionLoading(false);
    }
  };

  const splitInputToPureArray = (rawInputString) => {
    if (!rawInputString) return '';
    return String(rawInputString)
      .replace(/[{}"[\]']/g, '')
      .split(',')
      .map(item => item.trim())
      .filter(Boolean)
      .join(', ');
  };

  const handleItemValueInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProductForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleBundleValueInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPackageForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const uploadImageToServer = async (fileObject) => {
    const multiPartFormMediaPayload = new FormData();

    let actualRawFile = fileObject;
    if (fileObject instanceof FileList && fileObject.length > 0) {
      actualRawFile = fileObject[0];
    } else if (fileObject && fileObject.length && fileObject[0] instanceof File) {
      actualRawFile = fileObject[0];
    }

    multiPartFormMediaPayload.append('image', actualRawFile);

    const response = await fetch(`${API_BASE_URL}/api/admin/upload-image`, {
      method: "POST",
      headers: {
        'Authorization': 'Bearer ' + admin.token
      },
      body: multiPartFormMediaPayload
    });

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || "Cloud media bucket upload failed.");
    }
    return result.image_url;
  };

  const handleDragOverActiveBoundary = (e) => {
    e.preventDefault();
    setIsDragOverActive(true);
  };

  const handleDragLeaveActiveBoundary = () => {
    setIsDragOverActive(false);
  };

  const handleProductImageFileSelection = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    setProductImageFile(selectedFile);
    setProductImagePreview(URL.createObjectURL(selectedFile));
    setActionLoading(true);
    setErrorNotice('');
    setSuccessNotice('');
    try {
      const permanentUrl = await uploadImageToServer(selectedFile);
      setProductImagePreview(permanentUrl);
      setSuccessNotice("Garment lookbook image uploaded to storage bucket successfully!");
    } catch (err) {
      setErrorNotice("Image storage upload failed: " + err.message);
      setProductImagePreview('');
      setProductImageFile(null);
    } finally {
      setActionLoading(false);
    }
  };

  const handlePackageImageFileSelection = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    setPackageImageFile(selectedFile);
    setPackageImagePreview(URL.createObjectURL(selectedFile));
    setActionLoading(true);
    setErrorNotice('');
    setSuccessNotice('');
    try {
      const permanentUrl = await uploadImageToServer(selectedFile);
      setPackageImagePreview(permanentUrl);
      setSuccessNotice("Bundle display graphic uploaded to storage bucket successfully!");
    } catch (err) {
      setErrorNotice("Package image storage upload failed: " + err.message);
      setPackageImagePreview('');
      setPackageImageFile(null);
    } finally {
      setActionLoading(false);
    }
  };

  const handleProductImageFileDropAction = async (e) => {
    e.preventDefault();
    setIsDragOverActive(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.startsWith('image/')) {
      setProductImageFile(droppedFile);
      setProductImagePreview(URL.createObjectURL(droppedFile));
      setActionLoading(true);
      setErrorNotice('');
      setSuccessNotice('');
      try {
        const permanentUrl = await uploadImageToServer(droppedFile);
        setProductImagePreview(permanentUrl);
        setSuccessNotice("Dropped lookbook image compiled and stored live safely!");
      } catch (err) {
        setErrorNotice("Dropped product image upload failed: " + err.message);
        setProductImagePreview('');
        setProductImageFile(null);
      } finally {
        setActionLoading(false);
      }
    } else {
      alert("Invalid format asset: Please drop a high-res clinical lookbook PNG or JPG file.");
    }
  };

  const handlePackageImageFileDropAction = async (e) => {
    e.preventDefault();
    setIsDragOverActive(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.startsWith('image/')) {
      setPackageImageFile(droppedFile);
      setPackageImagePreview(URL.createObjectURL(droppedFile));
      setActionLoading(true);
      setErrorNotice('');
      setSuccessNotice('');
      try {
        const permanentUrl = await uploadImageToServer(droppedFile);
        setPackageImagePreview(permanentUrl);
        setSuccessNotice("Dropped bundle display graphic compiled and stored live safely!");
      } catch (err) {
        setErrorNotice("Dropped package image upload failed: " + err.message);
        setPackageImagePreview('');
        setPackageImageFile(null);
      } finally {
        setActionLoading(false);
      }
    } else {
      alert("Invalid format asset: Please drop a bundle promotional visual file.");
    }
  };

  const handleAddProductRowToPackageList = () => {
    setSelectedPackageItems(prev => [...prev, { product_id: '', quantity: 1 }]);
  };

  const handleRemoveProductRowFromPackageList = (indexToRemove) => {
    setSelectedPackageItems(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handlePackageRowValueOverride = (indexToUpdate, targetField, targetValue) => {
    setSelectedPackageItems(prev => prev.map((item, idx) =>
      idx === indexToUpdate ? { ...item, [targetField]: targetValue } : item
    ));
  };

  const handleProductFormSubmission = async (e) => {
    e.preventDefault();
    if (!productForm.name || !productForm.price || !productForm.category) {
      setErrorNotice("Please input the critical product name, value price tags, and category group filters.");
      return;
    }

    setActionLoading(true);
    setErrorNotice('');
    setSuccessNotice('');

    const filteredSizesArray = splitInputToPureArray(productForm.sizes_input);
    const filteredColorsArray = splitInputToPureArray(productForm.colors_input);

    const isCustomTailorTicked = productForm.has_custom_measurements === true || productForm.has_custom_measurements === 'true';
    const isOfferActiveTicked = productForm.is_on_offer === true || productForm.is_on_offer === 'true';
    const offerFlagPayloadString = isOfferActiveTicked ? 'YES' : 'NO';

    const combinedSizingPayloadList = isCustomTailorTicked
      ? ["__CUSTOM_MEASUREMENT_ENABLED__", ...filteredSizesArray]
      : filteredSizesArray;

    let finalValidImagePointer = productImagePreview || '';
    if (activeEditingProductId && (!productImageFile || productImageFile.length === 0)) {
      const activeItemMatch = productsList.find(p => p.id === activeEditingProductId);
      if (activeItemMatch && activeItemMatch.image_url) {
        finalValidImagePointer = activeItemMatch.image_url;
      }
    }

    const jsonProductPayload = {
      name: productForm.name.trim(),
      price: parseFloat(productForm.price),
      category: productForm.category.trim(),
      description: productForm.description.trim(),
      stock_quantity: parseInt(productForm.stock_quantity || 0, 10),
      colors_available: filteredColorsArray,
      sizes_available: combinedSizingPayloadList,
      is_on_offer: offerFlagPayloadString,
      offer_price: productForm.offer_price ? parseFloat(productForm.offer_price) : 0.0,
      discount_price: productForm.offer_price ? parseFloat(productForm.offer_price) : 0.0,
      offer_expiry_date: productForm.offer_expiry_date || '',
      offer_expiry_time: productForm.offer_expiry_time || '',
      image_url: finalValidImagePointer
    };

    try {
      let targetApiUrl = `${API_BASE_URL}/api/products`;
      let requestMethodString = "POST";

      if (activeEditingProductId) {
        targetApiUrl = `${API_BASE_URL}/api/products/${activeEditingProductId}`;
        requestMethodString = "PUT";
      }

      const networkResponse = await fetch(targetApiUrl, {
        method: requestMethodString,
        headers: {
          'Authorization': 'Bearer ' + admin.token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(jsonProductPayload)
      });
      const resultJson = await networkResponse.json();

      if (networkResponse.ok && resultJson.success) {
        setSuccessNotice(activeEditingProductId ? "Clinical item updated cleanly!" : "Fresh clinical uniform asset logged and registered successfully!");
        handleClearProductFormWorkspace();
        syncRepositoryRecords();
      } else {
        setErrorNotice(resultJson.message || "The database system rejected your item parameters.");
      }
    } catch (err) {
      setErrorNotice("Network framework transmission pipeline communication failure.");
    } finally {
      setActionLoading(false);
    }
  };
  const handleClearProductFormWorkspace = () => {
    setProductForm({
      name: '', price: '', category: '', description: '', stock_quantity: '',
      sizes_input: '', colors_input: '', has_custom_measurements: false,
      is_on_offer: false, offer_price: '', offer_expiry_date: '', offer_expiry_time: ''
    });
    setProductImageFile(null);
    setProductImagePreview('');
    setActiveEditingProductId(null);
  };

  const handleLoadItemToEditWorkspace = (targetItem) => {
    setActiveEditingProductId(targetItem.id);
    setActiveTab('add_product');

    const cleanSizesString = Array.isArray(targetItem.sizes_available)
      ? targetItem.sizes_available.join(', ')
      : String(targetItem.sizes_available || '').replace(/[{}"[\]]/g, '').trim();

    const cleanColorsString = Array.isArray(targetItem.colors_available)
      ? targetItem.colors_available.join(', ')
      : String(targetItem.colors_available || '').replace(/[{}"[\]]/g, '').trim();

    setProductForm({
      name: targetItem.name || '',
      price: targetItem.price || '',
      category: targetItem.category || '',
      description: targetItem.description || '',
      stock_quantity: targetItem.stock_quantity || '',
      sizes_input: cleanSizesString,
      colors_input: cleanColorsString,
      has_custom_measurements: targetItem.has_custom_measurements === true || targetItem.has_custom_measurements === 'true',
      is_on_offer: targetItem.is_on_offer === true || targetItem.is_on_offer === 'true',
      offer_price: targetItem.offer_price || '',
      offer_expiry_date: targetItem.offer_expiry_date || '',
      offer_expiry_time: targetItem.offer_expiry_time || ''
    });

    if (targetItem.image_url) {
      setProductImagePreview(targetItem.image_url);
    }
  };

  const handleDeleteProductRecord = async (productId) => {
    if (!window.confirm("Are you sure you want to permanently erase this clinical item record from database logs?")) return;

    setActionLoading(true);
    setErrorNotice('');
    setSuccessNotice('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer ' + admin.token
        }
      });
      const result = await response.json();

      if (response.ok && result.success) {
        setSuccessNotice("Item row purged safely from the database repository!");
        syncRepositoryRecords();
      } else {
        setErrorNotice(result.message || "The database system rejected your delete transaction request.");
      }
    } catch (err) {
      setErrorNotice("Network framework elimination loop communication failure.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestoreProduct = async (productId) => {
    setActionLoading(true);
    setErrorNotice('');
    setSuccessNotice('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/trash/${productId}`, {
        method: 'PATCH',
        headers: { 'Authorization': 'Bearer ' + admin.token }
      });
      const result = await response.json();
      if (response.ok && result.success) {
        setSuccessNotice("Product restored to the live catalog successfully!");
        fetchTrashRecords();
        syncRepositoryRecords();
      } else {
        setErrorNotice(result.message || "Failed to restore product.");
      }
    } catch (err) {
      setErrorNotice("Network error while restoring product.");
    } finally {
      setActionLoading(false);
    }
  };

  const handlePermanentlyDeleteProduct = async (productId) => {
    if (!window.confirm("Permanently delete this product? This cannot be undone — it will be gone for good.")) return;
    setActionLoading(true);
    setErrorNotice('');
    setSuccessNotice('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/trash/${productId}`, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + admin.token }
      });
      const result = await response.json();
      if (response.ok && result.success) {
        setSuccessNotice("Product permanently deleted.");
        fetchTrashRecords();
      } else {
        setErrorNotice(result.message || "Failed to permanently delete product.");
      }
    } catch (err) {
      setErrorNotice("Network error while permanently deleting product.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleWorkspaceTabSwitch = (targetTabId) => {
    setActiveTab(targetTabId);
    setErrorNotice('');
    setSuccessNotice('');
  };

  const handleLoadPackageToEditWorkspace = (pkg) => {
    setActiveEditingPackageId(pkg.id);
    setActiveTab('add_package');

    let existingComponents;
    try {
      existingComponents = typeof pkg.products_summary === 'string'
        ? JSON.parse(pkg.products_summary || '[]')
        : (pkg.products_summary || []);
    } catch (e) {
      existingComponents = [];
    }

    setPackageForm({
      name: pkg.name || '',
      description: pkg.description || '',
      package_price: pkg.price || '',
      stock_quantity: pkg.stock_quantity !== undefined && pkg.stock_quantity !== null ? pkg.stock_quantity : '',
      available_from_date: pkg.available_from_date || '',
      available_until_date: pkg.available_until_date || '',
      available_until_time: pkg.available_until_time || '',
      is_time_limited: pkg.is_time_limited === true || pkg.is_time_limited === 'true'
    });

    setSelectedPackageItems(existingComponents.map(c => ({
      product_id: String(c.product_id),
      quantity: c.quantity
    })));

    if (pkg.image_url) {
      setPackageImagePreview(pkg.image_url);
    }
  };

  const handleDeletePackageRecord = async (packageId) => {
    if (!window.confirm("Permanently delete this package bundle? This cannot be undone.")) return;
    setActionLoading(true);
    setErrorNotice('');
    setSuccessNotice('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/packages/${packageId}`, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + admin.token }
      });
      const result = await response.json();
      if (response.ok && result.success) {
        setSuccessNotice("Package bundle deleted successfully.");
        syncRepositoryRecords();
      } else {
        setErrorNotice(result.message || "Failed to delete package.");
      }
    } catch (err) {
      setErrorNotice("Network error while deleting package.");
    } finally {
      setActionLoading(false);
    }
  };

  const handlePackageFormSubmission = async (e) => {
    e.preventDefault();
    if (!packageForm.name || !packageForm.package_price) {
      setErrorNotice("Please input the core package bundle title name and the bundle checkout price tag.");
      return;
    }

    if (selectedPackageItems.length === 0) {
      setErrorNotice("A promotional bundle pack must contain at least one valid product repository asset row selection.");
      return;
    }

    const isSelectionInvalid = selectedPackageItems.some(item => !item.product_id || parseInt(item.quantity || 0, 10) <= 0);
    if (isSelectionInvalid) {
      setErrorNotice("Please select valid product rows and verify quantities inside your inventory compilation array.");
      return;
    }

    setActionLoading(true);
    setErrorNotice('');
    setSuccessNotice('');

    const filteredBundleSummaryList = selectedPackageItems.map(item => ({
      product_id: parseInt(item.product_id, 10),
      quantity: parseInt(item.quantity, 10)
    }));

    const jsonPackagePayload = {
      name: packageForm.name.trim(),
      description: packageForm.description.trim(),
      price: parseFloat(packageForm.package_price),
      stock_quantity: parseInt(packageForm.stock_quantity || 0, 10),
      products_summary: filteredBundleSummaryList,
      image_url: packageImagePreview || '',
      is_time_limited: packageForm.is_time_limited,
      available_from_date: packageForm.available_from_date || '',
      available_until_date: packageForm.available_until_date || '',
      available_until_time: packageForm.available_until_time || ''
    };

    try {
      let targetPackageUrl = `${API_BASE_URL}/api/packages`;
      let packageMethodString = 'POST';

      if (activeEditingPackageId) {
        targetPackageUrl = `${API_BASE_URL}/api/packages/${activeEditingPackageId}`;
        packageMethodString = 'PUT';
      }

      const networkResponse = await fetch(targetPackageUrl, {
        method: packageMethodString,
        headers: {
          'Authorization': 'Bearer ' + admin.token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(jsonPackagePayload)
      });

      const resultJson = await networkResponse.json();

      if (networkResponse.ok && resultJson.success) {
        setSuccessNotice(activeEditingPackageId ? "Package bundle updated cleanly!" : "Dynamic medical uniform package bundle compiled and uploaded live safely!");
        handleClearPackageFormWorkspace();
        syncRepositoryRecords();
      } else {
        setErrorNotice(resultJson.message || "The database system rejected your package configuration layout settings.");
      }
    } catch (err) {
      setErrorNotice("Network framework package pipeline transmission failure.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleClearPackageFormWorkspace = () => {
    setPackageForm({
      name: '', description: '', package_price: '', stock_quantity: '',
      available_from_date: '', available_until_date: '',
      available_until_time: '', is_time_limited: false
    });
    setPackageImageFile(null);
    setPackageImagePreview('');
    setSelectedPackageItems([]);
    setActiveEditingPackageId(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 lg:p-8 font-sans antialiased text-slate-700 dark:text-slate-200 select-none">
      <div className="max-w-7xl mx-auto space-y-6">

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 border-2 border-[#1E3A8A] p-5 rounded-2xl shadow-xs animate-fade">
          <div className="space-y-0.5">
            <h1 className="text-base sm:text-lg font-black uppercase tracking-tight text-slate-900 dark:text-white flex items-center">
              <Archive className="h-5 w-5 text-[#1E3A8A] mr-2 animate-pulse" />
              <span>Central Warehouse Storage Log Console</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              Modify standard practitioner uniforms, bundle packages, and date-bound promotional price offer rules
            </p>
          </div>
          <button
            type="button"
            onClick={syncRepositoryRecords}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer flex items-center space-x-1.5 focus:outline-none"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync Storage Logs</span>
          </button>
        </div>

        {errorNotice && (
          <div className="bg-red-50 dark:bg-red-950/20 border-l-4 border-red-500 text-red-700 dark:text-red-400 p-3.5 rounded-r-xl text-xs font-bold flex items-center space-x-2 shadow-2xs animate-scale">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorNotice}</span>
          </div>
        )}

        {successNotice && (
          <div className="bg-emerald-50 dark:bg-emerald-950/20 border-l-4 border-emerald-500 text-emerald-700 dark:text-emerald-400 p-3.5 rounded-r-xl text-xs font-bold flex items-center space-x-2 shadow-2xs animate-scale">
            <CheckCircle className="h-4 w-4 shrink-0" />
            <span>{successNotice}</span>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1">
          <button
            type="button"
            onClick={() => handleWorkspaceTabSwitch('add_product')}
            className={`px-4 py-2.5 rounded-t-xl text-[10px] font-black uppercase tracking-wider border-2 border-b-0 transition-all focus:outline-none cursor-pointer ${
              activeTab === 'add_product'
                ? 'bg-white dark:bg-slate-900 text-[#1E3A8A] border-[#1E3A8A] translate-y-0.5 z-10'
                : 'bg-slate-100/60 dark:bg-slate-800/40 text-slate-400 border-transparent hover:text-slate-600'
            }`}
          >
            {activeEditingProductId ? '🔧 Update Active Product' : '➕ Register Single Product'}
          </button>
          <button
            type="button"
            onClick={() => handleWorkspaceTabSwitch('add_package')}
            className={`px-4 py-2.5 rounded-t-xl text-[10px] font-black uppercase tracking-wider border-2 border-b-0 transition-all focus:outline-none cursor-pointer ${
              activeTab === 'add_package'
                ? 'bg-white dark:bg-slate-900 text-[#1E3A8A] border-[#1E3A8A] translate-y-0.5 z-10'
                : 'bg-slate-100/60 dark:bg-slate-800/40 text-slate-400 border-transparent hover:text-slate-600'
            }`}
          >
            {activeEditingPackageId ? '🔧 Update Active Package' : '📦 Compile Bundle Package'}
          </button>
          <button
            type="button"
            onClick={() => handleWorkspaceTabSwitch('manage_inventory')}
            className={`px-4 py-2.5 rounded-t-xl text-[10px] font-black uppercase tracking-wider border-2 border-b-0 transition-all focus:outline-none cursor-pointer ${
              activeTab === 'manage_inventory'
                ? 'bg-white dark:bg-slate-900 text-[#1E3A8A] border-[#1E3A8A] translate-y-0.5 z-10'
                : 'bg-slate-100/60 dark:bg-slate-800/40 text-slate-400 border-transparent hover:text-slate-600'
            }`}
          >
            📋 Manage Live Catalog ({productsList.length})
          </button>
          <button
            type="button"
            onClick={() => handleWorkspaceTabSwitch('trash')}
            className={`px-4 py-2.5 rounded-t-xl text-[10px] font-black uppercase tracking-wider border-2 border-b-0 transition-all focus:outline-none cursor-pointer ${
              activeTab === 'trash'
                ? 'bg-white dark:bg-slate-900 text-[#1E3A8A] border-[#1E3A8A] translate-y-0.5 z-10'
                : 'bg-slate-100/60 dark:bg-slate-800/40 text-slate-400 border-transparent hover:text-slate-600'
            }`}
          >
            🗑️ Trash Bin ({deletedProductsList.length})
          </button>
        </div>
        <div className="bg-white dark:bg-slate-900 border-2 border-[#1E3A8A] rounded-2xl p-5 sm:p-6 shadow-xs animate-fade">

          {activeTab === 'add_product' && (
            <form onSubmit={handleProductFormSubmission} className="space-y-6 text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                <div className="lg:col-span-8 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 block tracking-widest">Garment Asset Name / Title String:</label>
                      <input type="text" name="name" value={productForm.name} onChange={handleItemValueInputChange} placeholder="e.g. Classic Anti-Microbial Top" className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2.5 text-slate-800 dark:text-white normal-case focus:outline-none focus:border-[#1E3A8A]" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 block tracking-widest">Item Classification Category Group:</label>
                      <input type="text" name="category" value={productForm.category} onChange={handleItemValueInputChange} placeholder="e.g. Premium Scrubs, Lab Coats" className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2.5 text-slate-800 dark:text-white normal-case focus:outline-none focus:border-[#1E3A8A]" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 block tracking-widest">Baseline Price Parameter (KES):</label>
                      <div className="relative"><DollarSign className="h-4 w-4 absolute left-2.5 top-3.5 text-slate-400" /><input type="number" name="price" value={productForm.price} onChange={handleItemValueInputChange} placeholder="3500" className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2.5 pl-8 text-slate-800 dark:text-white focus:outline-none focus:border-[#1E3A8A]" /></div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 block tracking-widest">Available Warehouse Stock Count:</label>
                      <input type="number" name="stock_quantity" value={productForm.stock_quantity} onChange={handleItemValueInputChange} placeholder="45" className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2.5 text-slate-800 dark:text-white focus:outline-none focus:border-[#1E3A8A]" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-1"><Layers className="h-3.5 w-3.5 text-[#1E3A8A]" /><label className="text-[9px] font-black text-slate-400 block tracking-widest">Fit Sizes Available (Comma Separated):</label></div>
                      <input type="text" name="sizes_input" value={productForm.sizes_input} onChange={handleItemValueInputChange} placeholder="S, M, L, XL" className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2.5 text-slate-800 dark:text-white focus:outline-none focus:border-[#1E3A8A]" />
                      <span className="text-[8px] font-medium tracking-wide text-slate-400 block normal-case italic">Type standard entries. Leave empty if there are no size modifications for this specific clinical asset profile loop</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-1"><Palette className="h-3.5 w-3.5 text-[#1E3A8A]" /><label className="text-[9px] font-black text-slate-400 block tracking-widest">Fabric Colors Available (Comma Separated):</label></div>
                      <input type="text" name="colors_input" value={productForm.colors_input} onChange={handleItemValueInputChange} placeholder="Navy, Royal Blue, Hunter Green" className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2.5 text-slate-800 dark:text-white focus:outline-none focus:border-[#1E3A8A]" />
                      <span className="text-[8px] font-medium tracking-wide text-slate-400 block normal-case italic">Type color tokens cleanly. Empty fields won't print option buttons onto customer lookup sheets!</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 block tracking-widest">Comprehensive Product Descriptive Specification Text:</label>
                    <textarea rows="3" name="description" value={productForm.description} onChange={handleItemValueInputChange} placeholder="Type fabric weave density specifications, utility storage pockets details, or performance summaries..." className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2.5 text-slate-800 dark:text-white normal-case focus:outline-none focus:border-[#1E3A8A] resize-none" />
                  </div>

                  <div className="bg-sky-50/40 dark:bg-slate-800/50 border-2 border-dashed border-[#1E3A8A]/30 p-4 rounded-xl flex items-center justify-between select-none">
                  <div className="space-y-0.5 max-w-[80%]">
                    <span className="text-[10px] font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center">
                      <Scissors className="h-4 w-4 mr-1 text-[#1E3A8A]" />
                      <span>Enable Custom Measurement Specifications Box</span>
                      </span>
                      <p className="text-[9px] text-slate-400 normal-case font-medium">
                        Tick this parameter box to allow store personnel and public customers to input specific tailoring scopes for this specific item row bundle
                        </p>
                        </div>

                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                          type="checkbox"
                          name="has_custom_measurements"
                          checked={productForm.has_custom_measurements === true || productForm.has_custom_measurements === 'true'}
                          onChange={handleItemValueInputChange}
                          className="sr-only peer"

                          />
                          <div className="w-9 h-5 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#1E3A8A]"></div>
                          </label>
                          </div>

                </div>
                <div className="lg:col-span-4 space-y-4">

                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 block tracking-widest">Product Catalog Photo Asset:</label>
                    <div onDragOver={handleDragOverActiveBoundary} onDragLeave={handleDragLeaveActiveBoundary} onDrop={handleProductImageFileDropAction} className={`border-2 border-dashed rounded-2xl p-4 text-center flex flex-col items-center justify-center min-h-35 transition-colors relative group ${isDragOverActive ? 'border-[#1E3A8A] bg-sky-50/10' : 'border-slate-200 dark:border-slate-800 bg-slate-50/30'}`}>
                      {productImagePreview ? (
                        <div className="w-full h-full relative"><img src={productImagePreview} alt="" className="max-h-28 object-contain mx-auto rounded-lg" /><button type="button" onClick={() => { setProductImageFile(null); setProductImagePreview(''); }} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white p-1 rounded-lg opacity-80 hover:opacity-100"><Trash2 className="h-3.5 w-3.5" /></button></div>
                      ) : (
                        <div className="space-y-2 cursor-pointer"><Upload className="h-6 w-6 text-slate-300 mx-auto group-hover:scale-105 transition-transform" /><p className="text-[9px] tracking-wide text-slate-400 normal-case font-medium">Drag & Drop visual file or <span className="text-[#1E3A8A] font-black underline">Browse Local Depot</span></p><input type="file" accept="image/*" onChange={handleProductImageFileSelection} className="absolute inset-0 opacity-0 cursor-pointer" /></div>
                      )}
                    </div>
                  </div>

                  <div className="border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-slate-50/40 dark:bg-slate-800/30 space-y-3">
                    <div className="flex items-center justify-between pb-1.5 border-b border-dashed dark:border-slate-800"><span className="text-[10px] font-black tracking-wider uppercase text-slate-800 dark:text-white flex items-center"><Sparkles className="h-3.5 w-3.5 mr-1 text-amber-500 animate-bounce" /> Flash Offer Markdown</span><label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" name="is_on_offer" checked={productForm.is_on_offer} onChange={handleItemValueInputChange} className="sr-only peer" /><div className="w-7 h-4 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#1E3A8A]"></div></label></div>

                    {productForm.is_on_offer && (
                      <div className="space-y-2.5 animate-scale">
                        <div className="space-y-1"><label className="text-[9px] text-slate-400 block tracking-widest">Markdown Promo Price (KES):</label><input type="number" name="offer_price" value={productForm.offer_price} onChange={handleItemValueInputChange} placeholder="2900" className="w-full bg-white dark:bg-slate-800 border rounded-xl p-2 text-slate-800 dark:text-white focus:outline-none" /></div>
                        <div className="space-y-1"><label className="text-[9px] text-slate-400 block tracking-widest">Offer Expiry Deadline Date:</label><div className="relative"><Calendar className="h-3.5 w-3.5 absolute left-2 top-2.5 text-slate-400" /><input type="date" name="offer_expiry_date" value={productForm.offer_expiry_date} onChange={handleItemValueInputChange} className="w-full bg-white dark:bg-slate-800 border rounded-xl p-2 pl-7 text-slate-800 dark:text-white font-mono focus:outline-none" /></div></div>
                        <div className="space-y-1"><label className="text-[9px] text-slate-400 block tracking-widest">Offer Expiry Time Target:</label><div className="relative"><Clock className="h-3.5 w-3.5 absolute left-2 top-2.5 text-slate-400" /><input type="time" name="offer_expiry_time" value={productForm.offer_expiry_time} onChange={handleItemValueInputChange} className="w-full bg-white dark:bg-slate-800 border rounded-xl p-2 pl-7 text-slate-800 dark:text-white font-mono focus:outline-none" /></div></div>
                      </div>
                    )}
                  </div>

                </div>
              </div>

              <div className="pt-4 border-t flex items-center justify-end gap-3">
                <button type="button" onClick={handleClearProductFormWorkspace} className="px-5 py-3 border rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors uppercase tracking-widest text-[9px] focus:outline-none cursor-pointer">Reset Workspace</button>
                <button type="submit" disabled={actionLoading} className="px-6 py-3 bg-[#1E3A8A] hover:bg-[#1D4ED8] disabled:bg-slate-300 text-white rounded-xl uppercase tracking-widest text-[9px] font-black shadow-xs flex items-center space-x-1.5 focus:outline-none cursor-pointer transition-colors">{actionLoading ? <RefreshCw className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}<span>{activeEditingProductId ? 'Commit Modified Record Changes' : 'Publish Product Record to Live Catalog'}</span></button>
              </div>
            </form>
          )}
          {activeTab === 'add_package' && (
            <form onSubmit={handlePackageFormSubmission} className="space-y-6 text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                <div className="lg:col-span-8 space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 block tracking-widest">Promotional Bundle Title Name:</label>
                      <input type="text" name="name" value={packageForm.name} onChange={handleBundleValueInputChange} placeholder="e.g. Intern Doctor Full Starter Kit" className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2.5 text-slate-800 dark:text-white normal-case focus:outline-none focus:border-[#1E3A8A]" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 block tracking-widest">Bundle Combined Pricing Value (KES):</label>
                      <div className="relative"><DollarSign className="h-4 w-4 absolute left-2.5 top-3.5 text-slate-400" /><input type="number" name="package_price" value={packageForm.package_price} onChange={handleBundleValueInputChange} placeholder="8500" className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2.5 pl-8 text-slate-800 dark:text-white focus:outline-none focus:border-[#1E3A8A]" /></div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 block tracking-widest">Available Package Stock Count:</label>
                    <input type="number" name="stock_quantity" value={packageForm.stock_quantity} onChange={handleBundleValueInputChange} placeholder="7" className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2.5 text-slate-800 dark:text-white focus:outline-none focus:border-[#1E3A8A]" />
                    <span className="text-[8px] font-medium tracking-wide text-slate-400 block normal-case italic">How many of this exact bundle can be sold. This is independent of the individual component product stock below.</span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 block tracking-widest">Bundle Offer Brief Marketing Hook / Description:</label>
                    <textarea rows="2" name="description" value={packageForm.description} onChange={handleBundleValueInputChange} placeholder="Describe what components make this medical outfit kit combination highly valuable..." className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2.5 text-slate-800 dark:text-white normal-case focus:outline-none focus:border-[#1E3A8A] resize-none" />
                  </div>

                  <div className="border-2 border-[#1E3A8A]/20 bg-slate-50/30 dark:bg-slate-800/10 p-4 rounded-2xl space-y-3">
                    <div className="flex justify-between items-center pb-2 border-b dark:border-slate-800">
                      <div className="flex items-center space-x-1.5"><Package className="h-4 w-4 text-[#1E3A8A]" /><span className="text-[10px] font-black tracking-wider text-slate-800 dark:text-white">Aggregate Package Component Assets Matrix:</span></div>
                      <button type="button" onClick={handleAddProductRowToPackageList} className="px-3 py-1.5 bg-[#1E3A8A] text-white rounded-lg text-[8px] font-black tracking-widest flex items-center space-x-1 hover:bg-[#1D4ED8] focus:outline-none cursor-pointer"><Plus className="h-3 w-3" /><span>Append Component Row</span></button>
                    </div>

                    <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                      {selectedPackageItems.length === 0 ? (
                        <div className="text-center py-6 text-slate-400 font-medium normal-case italic">No products added yet. Click append above to build your custom package array.</div>
                      ) : (
                        selectedPackageItems.map((item, idx) => (
                          <div key={`bundle-row-item-${idx}`} className="flex flex-row items-center gap-3 bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200/80 dark:border-slate-700 animate-fade">
                            <div className="grow grid grid-cols-1 sm:grid-cols-3 gap-2">
                              <div className="sm:col-span-2 space-y-0.5">
                                <label className="text-[8px] font-black text-slate-400 block tracking-wider">Select Available Store Item:</label>
                                <select value={item.product_id} onChange={(e) => handlePackageRowValueOverride(idx, 'product_id', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border text-[11px] font-black uppercase p-2 rounded-lg text-slate-700 dark:text-white focus:outline-none cursor-pointer">
                                  <option value="">-- Choose From Storage --</option>
                                  {productsList.map(p => <option key={`pkg-select-${p.id}`} value={p.id}>{p.name} (Qty: {p.stock_quantity})</option>)}
                                </select>
                              </div>
                              <div className="space-y-0.5">
                                <label className="text-[8px] font-black text-slate-400 block tracking-wider">Pack Quantity count:</label>
                                <input type="number" min="1" value={item.quantity} onChange={(e) => handlePackageRowValueOverride(idx, 'quantity', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border text-[11px] p-1.5 rounded-lg text-slate-800 dark:text-white focus:outline-none" />
                              </div>
                            </div>
                            <button type="button" onClick={() => handleRemoveProductRowFromPackageList(idx)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 border border-transparent hover:border-red-100 rounded-xl mt-3.5 focus:outline-none cursor-pointer" title="Purge row"><Trash2 className="h-3.5 w-3.5" /></button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-4 space-y-4">

                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 block tracking-widest">Bundle Promotional Display Graphic:</label>
                    <div onDragOver={handleDragOverActiveBoundary} onDragLeave={handleDragLeaveActiveBoundary} onDrop={handlePackageImageFileDropAction} className={`border-2 border-dashed rounded-2xl p-4 text-center flex flex-col items-center justify-center min-h-35 transition-colors relative group ${isDragOverActive ? 'border-[#1E3A8A] bg-sky-50/10' : 'border-slate-200 dark:border-slate-800 bg-slate-50/30'}`}>
                      {packageImagePreview ? (
                        <div className="w-full h-full relative"><img src={packageImagePreview} alt="" className="max-h-28 object-contain mx-auto rounded-lg" /><button type="button" onClick={() => { setPackageImageFile(null); setPackageImagePreview(''); }} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white p-1 rounded-lg opacity-80 hover:opacity-100"><Trash2 className="h-3.5 w-3.5" /></button></div>
                      ) : (
                        <div className="space-y-2 cursor-pointer"><Upload className="h-6 w-6 text-slate-300 mx-auto group-hover:scale-105 transition-transform" /><p className="text-[9px] tracking-wide text-slate-400 normal-case font-medium">Drag & Drop bundle photo or <span className="text-[#1E3A8A] font-black underline">Browse Local Depot</span></p><input type="file" accept="image/*" onChange={handlePackageImageFileSelection} className="absolute inset-0 opacity-0 cursor-pointer" /></div>
                      )}
                    </div>
                  </div>

                  <div className="border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-slate-50/40 dark:bg-slate-800/30 space-y-3">
                    <div className="flex items-center justify-between pb-1.5 border-b border-dashed dark:border-slate-800"><span className="text-[10px] font-black tracking-wider uppercase text-slate-800 dark:text-white flex items-center"><Clock className="h-3.5 w-3.5 mr-1 text-purple-500 animate-pulse" /> Time-Limited Package</span><label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" name="is_time_limited" checked={packageForm.is_time_limited} onChange={handleBundleValueInputChange} className="sr-only peer" /><div className="w-7 h-4 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#1E3A8A]"></div></label></div>

                    {packageForm.is_time_limited && (
                      <div className="space-y-2.5 animate-scale">
                        <div className="space-y-1"><label className="text-[9px] text-slate-400 block tracking-widest">Launch Start Date:</label><div className="relative"><Calendar className="h-3.5 w-3.5 absolute left-2 top-2.5 text-slate-400" /><input type="date" name="available_from_date" value={packageForm.available_from_date} onChange={handleBundleValueInputChange} className="w-full bg-white dark:bg-slate-800 border rounded-xl p-2 pl-7 text-slate-800 dark:text-white font-mono focus:outline-none" /></div></div>
                        <div className="space-y-1"><label className="text-[9px] text-slate-400 block tracking-widest">Expiration Closing Date:</label><div className="relative"><Calendar className="h-3.5 w-3.5 absolute left-2 top-2.5 text-slate-400" /><input type="date" name="available_until_date" value={packageForm.available_until_date} onChange={handleBundleValueInputChange} className="w-full bg-white dark:bg-slate-800 border rounded-xl p-2 pl-7 text-slate-800 dark:text-white font-mono focus:outline-none" /></div></div>
                        <div className="space-y-1"><label className="text-[9px] text-slate-400 block tracking-widest">Expiration Closing Time:</label><div className="relative"><Clock className="h-3.5 w-3.5 absolute left-2 top-2.5 text-slate-400" /><input type="time" name="available_until_time" value={packageForm.available_until_time} onChange={handleBundleValueInputChange} className="w-full bg-white dark:bg-slate-800 border rounded-xl p-2 pl-7 text-slate-800 dark:text-white font-mono focus:outline-none" /></div></div>
                      </div>
                    )}
                  </div>

                </div>
              </div>

              <div className="pt-4 border-t flex items-center justify-end gap-3">
                <button type="button" onClick={handleClearPackageFormWorkspace} className="px-5 py-3 border rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors uppercase tracking-widest text-[9px] focus:outline-none cursor-pointer">Clear Package Board</button>
                <button type="submit" disabled={actionLoading} className="px-6 py-3 bg-[#1E3A8A] hover:bg-[#1D4ED8] disabled:bg-slate-300 text-white rounded-xl uppercase tracking-widest text-[9px] font-black shadow-xs flex items-center space-x-1.5 focus:outline-none cursor-pointer transition-colors">{actionLoading ? <RefreshCw className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}<span>{activeEditingPackageId ? 'Commit Package Changes' : 'Publish Promotional Bundle Pack'}</span></button>
              </div>
            </form>
          )}

          {activeTab === 'manage_inventory' && (
            <div className="space-y-8 animate-fade">

              <div className="space-y-3">
                <div className="pb-1.5 border-b border-dashed border-slate-200 dark:border-slate-800 flex items-center space-x-1.5">
                  <ClipboardList className="h-4 w-4 text-[#1E3A8A]" />
                  <h3 className="font-black text-xs uppercase tracking-wider text-slate-400">Published Practitioner Uniforms & Items Directory</h3>
                </div>

                <div className="overflow-x-auto border-2 border-slate-100 dark:border-slate-800 rounded-2xl bg-slate-50/20">
                  <table className="w-full text-left border-collapse text-[11px] font-bold uppercase tracking-wide text-slate-500">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 dark:text-slate-400 text-[9px] border-b border-slate-200 dark:border-slate-800 uppercase tracking-widest">
                        <th className="p-3">Clinical Asset Summary</th>
                        <th className="p-3">Department Category</th>
                        <th className="p-3">Attributes Matrix</th>
                        <th className="p-3 text-right">Value Pricing</th>
                        <th className="p-3 text-center">Warehouse Stocks</th>
                        <th className="p-3 text-center">Action Console</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-600 dark:text-slate-300">
                      {productsList.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="text-center py-12 text-slate-400 font-bold uppercase text-[9px] tracking-wider italic">
                            No medical items registered inside your database tables index records.
                          </td>
                        </tr>
                      ) : (
                        productsList.map((product) => {
                          const stockCount = parseInt(product.stock_quantity || 0, 10);

                          const cleanSizes = Array.isArray(product.sizes_available)
                            ? product.sizes_available.join(', ')
                            : String(product.sizes_available || '').replace(/[{}"[\]']/g, '').replace('__CUSTOM_MEASUREMENT_ENABLED__,', '').trim();

                          const cleanColors = Array.isArray(product.colors_available)
                            ? product.colors_available.join(', ')
                            : String(product.colors_available || '').replace(/[{}"[\]']/g, '').trim();

                          const sanitizeAndExtractNum = (rawVal) => {
                            if (rawVal === undefined || rawVal === null || rawVal === '') return 0.0;
                            const pureNumericString = String(rawVal).replace(/[^0-9.]/g, '').trim();
                            const parsedOutput = parseFloat(pureNumericString);
                            return isNaN(parsedOutput) ? 0.0 : parsedOutput;
                          };

                          const originalPriceNum = sanitizeAndExtractNum(product.price || product.Price);

                          const offerPriceNum = sanitizeAndExtractNum(
                            product.discount_price ||
                            product.discounted_price ||
                            product.offer_price ||
                            product.Offer_Price ||
                            product.OFFER_PRICE
                          );

                          const isCurrentlyFeatured = product.is_featured === true || String(product.is_featured).toLowerCase() === 'true';

                          return (
                            <tr key={`manage-item-row-${product.id}`} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                              <td className="p-3 flex items-center space-x-2.5">
                                <div className="h-9 w-9 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg overflow-hidden flex items-center justify-center shrink-0">
                                  {product.image_url ? (
                                    <img src={product.image_url} alt="" className="object-contain h-full w-full" />
                                  ) : (
                                    <Package className="h-4 w-4 text-slate-300" />
                                  )}
                                </div>
                                <div className="truncate max-w-40">
                                  <span className="block font-black text-slate-800 dark:text-white uppercase truncate" title={product.name}>{product.name}</span>
                                  {product.is_on_offer && (
                                    <span className="bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[7px] font-black px-1 py-0.5 rounded tracking-widest block w-max mt-0.5 animate-pulse">⚡ SPECIAL FLASH SALE</span>
                                  )}
                                </div>
                              </td>
                              <td className="p-3"><span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md text-slate-500 dark:text-slate-400">{product.category}</span></td>
                              <td className="p-3 space-y-0.5 font-normal tracking-normal text-slate-400 normal-case">
                                {cleanSizes && <div className="text-[10px]"><span className="font-bold uppercase text-[9px] tracking-wider text-slate-500 dark:text-slate-400">Sizes:</span> {cleanSizes}</div>}
                                {cleanColors && <div className="text-[10px]"><span className="font-bold uppercase text-[9px] tracking-wider text-slate-500 dark:text-slate-400">Colors:</span> {cleanColors}</div>}
                                {String(product.sizes_available).includes('__CUSTOM_MEASUREMENT_ENABLED__') && <div className="text-[8px] font-black uppercase text-sky-500 tracking-wider flex items-center">✂️ Custom Sizing Activated</div>}
                              </td>
                              <td className="p-3 text-right font-mono font-black text-[#1E3A8A] dark:text-sky-400 text-xs">
                                {product.is_on_offer && offerPriceNum > 0 ? (
                                  <div className="flex flex-col items-end">
                                    <span className="text-[9px] text-slate-400 dark:text-slate-500 line-through">Orig: KES {Number(originalPriceNum || 0).toLocaleString()}</span>
                                    <span className="text-amber-600 dark:text-amber-400">
                                      <span className="font-sans font-bold text-[8px] uppercase tracking-wider mr-0.5">New Price:</span>
                                      KES {Number(offerPriceNum || 0).toLocaleString()}
                                    </span>
                                  </div>
                                ) : (
                                  <span>KES {Number(originalPriceNum || 0).toLocaleString()}</span>
                                )}
                              </td>
                              <td className="p-3 text-center">
                                <span className={`text-[9px] px-2 py-0.5 rounded-md font-black tracking-widest uppercase ${
                                  stockCount <= 0
                                    ? 'bg-red-50 text-red-500 border border-red-100 dark:bg-red-950/20'
                                    : stockCount <= 5
                                      ? 'bg-amber-50 text-amber-600 border border-amber-100 dark:bg-amber-950/20'
                                      : 'bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-950/20'
                                }`}>
                                  {stockCount <= 0 ? 'SOLD OUT' : `${stockCount} LEFT`}
                                </span>
                              </td>
                              <td className="p-3 text-center">
                                <div className="flex items-center justify-center space-x-1.5">
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      setActionLoading(true);
                                      try {
                                        const patchResponse = await fetch(`${API_BASE_URL}/api/products/${product.id}`, {
                                          method: 'PUT',
                                          headers: { 'Authorization': 'Bearer ' + admin.token, 'Content-Type': 'application/json' },
                                          body: JSON.stringify({ is_featured: !isCurrentlyFeatured })
                                        });
                                        if (patchResponse.ok) {
                                          setSuccessNotice("Moving reel screen display state variables adjusted successfully!");
                                          syncRepositoryRecords();
                                        }
                                      } catch (e) { setErrorNotice("Reel switch server transaction dropped."); }
                                      finally { setActionLoading(false); }
                                    }}
                                    className={`p-1.5 border rounded-lg transition-all transform hover:scale-105 cursor-pointer focus:outline-none flex items-center justify-center ${
                                      isCurrentlyFeatured
                                        ? 'bg-amber-500 border-amber-500 text-white shadow-2xs'
                                        : 'bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-700 text-slate-400 hover:text-amber-500'
                                    }`}
                                    title={isCurrentlyFeatured ? "De-list item from moving screen slider" : "Pin item to feature on moving home page slider"}
                                  >
                                    {isCurrentlyFeatured ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                                  </button>
                                  <button type="button" onClick={() => handleLoadItemToEditWorkspace(product)} className="p-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition-all transform hover:scale-105 cursor-pointer focus:outline-none" title="Edit row item"><Edit2 className="h-3.5 w-3.5" /></button>
                                  <button type="button" onClick={() => handleDeleteProductRecord(product.id)} className="p-1.5 border border-red-100 dark:border-red-950 bg-red-50/20 text-red-500 rounded-lg hover:bg-red-50 transition-all transform hover:scale-105 cursor-pointer focus:outline-none" title="Purge row record"><Trash2 className="h-3.5 w-3.5" /></button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="space-y-3 pt-4">
                <div className="pb-1.5 border-b border-dashed border-slate-200 dark:border-slate-800 flex items-center space-x-1.5">
                  <Package className="h-4 w-4 text-[#1E3A8A]" />
                  <h3 className="font-black text-xs uppercase tracking-wider text-slate-400">Published Multi-Product Special Combo Bundles</h3>
                </div>

                <div className="overflow-x-auto border-2 border-slate-100 dark:border-slate-800 rounded-2xl bg-slate-50/20">
                  <table className="w-full text-left border-collapse text-[11px] font-bold uppercase tracking-wide text-slate-500">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 dark:text-slate-400 text-[9px] border-b border-slate-200 dark:border-slate-800 uppercase tracking-widest">
                        <th className="p-3">Bundle Composition Profile</th>
                        <th className="p-3">Nested Items Content Summary</th>
                        <th className="p-3 text-right">Bundle Valuation</th>
                        <th className="p-3 text-center">Fulfillment Restrictions</th>
                        <th className="p-3 text-center">Stock</th>
                        <th className="p-3 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-600 dark:text-slate-300">
                      {packagesList.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="text-center py-10 text-slate-400 font-bold uppercase text-[9px] tracking-wider italic">
                            No active discount bundle packages detected inside your server repositories.
                          </td>
                        </tr>
                      ) : (
                        packagesList.map((pkg) => {
                          let aggregatedComponentsArray;
                          try {
                            aggregatedComponentsArray = typeof pkg.products_summary === 'string'
                              ? JSON.parse(pkg.products_summary || '[]')
                              : (pkg.products_summary || []);
                          } catch (e) {
                            aggregatedComponentsArray = [];
                          }

                          const packageStockCount = parseInt(pkg.stock_quantity || 0, 10);

                          return (
                            <tr key={`manage-pkg-row-${pkg.id}`} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                              <td className="p-3 flex items-center space-x-2.5">
                                <div className="h-9 w-9 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg overflow-hidden flex items-center justify-center shrink-0">
                                  {pkg.image_url ? (
                                    <img src={pkg.image_url} alt="" className="object-contain h-full w-full" />
                                  ) : (
                                    <Sparkles className="h-4 w-4 text-amber-400" />
                                  )}
                                </div>
                                <div className="truncate max-w-45">
                                  <span className="block font-black text-slate-800 dark:text-white uppercase truncate" title={pkg.name}>{pkg.name}</span>
                                  <p className="text-[9px] font-medium tracking-normal text-slate-400 normal-case truncate max-w-42.5" title={pkg.description}>{pkg.description}</p>
                               </div>
                              </td>
                              <td className="p-3">
                                <div className="space-y-0.5 normal-case font-medium text-slate-500 dark:text-slate-400 text-[10px]">
                                  {aggregatedComponentsArray.map((component, cIdx) => {
                                    const linkedProductProfile = productsList.find(p => String(p.id) === String(component.product_id));
                                    return (
                                      <div key={`pkg-row-item-summary-${cIdx}`} className="flex items-center space-x-1 uppercase text-[9px] font-bold text-slate-400">
                                        <ChevronRight className="h-2.5 w-2.5 text-[#1E3A8A]" />
                                        <span className="text-slate-700 dark:text-slate-300">{component.quantity}x</span>
                                        <span className="truncate max-w-35">{linkedProductProfile ? linkedProductProfile.name : `Product ID #${component.product_id}`}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </td>
                              <td className="p-3 text-right font-mono font-black text-[#1E3A8A] dark:text-sky-400">
                                KES {Number(pkg.price || 0).toLocaleString()}
                              </td>
                              <td className="p-3 text-center">
                                {pkg.is_time_limited ? (
                                  <div className="flex flex-col items-center space-y-1.5 font-mono text-[9px] text-purple-600 dark:text-purple-400">
                                    <span className="bg-purple-50 dark:bg-purple-950/20 px-2 py-0.5 rounded border border-purple-100 font-sans font-black text-[8px] tracking-widest">⏰ EXPIRES</span>
                                    <span>Until: {pkg.available_until_date || 'N/A'}</span>

                                    {renewingPackageId === pkg.id ? (
                                      <div className="flex items-center space-x-1 pt-1">
                                        <input
                                          type="date"
                                          value={renewDate}
                                          onChange={(e) => setRenewDate(e.target.value)}
                                          className="bg-white dark:bg-slate-800 border rounded px-1 py-0.5 text-[9px] font-mono"
                                        />
                                        <button type="button" onClick={() => handleRenewPackage(pkg)} className="bg-emerald-600 text-white px-2 py-0.5 rounded font-black text-[8px] cursor-pointer">Save</button>
                                        <button type="button" onClick={() => { setRenewingPackageId(null); setRenewDate(''); }} className="text-slate-400 text-[8px] cursor-pointer">Cancel</button>
                                      </div>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => { setRenewingPackageId(pkg.id); setRenewDate(pkg.available_until_date || ''); }}
                                        className="bg-sky-50 dark:bg-sky-950/20 text-sky-600 border border-sky-100 px-2 py-0.5 rounded font-sans font-black text-[8px] tracking-widest cursor-pointer hover:bg-sky-100"
                                      >
                                        🔄 Renew
                                      </button>
                                    )}
                                  </div>
                                ) : (
                                  <span className="bg-slate-100 dark:bg-slate-800 text-slate-400 text-[8px] font-black tracking-widest px-2 py-0.5 rounded-md">♾️ PERPETUAL STOCK</span>
                                )}
                              </td>
                              <td className="p-3 text-center">
                                <span className={`text-[9px] px-2 py-0.5 rounded-md font-black tracking-widest uppercase ${
                                  packageStockCount <= 0
                                    ? 'bg-red-50 text-red-500 border border-red-100 dark:bg-red-950/20'
                                    : packageStockCount <= 3
                                      ? 'bg-amber-50 text-amber-600 border border-amber-100 dark:bg-amber-950/20'
                                      : 'bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-950/20'
                                }`}>
                                  {packageStockCount <= 0 ? 'SOLD OUT' : `${packageStockCount} LEFT`}
                                </span>
                              </td>
                              <td className="p-3 text-center">
                                <div className="flex items-center justify-center space-x-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleLoadPackageToEditWorkspace(pkg)}
                                    className="p-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition-all transform hover:scale-105 cursor-pointer focus:outline-none"
                                    title="Edit this package"
                                  >
                                    <Edit2 className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeletePackageRecord(pkg.id)}
                                    className="p-1.5 border border-red-100 dark:border-red-950 bg-red-50/20 text-red-500 rounded-lg hover:bg-red-50 transition-all transform hover:scale-105 cursor-pointer focus:outline-none"
                                    title="Permanently delete this package"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {activeTab === 'trash' && (
            <div className="space-y-3 animate-fade">
              <div className="pb-1.5 border-b border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                  <Trash2 className="h-4 w-4 text-red-500" />
                  <h3 className="font-black text-xs uppercase tracking-wider text-slate-400">Deleted Products Trash Bin</h3>
                </div>
                <button
                  type="button"
                  onClick={fetchTrashRecords}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 border rounded-lg text-[9px] font-black uppercase tracking-wider cursor-pointer flex items-center space-x-1"
                >
                  <RefreshCw className={`h-3 w-3 ${trashLoading ? 'animate-spin' : ''}`} />
                  <span>Refresh Trash</span>
                </button>
              </div>

              <p className="text-[9px] text-slate-400 font-medium normal-case italic">
                Products deleted from the live catalog land here first. Restore them back to the store, or delete them permanently — permanent deletion cannot be undone.
              </p>

              <div className="overflow-x-auto border-2 border-slate-100 dark:border-slate-800 rounded-2xl bg-slate-50/20">
                <table className="w-full text-left border-collapse text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 text-[9px] border-b border-slate-200 dark:border-slate-800 uppercase tracking-widest">
                      <th className="p-3">Deleted Item</th>
                      <th className="p-3">Category</th>
                      <th className="p-3 text-right">Price</th>
                      <th className="p-3 text-center">Stock at Deletion</th>
                      <th className="p-3 text-center">Restore / Purge</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-600 dark:text-slate-300">
                    {deletedProductsList.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="text-center py-12 text-slate-400 font-bold uppercase text-[9px] tracking-wider italic">
                          Trash bin is empty — nothing deleted right now.
                        </td>
                      </tr>
                    ) : (
                      deletedProductsList.map((product) => (
                        <tr key={`trash-row-${product.id}`} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="p-3 flex items-center space-x-2.5">
                            <div className="h-9 w-9 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg overflow-hidden flex items-center justify-center shrink-0">
                              {product.image_url ? (
                                <img src={product.image_url} alt="" className="object-contain h-full w-full opacity-60" />
                              ) : (
                                <Package className="h-4 w-4 text-slate-300" />
                              )}
                            </div>
                            <span className="block font-black text-slate-500 dark:text-slate-400 uppercase truncate max-w-40" title={product.name}>
                              {product.name}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md text-slate-500 dark:text-slate-400">{product.category}</span>
                          </td>
                          <td className="p-3 text-right font-mono font-black text-slate-500 text-xs">
                            KES {Number(product.price || 0).toLocaleString()}
                          </td>
                          <td className="p-3 text-center">
                            <span className="text-[9px] px-2 py-0.5 rounded-md font-black tracking-widest uppercase bg-slate-100 text-slate-500 dark:bg-slate-800">
                              {parseInt(product.stock_quantity || 0, 10)}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center space-x-1.5">
                              <button
                                type="button"
                                onClick={() => handleRestoreProduct(product.id)}
                                className="px-2.5 py-1.5 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-wide cursor-pointer transition-all"
                                title="Restore to live catalog"
                              >
                                ♻️ Restore
                              </button>
                              <button
                                type="button"
                                onClick={() => handlePermanentlyDeleteProduct(product.id)}
                                className="px-2.5 py-1.5 border border-red-100 bg-red-50/20 hover:bg-red-50 text-red-500 rounded-lg text-[9px] font-black uppercase tracking-wide cursor-pointer transition-all"
                                title="Permanently delete"
                              >
                                🔥 Purge
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}