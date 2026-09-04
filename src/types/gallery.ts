export interface AnimalImage {
  id: string;
  url: string;
  tags: string[];
  mimetype?: string;
  createdAt?: string;
}

export interface OriginRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export type TextSize = "small" | "medium" | "hero";

export type TypographyVariant =
  | "hero"
  | "editorial-serif"
  | "brutalist-mono"
  | "outlined"
  | "gradient"
  | "pill";

export interface AnimalLayoutMeta {
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
  image: AnimalImage;
  meta: AnimalLayoutMeta;
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
