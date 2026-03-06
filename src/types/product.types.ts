export type Product = {
  id: string;
  title: string;
  srcUrl: string;
  gallery?: string[];
  basePrice: number;
  discountPercentage: number;
  finalPrice: number;
  rating: number;
};
