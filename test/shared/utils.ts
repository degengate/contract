import Decimal from "decimal.js";

export const getTokenAmountWei = (count: number | bigint): bigint => {
  return BigInt(10) ** BigInt(18) * BigInt(count);
};

export const getTokenAmountWeiFromDecimal = (count: string): bigint => {
  let wei = BigInt(10) ** BigInt(18);
  return BigInt(new Decimal(count).times(wei.toString()).toFixed(0));
};