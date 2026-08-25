import type { Fulfillment, OrderStatus, PaymentMethod, PaymentStatus } from "@/types";

export const orderStatusLabel: Record<OrderStatus, string> = {
  NEW: "New",
  ACCEPTED: "Accepted",
  PRINTING: "Printing",
  FINISHING: "Finishing",
  READY_PICKUP: "Ready for Pickup",
  READY_DELIVERY: "Ready for Delivery",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
  COMPLETED: "Completed",
  REJECTED: "Rejected",
};

export const paymentStatusLabel: Record<PaymentStatus, string> = {
  unpaid: "Unpaid",
  partial: "Partially Paid",
  paid: "Fully Paid",
  failed: "Failed",
  refunded: "Refunded",
};

export const paymentMethodLabel: Record<PaymentMethod, string> = {
  full: "Paid in Full",
  advance: "Pay Advance",
  cash_pickup: "Cash at Pickup",
  cash_delivery: "Cash on Delivery",
};

export function statusFlow(fulfillment: Fulfillment): OrderStatus[] {
  return fulfillment === "pickup"
    ? ["NEW", "ACCEPTED", "PRINTING", "FINISHING", "READY_PICKUP", "COMPLETED"]
    : [
        "NEW",
        "ACCEPTED",
        "PRINTING",
        "FINISHING",
        "READY_DELIVERY",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
      ];
}

export const customerStatusCopy: Partial<Record<OrderStatus, string>> = {
  NEW: "Waiting for the shop to accept your order.",
  ACCEPTED: "The shop accepted your order and will start printing shortly.",
  PRINTING: "Your documents are being printed right now.",
  FINISHING: "Binding and finishing work is in progress.",
  READY_PICKUP: "Your order is ready. You can collect it from the shop.",
  READY_DELIVERY: "Your order is packed and waiting for the delivery partner.",
  OUT_FOR_DELIVERY: "Your order is out for delivery.",
  DELIVERED: "Your order was delivered. Thank you!",
  COMPLETED: "Order completed. Thank you!",
  REJECTED: "The shop could not take this order.",
};

export function nextStatus(current: OrderStatus, fulfillment: Fulfillment): OrderStatus | null {
  const flow = statusFlow(fulfillment);
  const i = flow.indexOf(current);
  if (i < 0 || i === flow.length - 1) return null;
  return flow[i + 1];
}

export function nextActionLabel(next: OrderStatus): string {
  switch (next) {
    case "ACCEPTED":
      return "Accept Order";
    case "PRINTING":
      return "Start Printing";
    case "FINISHING":
      return "Mark as Finishing";
    case "READY_PICKUP":
      return "Mark Ready for Pickup";
    case "READY_DELIVERY":
      return "Mark Ready for Delivery";
    case "OUT_FOR_DELIVERY":
      return "Mark Out for Delivery";
    case "DELIVERED":
      return "Mark as Delivered";
    case "COMPLETED":
      return "Mark as Completed";
    default:
      return "Update Status";
  }
}

export const fulfillmentLabel: Record<Fulfillment, string> = {
  pickup: "Pickup",
  delivery: "Delivery",
};
