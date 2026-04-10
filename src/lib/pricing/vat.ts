import { Prisma } from "@/generated/prisma/client";

export const applyVatToNetPrice = (value: number, vatRate: number) => {
  const safeValue = Math.max(0, value);
  const safeVatRate = Math.max(0, vatRate);
  return Number((safeValue * (1 + safeVatRate / 100)).toFixed(2));
};

export const removeVatFromGrossPrice = (value: number, vatRate: number) => {
  const safeValue = Math.max(0, value);
  const safeVatRate = Math.max(0, vatRate);
  if (safeVatRate === 0) return Number(safeValue.toFixed(2));
  return Number((safeValue / (1 + safeVatRate / 100)).toFixed(2));
};

export const vatPortionFromGross = (gross: Prisma.Decimal, vatPct: Prisma.Decimal) => {
  const net = gross.div(new Prisma.Decimal(1).add(vatPct.div(100)));
  return gross.sub(net).toDecimalPlaces(2);
};

export const vatAmountFromNetPrice = (value: number, vatRate: number) => {
  const safeValue = Math.max(0, value);
  const safeVatRate = Math.max(0, vatRate);
  return Number((safeValue * (safeVatRate / 100)).toFixed(2));
};
