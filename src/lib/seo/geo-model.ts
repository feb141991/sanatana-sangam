export interface GeoFact {
  label: string;
  value: string;
}

export interface GeoQA {
  question: string;
  answer: string;
}

export interface GeoLink {
  title: string;
  url: string;
}

export interface GeoModel {
  title: string;
  summary: string;
  provenance: string;
  facts: GeoFact[];
  qa: GeoQA[];
  relatedLinks: GeoLink[];
}
