import type { Shop, AccountStatus } from "@/types";
import { isShopProfileComplete, isPrintingServicesComplete } from "@/lib/shop-status";

export type OnboardingStageStatus = "completed" | "current" | "locked" | "pending" | "rejected";

export interface OnboardingStage {
  key: "profile" | "services" | "approval";
  label: string;
  status: OnboardingStageStatus;
  /** Brief status text shown under the stage label. */
  statusText: string;
  /** Route to navigate to when the user clicks this stage (null = no navigation). */
  href: string | null;
}

export interface OnboardingState {
  profileComplete: boolean;
  servicesComplete: boolean;
  approvalRequested: boolean;
  approved: boolean;
  rejected: boolean;
  currentStage: number;
  completedCount: number;
  totalCount: 3;
  progressPercent: number;
  canSetupServices: boolean;
  canRequestApproval: boolean;
  stages: OnboardingStage[];
}

export function getShopOnboardingState(
  shop: Shop,
  accountStatus: AccountStatus | undefined,
): OnboardingState {
  const profileComplete = isShopProfileComplete(shop);
  const servicesComplete = profileComplete && isPrintingServicesComplete(shop);
  const rejected = accountStatus === "rejected";
  const approved = accountStatus === "active";
  const approvalRequested = accountStatus === "pending";

  const canSetupServices = profileComplete;
  const canRequestApproval = profileComplete && servicesComplete && !approvalRequested && !approved && !rejected;

  // Determine current stage (1-indexed: 1=profile, 2=services, 3=approval)
  let currentStage: number;
  if (rejected) {
    currentStage = 3; // can resubmit
  } else if (approved) {
    currentStage = 0; // all done
  } else if (approvalRequested) {
    currentStage = 3; // waiting for admin
  } else if (servicesComplete) {
    currentStage = 3; // ready to request
  } else if (profileComplete) {
    currentStage = 2; // do services
  } else {
    currentStage = 1; // do profile
  }

  const stages: OnboardingStage[] = [
    {
      key: "profile",
      label: "Shop Profile",
      status: profileComplete ? "completed" : currentStage === 1 ? "current" : "locked",
      statusText: profileComplete ? "Completed" : "Complete your shop details",
      href: "/shop/profile",
    },
    {
      key: "services",
      label: "Printing Services",
      status: !profileComplete
        ? "locked"
        : servicesComplete
          ? "completed"
          : currentStage === 2
            ? "current"
            : "locked",
      statusText: !profileComplete
        ? "Complete your shop profile first"
        : servicesComplete
          ? "Completed"
          : "Set up paper types & pricing",
      href: "/shop/services",
    },
    {
      key: "approval",
      label: "Request Approval",
      status: rejected
        ? "rejected"
        : approved
          ? "completed"
          : approvalRequested
            ? "current"
            : !servicesComplete
              ? "locked"
              : currentStage === 3
                ? "current"
                : "locked",
      statusText: rejected
        ? "Rejected — update & resubmit"
        : approved
          ? "Approved"
          : approvalRequested
            ? "Waiting for admin"
            : !servicesComplete
              ? "Complete services first"
              : "Submit to admin",
      href: null,
    },
  ];

  const completedCount = stages.filter((s) => s.status === "completed").length;

  return {
    profileComplete,
    servicesComplete,
    approvalRequested,
    approved,
    rejected,
    currentStage,
    completedCount,
    totalCount: 3,
    progressPercent: Math.round((completedCount / 3) * 100),
    canSetupServices,
    canRequestApproval,
    stages,
  };
}
