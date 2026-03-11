export type ProductVariant = {
  id: string;
  colorName: string;
  colorHex?: string | null;
  size: string;
  images: string[];
  stock: number;
  isActive: boolean;
};

export type Product = {
  id: string;
  slug: string;
  title: string;
  description: string;
  srcUrl: string;
  gallery?: string[];
  specs?: Array<{ labelKey: string; value: string }>;
  variants: ProductVariant[];
  basePrice: number;
  discountPercentage: number;
  finalPrice: number;
  rating: number;
};
