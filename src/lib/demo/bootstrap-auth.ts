import type { Account } from "@/types";

const ACCOUNTS_KEY = "omx-accounts-v1";

function hashPassword(pw: string): string {
  let hash = 0;
  for (let i = 0; i < pw.length; i++) {
    const char = pw.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `h_${Math.abs(hash).toString(36)}_${pw.length}`;
}

const DEMO_ACCOUNTS: Account[] = [
  {
    id: "acc-customer-1",
    email: "tamil.kumaran@gmail.com",
    passwordHash: hashPassword("demo1234"),
    role: "customer",
    registrationStatus: "complete",
    accountStatus: "active",
    createdAt: "2026-06-15T08:00:00.000Z",
    updatedAt: "2026-06-15T08:00:00.000Z",
  },
  {
    id: "acc-customer-2",
    email: "divya.ramesh@gmail.com",
    passwordHash: hashPassword("demo1234"),
    role: "customer",
    registrationStatus: "complete",
    accountStatus: "active",
    createdAt: "2026-07-01T09:30:00.000Z",
    updatedAt: "2026-07-01T09:30:00.000Z",
  },
  {
    id: "acc-customer-3",
    email: "karthik.selvam@gmail.com",
    passwordHash: hashPassword("demo1234"),
    role: "customer",
    registrationStatus: "complete",
    accountStatus: "active",
    createdAt: "2026-07-10T10:15:00.000Z",
    updatedAt: "2026-07-10T10:15:00.000Z",
  },
  {
    id: "acc-shop-1",
    email: "ramesh.kumar@shop.in",
    passwordHash: hashPassword("demo1234"),
    role: "shopkeeper",
    registrationStatus: "complete",
    accountStatus: "active",
    createdAt: "2026-05-01T07:00:00.000Z",
    updatedAt: "2026-05-01T07:00:00.000Z",
  },
  {
    id: "acc-shop-2",
    email: "lakshmi.narayanan@shop.in",
    passwordHash: hashPassword("demo1234"),
    role: "shopkeeper",
    registrationStatus: "complete",
    accountStatus: "active",
    createdAt: "2026-05-10T08:00:00.000Z",
    updatedAt: "2026-05-10T08:00:00.000Z",
  },
  {
    id: "acc-shop-3",
    email: "arun.prasad@shop.in",
    passwordHash: hashPassword("demo1234"),
    role: "shopkeeper",
    registrationStatus: "complete",
    accountStatus: "active",
    createdAt: "2026-05-15T09:00:00.000Z",
    updatedAt: "2026-05-15T09:00:00.000Z",
  },
  {
    id: "acc-shop-4",
    email: "lakshmi.devi@shop.in",
    passwordHash: hashPassword("demo1234"),
    role: "shopkeeper",
    registrationStatus: "complete",
    accountStatus: "active",
    createdAt: "2026-05-20T10:00:00.000Z",
    updatedAt: "2026-05-20T10:00:00.000Z",
  },
  {
    id: "acc-shop-5",
    email: "rajesh.kumar@shop.in",
    passwordHash: hashPassword("demo1234"),
    role: "shopkeeper",
    registrationStatus: "complete",
    accountStatus: "active",
    createdAt: "2026-06-01T07:30:00.000Z",
    updatedAt: "2026-06-01T07:30:00.000Z",
  },
  {
    id: "acc-shop-6",
    email: "anand.prasad@shop.in",
    passwordHash: hashPassword("demo1234"),
    role: "shopkeeper",
    registrationStatus: "complete",
    accountStatus: "active",
    createdAt: "2026-06-05T08:30:00.000Z",
    updatedAt: "2026-06-05T08:30:00.000Z",
  },
  {
    id: "acc-shop-7",
    email: "kumaravel@shop.in",
    passwordHash: hashPassword("demo1234"),
    role: "shopkeeper",
    registrationStatus: "complete",
    accountStatus: "active",
    createdAt: "2026-06-10T09:00:00.000Z",
    updatedAt: "2026-06-10T09:00:00.000Z",
  },
  {
    id: "acc-shop-8",
    email: "senthil.murugan@shop.in",
    passwordHash: hashPassword("demo1234"),
    role: "shopkeeper",
    registrationStatus: "complete",
    accountStatus: "active",
    createdAt: "2026-06-15T10:00:00.000Z",
    updatedAt: "2026-06-15T10:00:00.000Z",
  },
  {
    id: "acc-admin-1",
    email: "admin@ordermyxerox.in",
    passwordHash: hashPassword("admin123"),
    role: "admin",
    registrationStatus: "complete",
    accountStatus: "active",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
];

export function bootstrapDemoAccounts(): void {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    const existing: Account[] = raw ? JSON.parse(raw) : [];
    const existingEmails = new Set(existing.map((a) => a.email.toLowerCase()));
    const newAccounts = DEMO_ACCOUNTS.filter(
      (a) => !existingEmails.has(a.email.toLowerCase()),
    );
    if (newAccounts.length > 0) {
      localStorage.setItem(
        ACCOUNTS_KEY,
        JSON.stringify([...existing, ...newAccounts]),
      );
    }
  } catch {
    /* storage unavailable */
  }
}
