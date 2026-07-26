import React from 'react';
import type { GeoModel } from '@/lib/seo/geo-model';
import type { PanchangData } from '@/lib/panchang';

export function JsonLd({ data }: { data: any }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function BreadcrumbJsonLd({ items }: { items: { name: string; url: string }[] }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  };
  return <JsonLd data={schema} />;
}

export function GeoArticleJsonLd({ geo, url }: { geo: GeoModel; url: string }) {
  const graph: any[] = [];

  // WebPage base
  graph.push({
    "@type": "WebPage",
    "url": url,
    "name": geo.title,
    "description": geo.summary,
  });

  // Article representation
  const articleSchema: any = {
    "@type": "Article",
    "headline": geo.title,
    "description": geo.summary,
    "url": url,
  };

  if (geo.provenance) {
    articleSchema.isBasedOn = {
      "@type": "CreativeWork",
      "name": geo.provenance
    };
  }

  articleSchema.publisher = {
    "@type": "Organization",
    "name": "Shoonaya",
    "logo": {
      "@type": "ImageObject",
      "url": "https://www.shoonaya.com/icons/icon-512x512.png"
    }
  };

  if (geo.reviewedBy) {
    articleSchema.reviewedBy = {
      "@type": "Person",
      "name": geo.reviewedBy
    };
  }

  if (geo.datePublished) {
    articleSchema.datePublished = geo.datePublished;
  }

  if (geo.dateModified) {
    articleSchema.dateModified = geo.dateModified;
  }

  graph.push(articleSchema);

  // FAQPage representation for Q&A
  if (geo.qa && geo.qa.length > 0) {
    graph.push({
      "@type": "FAQPage",
      "mainEntity": geo.qa.map(item => ({
        "@type": "Question",
        "name": item.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": item.answer
        }
      }))
    });
  }

  const schema = {
    "@context": "https://schema.org",
    "@graph": graph
  };

  return <JsonLd data={schema} />;
}

export function PanchangJsonLd({
  panchang,
  url,
  name,
  description,
}: {
  panchang: PanchangData;
  url: string;
  name: string;
  description: string;
}) {
  const panchangSchema = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    "name": name,
    "description": description,
    "url": url,
    "keywords": ["panchang", "tithi", "nakshatra", "muhurta", "horoscope", "kundali", panchang.tithi, panchang.nakshatra, panchang.masaName],
    "creator": { "@type": "Organization", "name": "Shoonaya" },
    "temporalCoverage": panchang.date,
    "variableMeasured": [
      { "@type": "PropertyValue", "name": "Tithi", "value": `${panchang.tithi} (${panchang.paksha})` },
      { "@type": "PropertyValue", "name": "Nakshatra", "value": panchang.nakshatra },
      { "@type": "PropertyValue", "name": "Yoga", "value": panchang.yoga },
      { "@type": "PropertyValue", "name": "Vara", "value": panchang.vara },
      { "@type": "PropertyValue", "name": "Masa", "value": panchang.masaName },
    ],
  };

  if (panchang.sunrise && panchang.sunset) {
    panchangSchema.variableMeasured.push({ "@type": "PropertyValue", "name": "Sunrise", "value": panchang.sunrise });
    panchangSchema.variableMeasured.push({ "@type": "PropertyValue", "name": "Sunset", "value": panchang.sunset });
  }

  if (panchang.rahuKaal) {
    panchangSchema.variableMeasured.push({ "@type": "PropertyValue", "name": "Rahu Kaal", "value": panchang.rahuKaal });
  }

  if (panchang.brahmaMuhurta) {
    panchangSchema.variableMeasured.push({ "@type": "PropertyValue", "name": "Brahma Muhurta", "value": panchang.brahmaMuhurta });
  }

  if (panchang.abhijitMuhurat) {
    panchangSchema.variableMeasured.push({ "@type": "PropertyValue", "name": "Abhijit Muhurat", "value": panchang.abhijitMuhurat });
  }

  return <JsonLd data={panchangSchema} />;
}
