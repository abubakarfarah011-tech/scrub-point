import { useCart } from '../context/useCart';
import { Link } from 'react-router-dom';
import { ShieldCheck, Award, HeartHandshake, BookOpen, Sparkles, ArrowRight } from 'lucide-react';

export default function About() {
  const { darkMode } = useCart();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans pb-20 transition-colors duration-200">
      <div className="relative bg-linear-to-br from-medical-900 via-medical-900 to-[#0B192C] text-white py-20 px-4 text-center border-b border-medical-800 shadow-md overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
          backgroundSize: '32px 32px'
        }} />
        <div className="relative z-10 space-y-4">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest bg-white/10 backdrop-blur-sm text-medical-200 px-4 py-1.5 rounded-full border border-white/10">
            <Sparkles className="h-3 w-3" />
            Empowering Health Practitioners
          </span>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight uppercase leading-tight">Our Corporate Heritage</h2>
          <p className="text-medical-100/70 max-w-xl mx-auto text-xs sm:text-sm font-medium leading-relaxed uppercase tracking-wide">
            Dressing the medical vanguard with premium utility uniforms, specialized diagnostics apparel, and clinical textbooks.
          </p>
          <div className="pt-2">
            <Link
              to="/products"
              className="inline-flex items-center gap-1.5 bg-white text-medical-900 hover:bg-medical-50 font-black text-[10px] uppercase tracking-widest px-6 py-3 rounded-xl shadow-lg transition-all group"
            >
              <span>Explore Our Catalog</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-10 relative z-10 space-y-8">

        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 sm:p-8 shadow-lg shadow-slate-200/50 dark:shadow-none space-y-6">
          <div className="flex items-center space-x-3 border-b border-slate-100 dark:border-slate-700 pb-4">
            <div className="h-10 w-10 rounded-2xl bg-medical-50 dark:bg-medical-900/40 flex items-center justify-center shrink-0">
              <ShieldCheck className="h-5 w-5 text-medical-500" />
            </div>
            <h3 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-wider">
              Our Vision and Origin Story
            </h3>
          </div>

          <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm font-medium leading-relaxed">
            Founded within the bustling medical nodes of Nairobi, Kenya, Scrub Point emerged to bridge a critical supply gap in the regional healthcare market. For years, medical practitioners,dentists,consultants,pharmacists,clinicians, and clinical students were restricted to rigid, unyielding uniforms that failed to offer adequate flexibility or breathability during grueling 24-hour shifts.
          </p>

          <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm font-medium leading-relaxed">
            We set out to re-engineer medical apparel from the thread up. By partnering with advanced textile fabricators, we introduced high-weave combed yarn architectures that incorporate anti-microbial fabric defenses, liquid-repellent properties, and deep active-stretch mechanics. Our products are meticulously tailored to guarantee that while you are caring for patients, your uniform is actively supporting your comfort and mobility.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 sm:p-8 shadow-sm space-y-5">
          <div className="flex items-center space-x-3 border-b border-slate-100 dark:border-slate-700 pb-4">
            <div className="h-10 w-10 rounded-2xl bg-medical-50 dark:bg-medical-900/40 flex items-center justify-center shrink-0">
              <BookOpen className="h-5 w-5 text-medical-500" />
            </div>
            <h3 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-wider">
              A Diversified Medical Supply Ecosystem
            </h3>
          </div>
          <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm font-medium leading-relaxed">
            As we matured, Scrub Point evolved beyond textiles to become a comprehensive multi-category supply hub for practitioners across East Africa. Today, our inventory encompasses three pillars:
          </p>
          <ul className="space-y-3">
            <li className="flex items-start space-x-3 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
              <span className="text-xl shrink-0">🩺</span>
              <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wide leading-relaxed">
                <span className="text-slate-800 dark:text-white font-black">Clinical Attire</span>: Premium scrubs, sterile laboratory coats, protective caps, and anti-fatigue clinical footwear.
              </span>
            </li>
            <li className="flex items-start space-x-3 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
              <span className="text-xl shrink-0">📖</span>
              <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wide leading-relaxed">
                <span className="text-slate-800 dark:text-white font-black">Academic Literature</span>: Specialized diagnostic text references, anatomical manuals, and up-to-date board medical review books.
              </span>
            </li>
            <li className="flex items-start space-x-3 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
              <span className="text-xl shrink-0">🔬</span>
              <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wide leading-relaxed">
                <span className="text-slate-800 dark:text-white font-black">Diagnostic Gear</span>: High-acoustic stethoscopes, durable blood pressure monitors, and specialized surgical instrument arrays.
              </span>
            </li>
          </ul>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">

          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3 text-center transition-all hover:shadow-lg hover:-translate-y-1 duration-300">
            <div className="h-12 w-12 rounded-2xl bg-medical-50 dark:bg-medical-900/40 flex items-center justify-center mx-auto">
              <span className="text-xl font-black text-medical-500">01</span>
            </div>
            <h4 className="font-black text-slate-800 dark:text-white text-xs uppercase tracking-wider">Textile Ingenuity</h4>
            <p className="text-slate-400 dark:text-slate-500 text-[11px] font-bold uppercase leading-relaxed">
              We select anti-microbial, wrinkle-free material blends designed to withstand rigorous sanitation cycles.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3 text-center transition-all hover:shadow-lg hover:-translate-y-1 duration-300">
            <div className="h-12 w-12 rounded-2xl bg-medical-50 dark:bg-medical-900/40 flex items-center justify-center mx-auto">
              <span className="text-xl font-black text-medical-500">02</span>
            </div>
            <h4 className="font-black text-slate-800 dark:text-white text-xs uppercase tracking-wider">Bespoke Fitting</h4>
            <p className="text-slate-400 dark:text-slate-500 text-[11px] font-bold uppercase leading-relaxed">
              Our open, optional sizing and color selectors match any clinical uniform specification cleanly.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3 text-center transition-all hover:shadow-lg hover:-translate-y-1 duration-300">
            <div className="h-12 w-12 rounded-2xl bg-medical-50 dark:bg-medical-900/40 flex items-center justify-center mx-auto">
              <span className="text-xl font-black text-medical-500">03</span>
            </div>
            <h4 className="font-black text-slate-800 dark:text-white text-xs uppercase tracking-wider">Frictionless Flow</h4>
            <p className="text-slate-400 dark:text-slate-500 text-[11px] font-bold uppercase leading-relaxed">
              A persisted shopping cart combines your items into a single consolidated invoice bill over WhatsApp.
            </p>
          </div>

        </div>

        <div className="relative bg-linear-to-br from-medical-900 to-[#0B192C] p-8 rounded-3xl text-center space-y-3 overflow-hidden shadow-lg">
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '28px 28px'
          }} />
          <div className="relative z-10 flex items-center justify-center space-x-2 text-medical-200">
            <HeartHandshake className="h-6 w-6 shrink-0" />
            <span className="text-xs font-black uppercase tracking-widest">Our Operational Promise</span>
          </div>
          <p className="relative z-10 text-slate-200/90 text-xs sm:text-sm font-semibold max-w-2xl mx-auto leading-relaxed">
            Whether you are a solo medical officer ordering a customized scrubs set, a lab student picking up reference books, or an administrator outfitting an entire diagnostic wing, Scrub Point delivers premium utility. No filler, no complexity—just high-grade equipment prepared for immediate operational service.
          </p>
          <div className="relative z-10 pt-2">
            <Link
              to="/contact"
              className="inline-flex items-center gap-1.5 bg-white text-medical-900 hover:bg-medical-50 font-black text-[10px] uppercase tracking-widest px-5 py-2.5 rounded-xl shadow-md transition-all"
            >
              <span>Get In Touch</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}