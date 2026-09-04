export interface Cat {
  id: string;
  url: string;
  tags: string[];
  mimetype?: string;
  createdAt?: string;
}

export type TextSize = "small" | "medium" | "hero";

export type TypographyVariant =
  | "hero"
  | "editorial-serif"
  | "brutalist-mono"
  | "outlined"
  | "gradient"
  | "pill";

export interface CatLayoutMeta {
  column: number;
  widthRange: {
    min: number;
    max: number;
  };
  aspectRatio: string;
  aspectRatioValue: number;
  xOffset: number;
  yOffset: number;
  speed: number;
  rotation: number;
}

export interface ImageGalleryItem {
  type: "image";
  id: string;
  cat: Cat;
  meta: CatLayoutMeta;
}

export interface TextGalleryItem {
  type: "text";
  id: string;
  text: string;
  subtitle?: string;
  size: TextSize;
  variant: TypographyVariant;
  meta: {
    speed: number;
    yOffset: number;
  };
}

export type GalleryItem = ImageGalleryItem | TextGalleryItem;
