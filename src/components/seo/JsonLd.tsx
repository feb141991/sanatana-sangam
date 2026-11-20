import {
  OFFICIAL_EMAILS,
  OFFICIAL_ENTITY_NAME,
  OFFICIAL_SOCIAL_LINKS,
  OFFICIAL_STORE_LINKS,
} from "@/config/official-links";
import React from 'react';
import type { GeoModel } from '@/lib/seo/geo-model';

export function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
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
    "url": "https://www.shoonaya.com",
    "logo": {
      "@type": "ImageObject",
      "url": "https://www.shoonaya.com/icons/icon-512x512.png"
    },
    "sameAs": [
      OFFICIAL_SOCIAL_LINKS.linkedin,
      OFFICIAL_SOCIAL_LINKS.instagram,
      OFFICIAL_SOCIAL_LINKS.facebook,
      "https://apps.apple.com/app/id6793055966",
      OFFICIAL_STORE_LINKS.googlePlayCanonical,
    ],
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

export function PanchangPageJsonLd({
  url,
  name,
  description,
}: {
  url: string;
  name: string;
  description: string;
}) {
  const panchangSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": name,
    "description": description,
    "url": url,
    "publisher": {
      "@type": "Organization",
      "@id": "https://www.shoonaya.com/#organization",
      "name": "Shoonaya",
      "url": "https://www.shoonaya.com",
    },
    "about": { "@type": "Thing", "name": "Hindu Panchang" },
  };

  return <JsonLd data={panchangSchema} />;
}

export function OrganizationJsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://www.shoonaya.com/#organization",
        "name": "Shoonaya",
        "legalName": OFFICIAL_ENTITY_NAME,
        "alternateName": [
          "Shoonaya Dharma Companion",
          "Sanatan Sangam Shoonaya",
        ],
        "url": "https://www.shoonaya.com",
        "logo": "https://www.shoonaya.com/icons/icon-512x512.png",
        "description": "Shoonaya: Find your infinite. A daily spiritual sanctuary for sacred time, practice, and connection.",
        "email": OFFICIAL_EMAILS.info,
        "sameAs": [
          OFFICIAL_SOCIAL_LINKS.linkedin,
          OFFICIAL_SOCIAL_LINKS.instagram,
          OFFICIAL_SOCIAL_LINKS.facebook,
          "https://apps.apple.com/app/id6793055966",
          OFFICIAL_STORE_LINKS.googlePlayCanonical,
        ],
        "contactPoint": [
          {
            "@type": "ContactPoint",
            "contactType": "Customer Support",
            "email": OFFICIAL_EMAILS.support,
            "url": "https://www.shoonaya.com/contact",
          },
          {
            "@type": "ContactPoint",
            "contactType": "Privacy & Data Protection",
            "email": OFFICIAL_EMAILS.privacy,
            "url": "https://www.shoonaya.com/privacy",
          },
          {
            "@type": "ContactPoint",
            "contactType": "Partnerships",
            "email": OFFICIAL_EMAILS.partners,
            "url": "https://www.shoonaya.com/contact",
          },
        ],
      },
      {
        "@type": "WebSite",
        "@id": "https://www.shoonaya.com/#website",
        "url": "https://www.shoonaya.com",
        "name": "Shoonaya",
        "description": "Shoonaya: Find your infinite. A daily spiritual sanctuary for sacred time, practice, and connection.",
        "publisher": { "@id": "https://www.shoonaya.com/#organization" },
        "potentialAction": {
          "@type": "SearchAction",
          "target": "https://www.shoonaya.com/panchang?date={search_term_string}",
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "MobileApplication",
        "@id": "https://www.shoonaya.com/#mobile-app",
        "name": "Shoonaya",
        "operatingSystem": "iOS, Android",
        "applicationCategory": "LifestyleApplication",
        "description": "Daily spiritual companion featuring astronomy-backed Panchang, festival calendars, Bhakti scripture library, Japa mala, and Pathshala learning.",
        "installUrl": "https://www.shoonaya.com/get",
        "downloadUrl": OFFICIAL_STORE_LINKS.googlePlayCanonical,
        "sameAs": [
          "https://apps.apple.com/app/id6793055966",
          OFFICIAL_STORE_LINKS.googlePlayCanonical,
        ],
        "publisher": { "@id": "https://www.shoonaya.com/#organization" },
      },
      {
        "@type": "Service",
        "@id": "https://www.shoonaya.com/#service-panchang",
        "name": "Astronomy-Backed Dharma Panchang & Festival Engine",
        "provider": { "@id": "https://www.shoonaya.com/#organization" },
        "serviceType": "Astrological & Spiritual Calendar Service",
        "description": "Astronomy-backed tithi, nakshatra, yoga, karana, muhurta, and canonical festival calculations across Hindu, Sikh, Buddhist, and Jain traditions.",
        "areaServed": "Global",
      },
      {
        "@type": "FAQPage",
        "@id": "https://www.shoonaya.com/#faq",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "What traditions does Shoonaya support?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Shoonaya supports four sacred traditions: Hindu (Vaishnava, Shaiva, Shakta), Sikh (Gurmat, Nanakshahi), Buddhist (Theravada, Tibetan Mahayana), and Jain (Shvetambara, Digambara).",
            },
          },
          {
            "@type": "Question",
            "name": "How is the Shoonaya Panchang calculated?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Shoonaya computes astronomical positions using high-precision planetary ephemeris, Lahiri ayanamsha, and exact solar-lunar elongation angles anchored to traditional meridians.",
            },
          },
          {
            "@type": "Question",
            "name": "Are festival dates universal or tradition-specific?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Shoonaya's festival calendar combines declarative rule families with tradition-specific canonical concordances and astronomical timings for each sacred observance.",
            },
          },
          {
            "@type": "Question",
            "name": "Does Shoonaya support AI agents and Model Context Protocol (MCP)?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes. Shoonaya provides machine-readable llms.txt, SEP-1649/SEP-2127 MCP server cards at /.well-known/mcp/server-card.json, streamable-http MCP endpoints at /api/mcp, and in-browser WebMCP tools via navigator.modelContext.",
            },
          },
        ],
      },
    ],
  };
  return <JsonLd data={schema} />;
}
