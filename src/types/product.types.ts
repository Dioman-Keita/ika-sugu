export type ProductVariant = {
  id: string;
  sku?: string | null;
  colorName: string;
  colorHex?: string | null;
  size: string;
  images: string[];
  price: number;
  compareAtPrice?: number | null;
  currency: string;
  sourceCurrency?: string;
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
  currency: string;
  rating: number;
};
