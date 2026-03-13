export type OrderStatus = "delivered" | "shipped" | "processing" | "cancelled";

export type OrderProduct = {
  id: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  size?: string;
  color?: string;
};

export type MockOrder = {
  id: string;
  date: string;
  status: OrderStatus;
  total: number;
  currency?: string;
  products: OrderProduct[];
};

export const mockOrders: MockOrder[] = [
  {
    id: "IKA-20241201",
    date: "2024-12-01",
    status: "delivered",
    total: 129.0,
    currency: "USD",
    products: [
      {
        id: "p1",
        name: "Classic White T-Shirt",
        image: "/images/pic1.png",
        price: 49.0,
        quantity: 1,
        size: "M",
        color: "White",
      },
      {
        id: "p2",
        name: "Casual Summer Dress",
        image: "/images/pic2.png",
        price: 80.0,
        quantity: 1,
        size: "S",
        color: "Brown",
      },
    ],
  },
  {
    id: "IKA-20241220",
    date: "2024-12-20",
    status: "shipped",
    total: 89.0,
    currency: "USD",
    products: [
      {
        id: "p3",
        name: "Relaxed Fit Hoodie",
        image: "/images/pic3.png",
        price: 89.0,
        quantity: 1,
        size: "L",
        color: "Gray",
      },
    ],
  },
  {
    id: "IKA-20250105",
    date: "2025-01-05",
    status: "processing",
    total: 198.0,
    currency: "USD",
    products: [
      {
        id: "p4",
        name: "Slim Fit Jacket",
        image: "/images/pic6.png",
        price: 99.0,
        quantity: 2,
        size: "XL",
        color: "Black",
      },
    ],
  },
];
