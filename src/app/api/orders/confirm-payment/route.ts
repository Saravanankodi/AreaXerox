import type { NextRequest } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";

import {
    getAdminFirestore,
    verifyFirebaseIdToken,
} from "@/lib/firebase/admin";

import {
    calculateOrderPrice,
    paymentSplit,
} from "@/lib/pricing";

import {
    getRazorpay,
    getRazorpayCredentials,
    rupeeToPaise,
} from "@/lib/razorpay/server";

import type {
    Order,
    Shop,
    DocumentFile,
    PrintConfig,
    Fulfillment,
    Address,
    PaymentMethod,
} from "@/types";

export const runtime = "nodejs";

type OrderDraft = {
    id: string;
    shopId: string;
    documents: DocumentFile[];
    config: PrintConfig;
    fulfillment: Fulfillment;
    address?: Address | null;
    paymentMethod: PaymentMethod;
    notes?: string;
};

type ConfirmPaymentBody = {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    orderDraft: OrderDraft;
};

function verifySignature(
    payload: string,
    signature: string,
    secret: string
): boolean {
    try {
        if (!payload || !signature || !secret) {
            return false;
        }

        const expected = createHmac("sha256", secret)
            .update(payload)
            .digest();

        const provided = Buffer.from(signature, "hex");

        if (provided.length !== expected.length) {
            return false;
        }

        return timingSafeEqual(provided, expected);
    } catch (error) {
        console.error(
            "[confirm-payment] Signature verification error:",
            error
        );

        return false;
    }
}

function getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        return error.message;
    }

    if (typeof error === "string") {
        return error;
    }

    try {
        return JSON.stringify(error);
    } catch {
        return "Unknown server error";
    }
}

export async function POST(request: NextRequest) {
    try {
        console.log("[confirm-payment] ===== START =====");

        // =========================================================
        // 1. AUTHENTICATION
        // =========================================================

        const authHeader =
            request.headers.get("authorization") ?? "";

        if (!authHeader) {
            console.error(
                "[confirm-payment] Missing authorization header"
            );

            return Response.json(
                {
                    error: "Authentication required.",
                },
                {
                    status: 401,
                }
            );
        }

        const token = authHeader
            .replace(/^Bearer\s+/i, "")
            .trim();

        if (!token) {
            console.error(
                "[confirm-payment] Empty Firebase token"
            );

            return Response.json(
                {
                    error: "Authentication required.",
                },
                {
                    status: 401,
                }
            );
        }

        console.log(
            "[confirm-payment] Authenticating Firebase user..."
        );

        const user = await verifyFirebaseIdToken(token);

        console.log(
            "[confirm-payment] Firebase user authenticated:",
            user.uid
        );

        // =========================================================
        // 2. READ REQUEST BODY
        // =========================================================

        const body =
            (await request.json()) as Partial<ConfirmPaymentBody>;

        const razorpay_order_id =
            body.razorpay_order_id;

        const razorpay_payment_id =
            body.razorpay_payment_id;

        const razorpay_signature =
            body.razorpay_signature;

        const orderDraft =
            body.orderDraft;

        console.log(
            "[confirm-payment] Request received:",
            {
                razorpayOrderId:
                    razorpay_order_id,

                razorpayPaymentId:
                    razorpay_payment_id,

                hasSignature:
                    Boolean(razorpay_signature),

                orderId:
                    orderDraft?.id,

                shopId:
                    orderDraft?.shopId,
            }
        );

        // =========================================================
        // 3. BASIC VALIDATION
        // =========================================================

        if (
            typeof razorpay_order_id !== "string" ||
            typeof razorpay_payment_id !== "string" ||
            typeof razorpay_signature !== "string" ||
            !orderDraft
        ) {
            console.error(
                "[confirm-payment] Missing required payment fields"
            );

            return Response.json(
                {
                    error:
                        "Missing required payment fields.",
                },
                {
                    status: 400,
                }
            );
        }

        const {
            id: orderId,
            shopId,
            documents,
            config,
            fulfillment,
            address,
            paymentMethod,
            notes,
        } = orderDraft;

        if (
            typeof orderId !== "string" ||
            !orderId.trim() ||
            typeof shopId !== "string" ||
            !shopId.trim() ||
            !Array.isArray(documents) ||
            documents.length === 0 ||
            !config ||
            !fulfillment ||
            !paymentMethod
        ) {
            console.error(
                "[confirm-payment] Invalid order draft"
            );

            return Response.json(
                {
                    error: "Invalid order draft.",
                },
                {
                    status: 400,
                }
            );
        }

        // =========================================================
        // 4. RAZORPAY CREDENTIALS
        // =========================================================

        console.log(
            "[confirm-payment] Loading Razorpay credentials..."
        );

        const {
            key_secret,
        } = getRazorpayCredentials();

        if (!key_secret) {
            console.error(
                "[confirm-payment] Razorpay secret is missing"
            );

            return Response.json(
                {
                    error:
                        "Payment configuration error.",
                },
                {
                    status: 500,
                }
            );
        }

        // =========================================================
        // 5. VERIFY RAZORPAY SIGNATURE
        // =========================================================

        console.log(
            "[confirm-payment] Verifying Razorpay signature..."
        );

        const signaturePayload =
            `${razorpay_order_id}|${razorpay_payment_id}`;

        const signatureValid =
            verifySignature(
                signaturePayload,
                razorpay_signature,
                key_secret
            );

        if (!signatureValid) {
            console.error(
                "[confirm-payment] Invalid Razorpay signature"
            );

            return Response.json(
                {
                    error:
                        "Invalid payment signature.",
                },
                {
                    status: 400,
                }
            );
        }

        console.log(
            "[confirm-payment] Razorpay signature valid"
        );

        // =========================================================
        // 6. FIRESTORE
        // =========================================================

        console.log(
            "[confirm-payment] Initializing Firestore..."
        );

        const db =
            getAdminFirestore();

        console.log(
            "[confirm-payment] Firestore initialized"
        );

        // =========================================================
        // 7. IDEMPOTENCY CHECK
        // =========================================================

        console.log(
            "[confirm-payment] Checking existing order for Razorpay order:",
            razorpay_order_id
        );

        const existingSnap =
            await db
                .collection("orders")
                .where(
                    "razorpayOrderId",
                    "==",
                    razorpay_order_id
                )
                .limit(1)
                .get();

        if (!existingSnap.empty) {
            const existingDoc =
                existingSnap.docs[0];

            const existingData =
                existingDoc.data();

            console.log(
                "[confirm-payment] Order already exists:",
                existingDoc.id
            );

            return Response.json({
                success: true,
                orderId: existingDoc.id,
                paymentStatus:
                    existingData.paymentStatus ??
                    "unknown",
                alreadyExists: true,
            });
        }

        console.log(
            "[confirm-payment] No existing order found"
        );

        // =========================================================
        // 8. FETCH RAZORPAY ORDER
        // =========================================================

        console.log(
            "[confirm-payment] Fetching Razorpay order:",
            razorpay_order_id
        );

        const razorpay =
            getRazorpay();

        const razorpayOrder =
            await razorpay.orders.fetch(
                razorpay_order_id
            );

        console.log(
            "[confirm-payment] Razorpay order fetched:",
            {
                id:
                    razorpayOrder.id,

                receipt:
                    razorpayOrder.receipt,

                amount:
                    razorpayOrder.amount,

                currency:
                    razorpayOrder.currency,

                status:
                    razorpayOrder.status,
            }
        );

        // =========================================================
        // 9. VERIFY RAZORPAY ORDER ID
        // =========================================================

        if (
            razorpayOrder.id !==
            razorpay_order_id
        ) {
            console.error(
                "[confirm-payment] Razorpay order ID mismatch"
            );

            return Response.json(
                {
                    error:
                        "Invalid Razorpay order.",
                },
                {
                    status: 400,
                }
            );
        }

        // =========================================================
        // 10. VERIFY RECEIPT
        // =========================================================

        if (
            razorpayOrder.receipt !==
            orderId
        ) {
            console.error(
                "[confirm-payment] Receipt mismatch:",
                {
                    razorpayReceipt:
                        razorpayOrder.receipt,

                    expectedOrderId:
                        orderId,
                }
            );

            return Response.json(
                {
                    error:
                        "Payment does not match this order.",
                },
                {
                    status: 400,
                }
            );
        }

        console.log(
            "[confirm-payment] Razorpay receipt verified"
        );

        // =========================================================
        // 11. FETCH RAZORPAY PAYMENT
        // =========================================================

        console.log(
            "[confirm-payment] Fetching Razorpay payment:",
            razorpay_payment_id
        );

        const razorpayPayment =
            await razorpay.payments.fetch(
                razorpay_payment_id
            );

        console.log(
            "[confirm-payment] Razorpay payment fetched:",
            {
                id:
                    razorpayPayment.id,

                order_id:
                    razorpayPayment.order_id,

                amount:
                    razorpayPayment.amount,

                currency:
                    razorpayPayment.currency,

                status:
                    razorpayPayment.status,

                method:
                    razorpayPayment.method,
            }
        );

        // =========================================================
        // 12. VERIFY PAYMENT BELONGS TO ORDER
        // =========================================================

        if (
            razorpayPayment.order_id !==
            razorpay_order_id
        ) {
            console.error(
                "[confirm-payment] Payment/order mismatch:",
                {
                    paymentOrderId:
                        razorpayPayment.order_id,

                    razorpayOrderId:
                        razorpay_order_id,
                }
            );

            return Response.json(
                {
                    error:
                        "Payment does not belong to this order.",
                },
                {
                    status: 400,
                }
            );
        }

        // =========================================================
        // 13. VERIFY PAYMENT AMOUNT
        // =========================================================

        if (
            Number(
                razorpayPayment.amount
            ) !==
            Number(
                razorpayOrder.amount
            )
        ) {
            console.error(
                "[confirm-payment] Payment amount mismatch:",
                {
                    paymentAmount:
                        razorpayPayment.amount,

                    orderAmount:
                        razorpayOrder.amount,
                }
            );

            return Response.json(
                {
                    error:
                        "Payment amount does not match the Razorpay order.",
                },
                {
                    status: 400,
                }
            );
        }

        // =========================================================
        // 14. VERIFY CURRENCY
        // =========================================================

        if (
            razorpayPayment.currency &&
            razorpayOrder.currency &&
            razorpayPayment.currency !==
                razorpayOrder.currency
        ) {
            console.error(
                "[confirm-payment] Currency mismatch:",
                {
                    paymentCurrency:
                        razorpayPayment.currency,

                    orderCurrency:
                        razorpayOrder.currency,
                }
            );

            return Response.json(
                {
                    error:
                        "Payment currency does not match the order.",
                },
                {
                    status: 400,
                }
            );
        }

        // =========================================================
        // 15. VERIFY PAYMENT STATUS
        // =========================================================

        if (
            razorpayPayment.status !==
                "captured" &&
            razorpayPayment.status !==
                "authorized"
        ) {
            console.error(
                "[confirm-payment] Payment is not successful:",
                razorpayPayment.status
            );

            return Response.json(
                {
                    error:
                        `Payment is not successful. Current status: ${razorpayPayment.status}`,
                },
                {
                    status: 400,
                }
            );
        }

        console.log(
            "[confirm-payment] Payment status verified:",
            razorpayPayment.status
        );

        // =========================================================
        // 16. FETCH SHOP
        // =========================================================

        console.log(
            "[confirm-payment] Fetching shop:",
            shopId
        );

        const shopSnapshot =
            await db
                .doc(`shops/${shopId}`)
                .get();

        if (!shopSnapshot.exists) {
            console.error(
                "[confirm-payment] Shop not found:",
                shopId
            );

            return Response.json(
                {
                    error:
                        "Shop not found.",
                },
                {
                    status: 404,
                }
            );
        }

        const shop =
            shopSnapshot.data() as Shop;

        console.log(
            "[confirm-payment] Shop loaded:",
            {
                id:
                    shop.id,

                name:
                    shop.name,
            }
        );

        // =========================================================
        // 17. SERVER-SIDE PRICE CALCULATION
        // =========================================================

        console.log(
            "[confirm-payment] Calculating order price..."
        );

        const price =
            calculateOrderPrice(
                shop,
                documents,
                config,
                fulfillment
            );

        console.log(
            "[confirm-payment] Price calculated:",
            price
        );

        // =========================================================
        // 18. PAYMENT SPLIT
        // =========================================================

        console.log(
            "[confirm-payment] Calculating payment split..."
        );

        const split =
            paymentSplit(
                shop,
                price.total,
                paymentMethod
            );

        console.log(
            "[confirm-payment] Payment split calculated:",
            split
        );

        // =========================================================
        // 19. VERIFY AMOUNT AGAINST SERVER PRICE
        // =========================================================

        const expectedAmountPaise =
            rupeeToPaise(
                split.paidNow
            );

        const actualAmountPaise =
            Number(
                razorpayOrder.amount
            );

        console.log(
            "[confirm-payment] Amount comparison:",
            {
                expectedAmountPaise,

                actualAmountPaise,

                expectedRupees:
                    split.paidNow,

                razorpayRupees:
                    actualAmountPaise / 100,
            }
        );

        if (
            actualAmountPaise !==
            expectedAmountPaise
        ) {
            console.error(
                "[confirm-payment] Final amount mismatch"
            );

            return Response.json(
                {
                    error:
                        "Payment amount does not match the order total.",
                },
                {
                    status: 400,
                }
            );
        }

        // =========================================================
        // 20. CHECK TARGET ORDER
        // =========================================================

        console.log(
            "[confirm-payment] Checking target order document:",
            orderId
        );

        const targetDoc =
            db.doc(`orders/${orderId}`);

        const targetSnapshot =
            await targetDoc.get();

        if (targetSnapshot.exists) {
            console.log(
                "[confirm-payment] Target order already exists:",
                orderId
            );

            return Response.json(
                {
                    error:
                        "Order already exists.",
                    orderId,
                },
                {
                    status: 409,
                }
            );
        }

        // =========================================================
        // 21. BASIC ORDER VALUES
        // =========================================================

        const now =
            new Date().toISOString();

        const primaryConfig =
            documents[0]?.printConfig ??
            config;

        const primaryPaper =
            shop.paperTypes?.find(
                (item) =>
                    item.id ===
                    primaryConfig.paperTypeId
            );

        // =========================================================
        // 22. USER PROFILE
        // =========================================================

        let customerName =
            "Customer";

        let customerPhone =
            "";

        try {
            console.log(
                "[confirm-payment] Loading user profile:",
                user.uid
            );

            const userDoc =
                await db
                    .doc(`users/${user.uid}`)
                    .get();

            if (userDoc.exists) {
                const userData =
                    userDoc.data();

                if (userData) {
                    customerName =
                        String(
                            userData.name ||
                            userData.profile?.name ||
                            "Customer"
                        );

                    customerPhone =
                        String(
                            userData.phone ||
                            userData.profile?.phone ||
                            ""
                        );
                }
            }
        } catch (userError) {
            console.warn(
                "[confirm-payment] Could not load user profile:",
                getErrorMessage(
                    userError
                )
            );
        }

        // =========================================================
        // 23. CREATE ORDER
        // =========================================================

        const order: Order = {
            id: orderId,

            customerId:
                user.uid,

            customerName,

            customerPhone,

            shopId:
                shop.id,

            shopName:
                shop.name,

            documents,

            config:
                primaryConfig,

            configLabels: {
                paper:
                    primaryPaper?.name ??
                    "A4 Paper",

                printType:
                    primaryConfig.printType ===
                    "bw"
                        ? "Black & White"
                        : "Colour",

                side:
                    primaryConfig.side ===
                    "single"
                        ? "Single Side"
                        : "Double Side",

                orientation:
                    primaryConfig.orientation ===
                    "portrait"
                        ? "Portrait"
                        : "Landscape",

                binding:
                    shop.binding?.find(
                        (binding) =>
                            binding.id ===
                            primaryConfig.bindingId
                    )?.name ??
                    "None",

                additional:
                    (
                        primaryConfig.additionalIds ??
                        []
                    )
                        .map(
                            (id) =>
                                shop.additional?.find(
                                    (item) =>
                                        item.id ===
                                        id
                                )?.name
                        )
                        .filter(
                            (
                                name
                            ): name is string =>
                                Boolean(name)
                        ),
            },

            fulfillment,

            address:
                fulfillment ===
                "delivery"
                    ? address || null
                    : null,

            notes:
                notes?.trim() ||
                null,

            price,

            paymentMethod,

            amountPaid:
                split.paidNow,

            balance:
                split.balance,

            paymentStatus:
                split.paidNow === 0
                    ? "unpaid"
                    : split.balance === 0
                        ? "paid"
                        : "partial",

            status:
                "NEW",

            createdAt:
                now,

            updatedAt:
                now,

            timeline: [
                {
                    status:
                        "NEW",

                    at:
                        now,
                },
            ],

            razorpayOrderId:
                razorpay_order_id,

            razorpayPaymentId:
                razorpay_payment_id,

            razorpaySignature:
                razorpay_signature,

            paymentGateway:
                "razorpay",

            settlementStatus:
                "pending",
        };

        // =========================================================
        // 24. IMPORTANT:
        // ONLY ADD payout status WHEN IT HAS A REAL VALUE.
        //
        // Do NOT put:
        //
        // razorpayPayoutStatus: undefined
        //
        // into a Firestore document.
        // =========================================================

        if (
            shop.payoutEnabled === true &&
            !!shop.razorpayAccountId
        ) {
            order.razorpayPayoutStatus =
                "pending";
        }

        // =========================================================
        // 25. SAVE ORDER
        // =========================================================

        console.log(
            "[confirm-payment] Saving order:",
            orderId
        );

        await targetDoc.set(order);

        console.log(
            "[confirm-payment] Order successfully created:",
            orderId
        );

        // =========================================================
        // 26. SUCCESS
        // =========================================================

        console.log(
            "[confirm-payment] ===== SUCCESS ====="
        );

        return Response.json({
            success: true,

            orderId,

            paymentStatus:
                order.paymentStatus,
        });
    } catch (error: unknown) {
        // =========================================================
        // GLOBAL ERROR HANDLER
        // =========================================================

        const message =
            getErrorMessage(error);

        console.error(
            "[confirm-payment] ===== FAILED ====="
        );

        console.error(
            "[confirm-payment] Error:",
            error
        );

        console.error(
            "[confirm-payment] Message:",
            message
        );

        return Response.json(
            {
                error:
                    process.env.NODE_ENV ===
                    "development"
                        ? message
                        : "Failed to confirm payment. Please contact support.",
            },
            {
                status: 500,
            }
        );
    }
}
