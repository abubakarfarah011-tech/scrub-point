import { useCallback, useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ApiService } from '../services/api';
import {
  Filter, SlidersHorizontal, RefreshCw, AlertCircle,
  ChevronRight, Tag, Percent, GraduationCap, Grid, Package, Sparkles, Search
} from 'lucide-react';
import ProductCard from '../components/ProductCard';

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const currentCategoryFilter = searchParams.get('category') || '';
  const currentSearchTerm = searchParams.get('search') || '';
  const currentSortSelection = searchParams.get('sort') || 'newest';

  const loadCatalogData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await ApiService.products.getAll(1, 100, currentCategoryFilter, currentSearchTerm, currentSortSelection);
      if (response.success) {
        setProducts(response.data || []);
      } else {
        setError('Could not populate active catalog portfolio registries.');
      }

      const catResponse = await ApiService.categories.getAll();
      if (catResponse.success) {
        setCategories(catResponse.data || []);
      }
    } catch (err) {
      setError('Could not connect to the remote storefront database engines.');
    } finally {
      setLoading(false);
    }
  }, [currentCategoryFilter, currentSearchTerm, currentSortSelection]);

  useEffect(() => {
  loadCatalogData();
}, [loadCatalogData]);

  const handleQueryStateChange = (key, value) => {
    setSearchParams(prev => {
      const updatedParams = new URLSearchParams(prev);
      if (value) {
        updatedParams.set(key, value);
      } else {
        updatedParams.delete(key);
      }
      return updatedParams;
    });
  };

  const handleResetAllFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  const activePromoOffers = products.filter(p => p.is_on_offer && !p.is_student_package);
  const activeStudentPackages = products.filter(p => p.is_student_package);
  const standardRegularProducts = products.filter(p => !p.is_on_offer && !p.is_student_package);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B192C] text-slate-800 dark:text-slate-100 antialiased font-sans pb-32 transition-colors duration-200">

      <section className="relative overflow-hidden bg-[#1E3A8A] text-white py-14 px-4 sm:px-6 lg:px-8 border-b border-[#1D4ED8] shadow-lg">
        <div className="absolute inset-0 bg-white/5 pointer-events-none" />

        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-4 w-4 text-slate-200 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-200">
                Scrub Point Products Catalog
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-white leading-none">
              Professional Store Catalog
            </h1>
            <p className="text-slate-200 text-xs sm:text-sm font-medium leading-relaxed max-w-2xl uppercase tracking-wide">
              Browse anti-microbial practitioner scrubs, diagnostic equipment kits, and multi-product value bundle kits.
            </p>
          </div>

          {currentCategoryFilter && (
            <div className="flex items-center space-x-2.5 bg-white/10 px-4 py-2.5 rounded-xl border border-white/10 text-xs font-black uppercase tracking-widest backdrop-blur-md animate-fade shrink-0">
              <span className="text-slate-200">Active Category:</span>
              <span className="text-white bg-[#1D4ED8] px-3 py-1 rounded-lg border border-white/20 shadow-md">
                {currentCategoryFilter}
              </span>
            </div>
          )}
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* 🧭 SIDEBAR SEARCH FILTER PANEL MODULE CONTAINER */}
          <aside className="lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 p-5 rounded-2xl shadow-sm space-y-6">

            <div className="pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300">
                <Filter className="h-4 w-4 text-slate-400" />
                <h3 className="font-black text-xs uppercase tracking-wider">Product Categories</h3>
              </div>
              {(currentCategoryFilter || currentSearchTerm) && (
                <button
                  type="button"
                  onClick={handleResetAllFilters}
                  className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-600 transition-colors cursor-pointer"
                >
                  Clear Filters
                </button>
              )}
            </div>

            <div className="space-y-2.5">
              <label className="block text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">Store Departments:</label>
              <div className="flex flex-col space-y-1">
                <button
                  type="button"
                  onClick={() => handleQueryStateChange('category', '')}
                  className={`w-full text-left px-3 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                    !currentCategoryFilter
                      ? 'bg-[#1E3A8A] text-white shadow-sm font-black'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  🌐 Show Full STOCK
                </button>

                {categories.map((catString, idx) => (
                  <button
                    key={`cat-btn-${idx}`}
                    type="button"
                    onClick={() => handleQueryStateChange('category', catString)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider truncate transition-all cursor-pointer ${
                      currentCategoryFilter === catString
                        ? 'bg-[#1E3A8A] text-white shadow-md font-black border border-[#1D4ED8]'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                    }`}
                    title={catString}
                  >
                    💡 {catString}
                  </button>
                ))}
              </div>
            </div>

          </aside>

          <main className="lg:col-span-9 space-y-8 min-w-0">

            {/* SEARCH AND SORT SUB BAR CONTROLLER ACCORDION */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center">
              <div className="w-full sm:max-w-md bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-xl p-2.5 flex items-center relative shadow-inner">
                <Search className="h-4 w-4 text-slate-400 mr-2 shrink-0" />
                <input
                  type="text"
                  value={currentSearchTerm}
                  onChange={(e) => handleQueryStateChange('search', e.target.value)}
                  placeholder="Filter listings by searching keywords..."
                  className="w-full bg-transparent text-xs text-slate-800 dark:text-slate-100 font-medium focus:outline-none placeholder-slate-400"
                />
              </div>

              <div className="flex items-center space-x-2 text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0">
                <SlidersHorizontal className="h-4 w-4 text-slate-400" />
                <span>Sort Our Products by:</span>

                <select
                  value={currentSortSelection}
                  onChange={(e) => handleQueryStateChange('sort', e.target.value)}
                  className="bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 p-2 rounded-xl text-slate-700 dark:text-slate-200 font-black uppercase tracking-wide focus:outline-none focus:border-slate-400 cursor-pointer shadow-sm"
                >
                  <option value="newest">⏰ New Arrivals</option>
                  <option value="price_asc">📈 Price: Low to High</option>
                  <option value="price_desc">📉 Price: High to Low</option>
                  <option value="oldest">⏳ Oldest Entries First</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 space-y-3">
                <RefreshCw className="h-8 w-8 text-slate-400 animate-spin" />
                <p className="text-xs font-black uppercase text-slate-400 tracking-widest">Sifting live product matrices...</p>
              </div>
            ) : error ? (
              <div className="bg-red-50 dark:bg-red-950/20 border-l-4 border-red-500 p-4 rounded-r-xl text-xs text-red-700 dark:text-red-400 font-bold flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                <span>{error}</span>
              </div>
            ) : products.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-16 text-center text-xs text-slate-400 font-bold uppercase shadow-sm">
                <AlertCircle className="h-6 w-6 text-amber-500 mx-auto mb-2 animate-bounce" />
                <p>No store listings found matching your current query parameter selections.</p>
                <button type="button" onClick={handleResetAllFilters} className="mt-4 text-slate-600 font-black cursor-pointer underline hover:text-slate-700">Wipe constraints and retry</button>
              </div>
            ) : (
              <div className="space-y-12">

                {activeStudentPackages.length > 0 && (
                  <div className="space-y-4 animate-fade pt-4">
                    <div className="flex items-center space-x-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                      <GraduationCap className="h-4.5 w-4.5 text-purple-500" />
                      <h3 className="font-black text-xs uppercase tracking-wider text-slate-400 dark:text-slate-500">Cheaper Intake Internship Combo Packages</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {activeStudentPackages.map(item => (
                        <ProductCard key={`bundle-card-${item.id}`} item={item} />
                      ))}
                    </div>
                  </div>
                )}
                {standardRegularProducts.length > 0 && (
                  <div className="space-y-4 animate-fade pt-4">
                    {(activePromoOffers.length > 0 || activeStudentPackages.length > 0) && (
                      <div className="flex items-center space-x-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                        <Grid className="h-4 w-4 text-slate-400" />
                        <h3 className="font-black text-xs uppercase tracking-wider text-slate-400 dark:text-slate-500">Standard Depot Baseline Catalog Inventory</h3>
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {standardRegularProducts.map(item => (
                        <ProductCard key={`regular-card-${item.id}`} item={item} />
                      ))}
                    </div>
                  </div>
                )}

              </div>
            )}
          </main>

        </div>
      </div>
    </div>
  );
}
