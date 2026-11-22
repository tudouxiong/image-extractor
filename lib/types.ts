export type ExtractedImage = {
  url: string;
  alt: string;
  width: number | null;
  height: number | null;
};

export type ExtractResult = {
  sourceUrl: string;
  title: string;
  images: ExtractedImage[];
  truncated: boolean;
  links?: string[];
  note?: string;
};
