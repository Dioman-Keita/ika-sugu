import { compareArrays } from "@/lib/utils";
import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

type LegacyDiscount = {
  amount?: number;
  percentage?: number;
};

type LegacyCartPricing = {
  price?: number;
  discount?: LegacyDiscount;
};

const resolveBasePrice = (item: Partial<CartItem> & LegacyCartPricing): number =>
  item.basePrice ?? item.price ?? 0;

const resolveFinalPrice = (item: Partial<CartItem> & LegacyCartPricing): number => {
  if (typeof item.finalPrice === "number") return item.finalPrice;
  const basePrice = resolveBasePrice(item);
  const discountPercentage = item.discountPercentage ?? item.discount?.percentage ?? 0;
  return Math.round(basePrice - (basePrice * discountPercentage) / 100);
};

const calcTotalPrice = (unitPrice: number, quantity: number): number =>
  unitPrice * quantity;

export type RemoveCartItem = {
  id: string;
  attributes: string[];
};

export type CartItem = {
  id: string;
  slug?: string;
  variantId?: string;
  name: string;
  srcUrl: string;
  basePrice: number;
  finalPrice: number;
  discountPercentage: number;
  attributes: string[];
  quantity: number;
};

export type Cart = {
  items: CartItem[];
  totalQuantities: number;
};

interface CartsState {
  cart: Cart | null;
  totalBasePrice: number;
  totalFinalPrice: number;
  action: "update" | "add" | "delete" | null;
}

const initialState: CartsState = {
  cart: null,
  totalBasePrice: 0,
  totalFinalPrice: 0,
  action: null,
};

export const cartsSlice = createSlice({
  name: "carts",
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<CartItem>) => {
      if (state.cart === null) {
        state.cart = {
          items: [action.payload],
          totalQuantities: action.payload.quantity,
        };
        state.totalBasePrice =
          state.totalBasePrice +
          calcTotalPrice(resolveBasePrice(action.payload), action.payload.quantity);
        state.totalFinalPrice =
          state.totalFinalPrice +
          calcTotalPrice(resolveFinalPrice(action.payload), action.payload.quantity);
        return;
      }

      const isItemInCart = state.cart.items.find(
        (item) =>
          action.payload.id === item.id &&
          compareArrays(action.payload.attributes, item.attributes),
      );

      if (isItemInCart) {
        state.cart = {
          ...state.cart,
          items: state.cart.items.map((eachCartItem) => {
            if (
              eachCartItem.id === action.payload.id
                ? !compareArrays(eachCartItem.attributes, isItemInCart.attributes)
                : eachCartItem.id !== action.payload.id
            )
              return eachCartItem;

            return {
              ...isItemInCart,
              quantity: action.payload.quantity + isItemInCart.quantity,
            };
          }),
          totalQuantities: state.cart.totalQuantities + action.payload.quantity,
        };
        state.totalBasePrice =
          state.totalBasePrice +
          calcTotalPrice(resolveBasePrice(action.payload), action.payload.quantity);
        state.totalFinalPrice =
          state.totalFinalPrice +
          calcTotalPrice(resolveFinalPrice(action.payload), action.payload.quantity);
        return;
      }

      state.cart = {
        ...state.cart,
        items: [...state.cart.items, action.payload],
        totalQuantities: state.cart.totalQuantities + action.payload.quantity,
      };
      state.totalBasePrice =
        state.totalBasePrice +
        calcTotalPrice(resolveBasePrice(action.payload), action.payload.quantity);
      state.totalFinalPrice =
        state.totalFinalPrice +
        calcTotalPrice(resolveFinalPrice(action.payload), action.payload.quantity);
    },
    removeCartItem: (state, action: PayloadAction<RemoveCartItem>) => {
      if (state.cart === null) return;

      const isItemInCart = state.cart.items.find(
        (item) =>
          action.payload.id === item.id &&
          compareArrays(action.payload.attributes, item.attributes),
      );

      if (isItemInCart) {
        state.cart = {
          ...state.cart,
          items: state.cart.items
            .map((eachCartItem) => {
              if (
                eachCartItem.id === action.payload.id
                  ? !compareArrays(eachCartItem.attributes, isItemInCart.attributes)
                  : eachCartItem.id !== action.payload.id
              )
                return eachCartItem;

              return {
                ...isItemInCart,
                quantity: eachCartItem.quantity - 1,
              };
            })
            .filter((item) => item.quantity > 0),
          totalQuantities: state.cart.totalQuantities - 1,
        };

        state.totalBasePrice =
          state.totalBasePrice - calcTotalPrice(resolveBasePrice(isItemInCart), 1);
        state.totalFinalPrice =
          state.totalFinalPrice - calcTotalPrice(resolveFinalPrice(isItemInCart), 1);
      }
    },
    remove: (state, action: PayloadAction<RemoveCartItem & { quantity: number }>) => {
      if (!state.cart) return;

      const isItemInCart = state.cart.items.find(
        (item) =>
          action.payload.id === item.id &&
          compareArrays(action.payload.attributes, item.attributes),
      );

      if (!isItemInCart) return;

      state.cart = {
        ...state.cart,
        items: state.cart.items.filter((pItem) => {
          return pItem.id === action.payload.id
            ? !compareArrays(pItem.attributes, isItemInCart.attributes)
            : pItem.id !== action.payload.id;
        }),
        totalQuantities: state.cart.totalQuantities - isItemInCart.quantity,
      };
      state.totalBasePrice =
        state.totalBasePrice -
        calcTotalPrice(resolveBasePrice(isItemInCart), isItemInCart.quantity);
      state.totalFinalPrice =
        state.totalFinalPrice -
        calcTotalPrice(resolveFinalPrice(isItemInCart), isItemInCart.quantity);
    },
  },
});

export const { addToCart, removeCartItem, remove } = cartsSlice.actions;

export default cartsSlice.reducer;
