import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { PanchangPageJsonLd } from '@/components/seo/JsonLd';

describe('Panchang page structured data', () => {
  it('describes the daily Panchang page without claiming dataset licensing', () => {
    const markup = renderToStaticMarkup(
      <PanchangPageJsonLd
        url="https://www.shoonaya.com/panchang"
        name="Hindu Panchang for 2026-10-16"
        description="Daily Panchang and sacred timings for the day."
      />,
    );
    const json = markup.match(/>(.*)<\/script>/)?.[1];

    expect(json).toBeDefined();
    const schema = JSON.parse(json!) as Record<string, unknown>;
    expect(schema['@type']).toBe('WebPage');
    expect(schema.url).toBe('https://www.shoonaya.com/panchang');
    expect(schema.about).toEqual({ '@type': 'Thing', name: 'Hindu Panchang' });
    expect(schema).not.toHaveProperty('license');
    expect(schema).not.toHaveProperty('variableMeasured');
  });
});
