export const formatNumber = (num: number | string | undefined | null): string => {
  if (num === undefined || num === null) return "0.00";
  const n = typeof num === "string" ? parseFloat(num) : num;
  if (isNaN(n)) return "0.00";
  return n.toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const formatCurrency = (
  amount: number | string | undefined | null,
  currency: string = "₦"
): string => {
  return `${currency}${formatNumber(amount)}`;
};
