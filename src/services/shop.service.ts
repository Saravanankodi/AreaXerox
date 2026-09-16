import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase/firestore";
import type { Shop, ShopApplication, PaperType, ServiceOption } from "@/types";

export const defaultPaperTypes: PaperType[] = [
  {
    id: "a4",
    name: "A4 Normal (75 GSM)",
    enabled: true,
    bwEnabled: true,
    bwPrice: 2,
    colorEnabled: true,
    colorPrice: 10,
    single: true,
    double: true,
  },
  {
    id: "a3",
    name: "A3 Large (80 GSM)",
    enabled: true,
    bwEnabled: true,
    bwPrice: 5,
    colorEnabled: true,
    colorPrice: 20,
    single: true,
    double: true,
  },
  {
    id: "bond",
    name: "Bond Paper (85 GSM)",
    enabled: false,
    bwEnabled: true,
    bwPrice: 4,
    colorEnabled: true,
    colorPrice: 15,
    single: true,
    double: true,
  },
  {
    id: "photo",
    name: "Photo Glossy (180 GSM)",
    enabled: false,
    bwEnabled: false,
    bwPrice: 0,
    colorEnabled: true,
    colorPrice: 35,
    single: true,
    double: false,
  },
];

export const defaultBindingOptions: ServiceOption[] = [
  { id: "none", name: "No Binding", enabled: true, price: 0 },
  { id: "staple", name: "Corner Staple", enabled: true, price: 5 },
  { id: "spiral", name: "Spiral Binding", enabled: true, price: 30 },
  { id: "hardcover", name: "Hardcover Book", enabled: true, price: 120 },
];

export const defaultAdditionalOptions: ServiceOption[] = [
  { id: "lamination", name: "Gloss Lamination", enabled: true, price: 15, perPage: true },
  { id: "punching", name: "2-Hole / 4-Hole Punch", enabled: true, price: 5 },
];

export function buildShopFromApplication(app: ShopApplication, email = ""): Shop {
  const hours = `${app.services.businessHoursFrom} – ${app.services.businessHoursTo}`;
  const days = app.services.workingDays;
  const workingDaysFrom = days.length > 0 ? days[0] : "Mon";
  const workingDaysTo = days.length > 1 ? days[days.length - 1] : "Sat";

  const papers = defaultPaperTypes.map((p) => {
    if (p.id === "a4") return { ...p, enabled: app.services.a4 };
    if (p.id === "a3") return { ...p, enabled: app.services.a3 };
    if (p.id === "bond") return { ...p, enabled: app.services.bondSheet };
    if (p.id === "photo") return { ...p, enabled: app.services.photoSheet };
    return p;
  });

  return {
    id: app.accountId || app.id,
    name: app.shopName,
    ownerName: app.shopkeeperProfile.ownerName,
    phone: app.shopkeeperProfile.phone,
    whatsappNumber: app.whatsappNumber || app.shopkeeperProfile.phone,
    email: email || `${app.shopkeeperProfile.username}@xeroxmate.com`,
    address: `${app.shopAddress}${app.area ? `, ${app.area}` : ""}, ${app.city} - ${app.pincode}`,
    hours,
    workingDaysFrom,
    workingDaysTo,
    openingTime: app.services.businessHoursFrom,
    closingTime: app.services.businessHoursTo,
    rating: 4.9,
    distanceKm: 1.2,
    prepMinutes: 20,
    pickup: app.services.pickup,
    paperTypes: papers,
    printTypes: {
      bw: app.services.bw,
      color: app.services.colour,
    },
    printSides: {
      single: true,
      double: true,
    },
    orientation: {
      portrait: true,
      landscape: true,
    },
    binding: defaultBindingOptions,
    additional: defaultAdditionalOptions,
    delivery: {
      enabled: app.services.delivery,
      fee: app.services.deliveryFee || 30,
      freeAbove: 200,
      etaMinutes: "30-45 min",
      areas: [app.area || app.city],
    },
    payments: {
      full: true,
      advance: true,
      cashPickup: app.services.pickup,
      cashDelivery: app.services.delivery,
      advancePercent: 40,
    },
  };
}

export async function getShops(): Promise<Shop[]> {
  const colRef = collection(db, "shops");
  const snap = await getDocs(colRef);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Shop);
}

export function listenShops(callback: (shops: Shop[]) => void) {
  const colRef = collection(db, "shops");
  return onSnapshot(colRef, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Shop));
  });
}

export async function getShop(shopId: string): Promise<Shop | null> {
  const snap = await getDoc(doc(db, "shops", shopId));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Shop) : null;
}

export async function saveShop(shop: Shop): Promise<void> {
  await setDoc(doc(db, "shops", shop.id), shop, { merge: true });
}

export async function updateShopInDb(
  shopId: string,
  updater: (prev: Shop) => Shop | Partial<Shop>,
): Promise<void> {
  const docRef = doc(db, "shops", shopId);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    const prev = { id: snap.id, ...snap.data() } as Shop;
    const updated = updater(prev);
    await setDoc(docRef, { ...prev, ...updated }, { merge: true });
  }
}
