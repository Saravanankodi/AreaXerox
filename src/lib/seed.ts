import type { Address, CustomerProfile, Order, Shop } from "@/types";
import {
  demoProfile,
  demoAddresses,
  demoShops,
  demoOrders,
} from "./demo/seed-data";

export const seedShops: Shop[] = demoShops;

export const seedProfile: CustomerProfile = demoProfile;

export const seedAddresses: Address[] = demoAddresses;

export const seedOrders: Order[] = demoOrders;
