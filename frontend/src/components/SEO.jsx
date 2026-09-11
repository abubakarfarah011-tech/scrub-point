import { useEffect } from 'react';

const DEFAULT_SITE_URL = 'https://scrubspoint.com';

function ensureMeta(attribute, key, content) {
  if (!content) return;

  let element = document.head.querySelector(
    `meta[${attribute}="${key}"]`
  );

  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }

  element.setAttribute('content', content);
}

export default function SEO({
  title,
  description,
  path = '/',
  image = '/favicon.svg?v=2',
  type = 'website',
  robots = 'index, follow, max-image-preview:large',
  structuredData = null,
}) {
  useEffect(() => {
    const configuredSiteUrl =
      import.meta.env.VITE_SITE_URL || DEFAULT_SITE_URL;

    const siteUrl = configuredSiteUrl.replace(/\/+$/, '');
    const normalizedPath =
      path === '/' ? '/' : `/${String(path).replace(/^\/+|\/+$/g, '')}`;

    const canonicalUrl =
      normalizedPath === '/'
        ? `${siteUrl}/`
        : `${siteUrl}${normalizedPath}`;

    const absoluteImage =
      image && /^https?:\/\//i.test(image)
        ? image
        : `${siteUrl}${image?.startsWith('/') ? image : `/${image || ''}`}`;

    document.title = title;

    ensureMeta('name', 'description', description);
    ensureMeta('name', 'robots', robots);

    ensureMeta('property', 'og:title', title);
    ensureMeta('property', 'og:description', description);
    ensureMeta('property', 'og:type', type);
    ensureMeta('property', 'og:url', canonicalUrl);
    ensureMeta('property', 'og:site_name', 'Scrubs Point');
    ensureMeta('property', 'og:image', absoluteImage);

    ensureMeta('name', 'twitter:card', 'summary_large_image');
    ensureMeta('name', 'twitter:title', title);
    ensureMeta('name', 'twitter:description', description);
    ensureMeta('name', 'twitter:image', absoluteImage);

    let canonical = document.head.querySelector('link[rel="canonical"]');

    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }

    canonical.setAttribute('href', canonicalUrl);

    const oldStructuredData = document.head.querySelector(
      'script[data-scrub-point-seo="true"]'
    );

    if (oldStructuredData) {
      oldStructuredData.remove();
    }

    if (structuredData) {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.dataset.scrubPointSeo = 'true';
      script.textContent = JSON.stringify(structuredData);
      document.head.appendChild(script);
    }

    return () => {
      const script = document.head.querySelector(
        'script[data-scrub-point-seo="true"]'
      );

      if (script) {
        script.remove();
      }
    };
  }, [
    title,
    description,
    path,
    image,
    type,
    robots,
    structuredData,
  ]);

  return null;
}
