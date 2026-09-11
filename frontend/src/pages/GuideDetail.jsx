import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen } from 'lucide-react';
import SEO from '../components/SEO';
import { getGuideBySlug } from '../data/guides';

const SITE_URL = (
  import.meta.env.VITE_SITE_URL || "https://scrubspoint.com"
).replace(/\/+$/, "");

const PUBLISHED_DATE = "2026-09-10";

export default function GuideDetail() {
  const { slug } = useParams();
  const guide = getGuideBySlug(slug);

  if (!guide) {
    return <Navigate to="/resources" replace />;
  }

  const articleUrl = `${SITE_URL}/resources/${guide.slug}`;

  return (
    <article className="min-h-screen bg-slate-50 dark:bg-[#0B192C] text-slate-800 dark:text-slate-100 pb-20">
      <SEO
        title={`${guide.title} | Scrubs Point`}
        description={guide.description}
        path={`/resources/${guide.slug}`}
        type="article"
        structuredData={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Article",
              headline: guide.title,
              description: guide.description,
              datePublished: PUBLISHED_DATE,
              dateModified: PUBLISHED_DATE,
              mainEntityOfPage: articleUrl,
              author: {
                "@type": "Organization",
                name: "Scrubs Point"
              },
              publisher: {
                "@type": "Organization",
                name: "Scrubs Point",
                url: `${SITE_URL}/`
              }
            },
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                {
                  "@type": "ListItem",
                  position: 1,
                  name: "Home",
                  item: `${SITE_URL}/`
                },
                {
                  "@type": "ListItem",
                  position: 2,
                  name: "Resources",
                  item: `${SITE_URL}/resources`
                },
                {
                  "@type": "ListItem",
                  position: 3,
                  name: guide.title,
                  item: articleUrl
                }
              ]
            }
          ]
        }}
      />

      <header className="bg-[#1E3A8A] text-white px-4 py-14">
        <div className="max-w-3xl mx-auto">
          <Link
            to="/resources"
            className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-wider text-white/70 hover:text-white mb-6"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Resources
          </Link>

          <BookOpen className="h-7 w-7 mb-4" />
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            {guide.title}
          </h1>
          <p className="mt-5 text-sm sm:text-base text-white/80 leading-relaxed">
            {guide.description}
          </p>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <p className="text-base sm:text-lg leading-8 font-medium mb-10">
          {guide.intro}
        </p>

        <div className="space-y-10">
          {guide.sections.map((section) => (
            <section key={section.heading} className="space-y-3">
              <h2 className="text-xl sm:text-2xl font-black">
                {section.heading}
              </h2>

              {section.paragraphs.map((paragraph) => (
                <p
                  key={paragraph}
                  className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-7"
                >
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
        </div>

        <div className="mt-12 border-t border-slate-200 dark:border-slate-800 pt-8">
          <Link
            to="/products"
            className="inline-flex items-center justify-center bg-[#1E3A8A] text-white rounded-xl px-6 py-3 text-xs font-black uppercase tracking-wider"
          >
            Browse Scrubs Point Products
          </Link>
        </div>
      </div>
    </article>
  );
}
