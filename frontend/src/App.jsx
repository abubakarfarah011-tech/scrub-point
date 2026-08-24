import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/useAuth';
import { CartProvider } from './context/CartContext';
import { useEffect, useState } from 'react';

import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import About from './pages/About';
import Contact from './pages/Contact';
import Footer from './components/Footer';

import AdminLogin from './admin/AdminLogin';
import AdminDashboard from './admin/AdminDashboard';
import InventoryManager from './admin/InventoryManager';
import DashboardAnalytics from './admin/DashboardAnalytics';

import Navbar from './components/Navbar';

function PublicLayoutFrame({ isDarkMode, onThemeToggle }) {
  return (
    <div className={`min-h-screen flex flex-col justify-between transition-colors duration-200 ${
      isDarkMode ? 'bg-[#0B192C] text-white dark' : 'bg-slate-50 text-slate-800'
    }`}>

      <div className="grow flex flex-col">
        <Navbar isDarkMode={isDarkMode} onThemeToggle={onThemeToggle} />

        <main className={`grow transition-colors duration-200 ${
          isDarkMode
            ? 'bg-[#0B192C] text-slate-100 dark:bg-[#0B192C] dark:text-slate-100'
            : 'bg-slate-50 text-slate-800'
        }`}>
          <Outlet />
        </main>
      </div>

      <footer className="bg-[#1E3A8A] text-white pt-12 pb-6 border-t border-[#1D4ED8] shadow-inner text-[11px] font-medium text-slate-200 select-none z-10 shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8 pb-8 border-b border-[#1D4ED8]">

          <div className="space-y-3">
            <h3 className="font-black text-white text-xs tracking-wider uppercase">Scrub Point Kenya</h3>
            <p className="leading-relaxed max-w-sm uppercase text-[10px] font-bold text-slate-300">
              East Africa's most dedicated marketplace outfitting medical fields with high-weave textile scrubs, diagnostics gear, and medical reference books.
            </p>
            <Footer />
          </div>

          <div className="space-y-2">
            <h4 className="font-black text-white text-xs uppercase tracking-wider">Our Physical Office Headquarters</h4>
            <div className="space-y-1 uppercase font-bold text-slate-300 tracking-wide leading-relaxed">
              <p>📍 NORWICH UNION HOUSE,NEW-WING SECOND FLOOR ,ROOM 01</p>
              <p>KIMATHI LANE,NAIROBI CBD,KENYA</p>
              <p>✉️ Email: <span className="text-white lowercase">info@scrubpoint.co.ke</span></p>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-black text-white text-xs uppercase tracking-wider">Our Operational Hours </h4>
            <div className="space-y-1.5 uppercase font-bold text-slate-300 tracking-wide leading-relaxed">
              <p className="flex justify-between border-b border-[#1D4ED8] pb-0.5"><span>Weekdays (Mon - Fri):</span> <span className="text-white">08:00 AM - 07:00 PM</span></p>
              <p className="flex justify-between border-b border-[#1D4ED8] pb-0.5"><span>Saturdays:</span> <span className="text-white">09:00 AM - 06:00 PM</span></p>
              <p className="flex justify-between pb-0.5"><span>Sundays & Public Holidays:</span> <span className="text-white bg-white/10 px-2 rounded font-black">Closed</span></p>
            </div>
          </div>

        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 flex flex-col sm:flex-row justify-between items-center gap-2 text-[9px] font-bold uppercase tracking-wider text-slate-300">
          <p>© {new Date().getFullYear()} Scrub Point Kenya. All Corporate Rights Reserved.</p>
          <div className="flex space-x-4">
            <span className="hover:text-white cursor-pointer">Terms of Service</span>
            <span>•</span>
            <span className="hover:text-white cursor-pointer">Medical Compliance</span>
          </div>
        </div>
      </footer>

    </div>
  );
}

function ProtectedRoute({ children }) {
  const { admin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-slate-100 flex items-center justify-center font-bold text-xs uppercase tracking-widest text-slate-400">
        Authenticating Privilege Clearance Level...
      </div>
    );
  }

  if (!admin || !admin.token) {
    return <Navigate to="/admin" state={{ from: location }} replace />;
  }

  return children;
}

function ScrollToTopFallback() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  const [isDarkModeActive, setIsDarkModeActive] = useState(() => {
    try {
      const recordedUserChoice = localStorage.getItem('scrub_point_theme_preference');
      return recordedUserChoice === 'dark';
    } catch (e) {
      return false;
    }
  });

  useEffect(() => {
    try {
      const documentRootElement = document.documentElement;
      if (isDarkModeActive) {
        documentRootElement.classList.add('dark');
        localStorage.setItem('scrub_point_theme_preference', 'dark');
      } else {
        documentRootElement.classList.remove('dark');
        localStorage.setItem('scrub_point_theme_preference', 'light');
      }
    } catch (err) {
      console.error("Theme system DOM injector execution loop exception:", err);
    }
  }, [isDarkModeActive]);

  const toggleGlobalApplicationTheme = () => {
    setIsDarkModeActive(prev => !prev);
  };

  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <ScrollToTopFallback />

          <Routes>
            <Route
              element={
                <PublicLayoutFrame
                  isDarkMode={isDarkModeActive}
                  onThemeToggle={toggleGlobalApplicationTheme}
                />
              }
            >
              <Route path="/" element={<Home isDarkMode={isDarkModeActive} onThemeToggle={toggleGlobalApplicationTheme} />} />
              <Route path="/products" element={<Products isDarkMode={isDarkModeActive} />} />
              <Route path="/products/:id" element={<ProductDetail isDarkMode={isDarkModeActive} />} />
              <Route path="/about" element={<About isDarkMode={isDarkModeActive} />} />
              <Route path="/contact" element={<Contact isDarkMode={isDarkModeActive} />} />
            </Route>
            <Route path="/admin" element={<AdminLogin />} />
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardAnalytics />} />
              <Route path="inventory" element={<InventoryManager />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>

        </Router>
      </CartProvider>
    </AuthProvider>
  );
}
