export const BAG_TYPES = [
  "backpack",
  "carry-on",
  "handbag",
  "luggage",
  "other",
  "toiletry bag",
  "worn",
] as const;

export type BagType = (typeof BAG_TYPES)[number];
