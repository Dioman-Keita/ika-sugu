export type Product = {
  id: number;
  title: string;
  srcUrl: string;
  gallery?: string[];
  basePrice: number;
  discountPercentage: number;
  finalPrice: number;
  rating: number;
};
