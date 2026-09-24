export interface CategoryOption {
  category: string;
  subcategories: string[];
}

export const RAZORPAY_CATEGORIES: CategoryOption[] = [
  { category: "retail", subcategories: ["printing and stationery", "retail stores"] },
  { category: "professional_services", subcategories: ["printing and stationery"] },
];