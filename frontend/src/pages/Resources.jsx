import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen } from 'lucide-react';
import SEO from '../components/SEO';
import { guides } from '../data/guides';

const SITE_URL = (
  import.meta.env.VITE_SITE_URL || "https://scrubspoint.com"
).replace(/\/+$/, "");

export default function Resources() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B192C] text-slate-800 dark:text-slate-100 pb-20">
      <SEO
        title="Medical Scrub & Clinical Gear Guides Kenya | Scrubs Point"
        description="Practical guides from Scrubs Point Kenya covering medical scrub sizing, clinical workwear care and choosing healthcare equipment."
        path="/resources"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Scrubs Point Resources",
          url: `${SITE_URL}/resources`,
          description: "Practical medical workwear and clinical equipment guides from Scrubs Point Kenya."
        }}
      />

      <section className="bg-[#1E3A8A] text-white py-16 px-4 text-center">
        <div className="max-w-3xl mx-auto space-y-4">
          <BookOpen className="h-8 w-8 mx-auto" />
          <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight">
            Scrubs Point Resources
          </h1>
          <p className="text-sm text-white/80 max-w-2xl mx-auto">
            Practical buying, sizing and care guidance for healthcare professionals and students.
          </p>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {guides.map((guide) => (
            <Link
              key={guide.slug}
              to={`/resources/${guide.slug}`}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 hover:shadow-md transition-all group"
            >
              <div className="space-y-3">
                <BookOpen className="h-5 w-5 text-[#1E3A8A] dark:text-sky-400" />
                <h2 className="font-black text-lg leading-tight">
                  {guide.title}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  {guide.description}
                </p>
                <span className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-wider text-[#1E3A8A] dark:text-sky-400">
                  Read Guide
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
