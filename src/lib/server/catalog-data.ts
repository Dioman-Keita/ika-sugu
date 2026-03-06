import "server-only";

import { applyDiscountPercentage } from "@/app/actions/pricing";
import { Product } from "@/types/product.types";

type ProductSeed = Omit<Product, "finalPrice">;

const newArrivalsSeed: ProductSeed[] = [
  {
    id: 1,
    title: "T-shirt with Tape Details",
    srcUrl: "/images/pic1.png",
    gallery: ["/images/pic1.png", "/images/pic10.png", "/images/pic11.png"],
    basePrice: 120,
    discountPercentage: 0,
    rating: 4.5,
  },
  {
    id: 2,
    title: "Skinny Fit Jeans",
    srcUrl: "/images/pic2.png",
    gallery: ["/images/pic2.png"],
    basePrice: 260,
    discountPercentage: 20,
    rating: 3.5,
  },
  {
    id: 3,
    title: "Chechered Shirt",
    srcUrl: "/images/pic3.png",
    gallery: ["/images/pic3.png"],
    basePrice: 180,
    discountPercentage: 0,
    rating: 4.5,
  },
  {
    id: 4,
    title: "Sleeve Striped T-shirt",
    srcUrl: "/images/pic4.png",
    gallery: ["/images/pic4.png", "/images/pic10.png", "/images/pic11.png"],
    basePrice: 160,
    discountPercentage: 30,
    rating: 4.5,
  },
];

const topSellingSeed: ProductSeed[] = [
  {
    id: 5,
    title: "Vertical Striped Shirt",
    srcUrl: "/images/pic5.png",
    gallery: ["/images/pic5.png", "/images/pic10.png", "/images/pic11.png"],
    basePrice: 232,
    discountPercentage: 20,
    rating: 5.0,
  },
  {
    id: 6,
    title: "Courage Graphic T-shirt",
    srcUrl: "/images/pic6.png",
    gallery: ["/images/pic6.png", "/images/pic10.png", "/images/pic11.png"],
    basePrice: 145,
    discountPercentage: 0,
    rating: 4.0,
  },
  {
    id: 7,
    title: "Loose Fit Bermuda Shorts",
    srcUrl: "/images/pic7.png",
    gallery: ["/images/pic7.png"],
    basePrice: 80,
    discountPercentage: 0,
    rating: 3.0,
  },
  {
    id: 8,
    title: "Faded Skinny Jeans",
    srcUrl: "/images/pic8.png",
    gallery: ["/images/pic8.png"],
    basePrice: 210,
    discountPercentage: 0,
    rating: 4.5,
  },
];

const relatedProductsSeed: ProductSeed[] = [
  {
    id: 12,
    title: "Polo with Contrast Trims",
    srcUrl: "/images/pic12.png",
    gallery: ["/images/pic12.png", "/images/pic10.png", "/images/pic11.png"],
    basePrice: 242,
    discountPercentage: 20,
    rating: 4.0,
  },
  {
    id: 13,
    title: "Gradient Graphic T-shirt",
    srcUrl: "/images/pic13.png",
    gallery: ["/images/pic13.png", "/images/pic10.png", "/images/pic11.png"],
    basePrice: 145,
    discountPercentage: 0,
    rating: 3.5,
  },
  {
    id: 14,
    title: "Polo with Tipping Details",
    srcUrl: "/images/pic14.png",
    gallery: ["/images/pic14.png"],
    basePrice: 180,
    discountPercentage: 0,
    rating: 4.5,
  },
  {
    id: 15,
    title: "Black Striped T-shirt",
    srcUrl: "/images/pic15.png",
    gallery: ["/images/pic15.png"],
    basePrice: 150,
    discountPercentage: 30,
    rating: 5.0,
  },
];

const enrichProductsWithFinalPrice = async (
  products: ProductSeed[]
): Promise<Product[]> => {
  return Promise.all(
    products.map(async (product) => ({
      ...product,
      finalPrice: await applyDiscountPercentage(
        product.basePrice,
        product.discountPercentage
      ),
    }))
  );
};

export const getCatalogData = async () => {
  const [newArrivalsData, topSellingData, relatedProductData] =
    await Promise.all([
      enrichProductsWithFinalPrice(newArrivalsSeed),
      enrichProductsWithFinalPrice(topSellingSeed),
      enrichProductsWithFinalPrice(relatedProductsSeed),
    ]);

  return {
    newArrivalsData,
    topSellingData,
    relatedProductData,
  };
};
