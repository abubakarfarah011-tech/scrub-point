import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';

export default function ProductCard({ item }) {
  const stockQuantity = Number(item.stock_quantity || 0);
  const isOutOfStock = stockQuantity <= 0;
  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col group relative">

      {item.is_featured && (
        <span className="absolute top-3 left-3 bg-amber-500 text-white font-black text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm z-10 border border-amber-400">
          Featured
        </span>
      )}

      <Link to={`/products/${item.id}`} className="bg-slate-100 aspect-square w-full relative overflow-hidden shrink-0 flex items-center justify-center cursor-pointer">
        {item.image_url ? (
          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-xs uppercase tracking-widest bg-slate-200">
            Scrub Point Photo
          </div>
        )}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[1px]">
              <span className="bg-red-600 text-white font-black text-xs uppercase tracking-widest px-4 py-2 rounded-lg shadow-md border border-red-500">
                Out of Stock
              </span>
            </div>
          )}
      </Link>
      <div className="p-5 flex flex-col grow justify-between space-y-4">
        <div className="space-y-1.5">
          <span className="text-[10px] bg-slate-100 text-slate-600 font-bold uppercase tracking-wider px-2.5 py-0.5 rounded border border-slate-200">
            {item.category}
          </span>
          <Link to={`/products/${item.id}`} className="block font-bold text-slate-800 text-base leading-snug tracking-tight hover:text-medical-600 transition-colors line-clamp-2 cursor-pointer">
            {item.name}
          </Link>
          <p className="text-slate-500 text-xs line-clamp-2 font-medium leading-relaxed">
            {item.description || "Click to view full color variations, measurement grids, and configuration parameters details."}
          </p>
        </div>

        <div className="pt-2 border-t border-slate-100 flex flex-col space-y-3">
          <div className="flex items-baseline space-x-1">
            <span className="text-xs font-bold text-slate-400 uppercase">KES</span>
            <span className="text-xl font-black text-slate-800 tracking-tight">
              {item.price.toLocaleString()}
            </span>
          </div>

          <Link
            to={`/products/${item.id}`}
            className="w-full bg-medical-500 hover:bg-medical-600 text-white font-black text-xs uppercase tracking-wider py-3 rounded-xl transition-all flex items-center justify-center space-x-2 border shadow-sm cursor-pointer text-center"
          >
            <ShoppingBag className="h-4 w-4" />
            <span>Purchase Now</span>
          </Link>
        </div>
      </div>

    </div>
  );
}