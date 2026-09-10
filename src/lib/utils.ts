import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface CardItem {
  id: number;
  title: string;
  description: string;
}

export const cardData: CardItem[] = [
  {
    id: 1,
    title: "Upload Your Documents",
    description:
      "Drag and drop your files or browse to upload. We support PDF, DOC, DOCX, and image formats for printing.",
  },
  {
    id: 2,
    title: "Choose Print Options",
    description:
      "Select paper size, binding, color or black & white, and quantity. Customize every detail of your order.",
  },
  {
    id: 3,
    title: "Select Delivery",
    description:
      "Pick up in-store or have it delivered to your door. Track your order status in real time.",
  },
  {
    id: 4,
    title: "Secure Payment",
    description:
      "Pay with credit card, UPI, or digital wallets. All transactions are encrypted and secure.",
  },
  {
    id: 5,
    title: "Track & Manage",
    description:
      "Monitor order progress from your dashboard. Reorder past prints with a single click.",
  },
];
