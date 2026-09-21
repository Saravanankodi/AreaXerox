"use client";

import { useState } from "react";
import { Star, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";
import type { Order, Review } from "@/types";

export function ReviewCard({ order }: { order: Order }) {
  const { reviews, addReview, addNotification } = useStore();
  const { session } = useAuth();

  const existingReview = reviews.find(
    (r) => r.orderId === order.id && r.shopId === order.shopId,
  );

  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (existingReview) {
    return <SubmittedReview review={existingReview} />;
  }

  const needsDescription = rating > 0 && rating <= 3;
  const displayRating = hoveredStar || rating;

  function handleSubmit() {
    if (rating === 0) {
      toast.error("Please select a rating.");
      return;
    }
    if (needsDescription && !description.trim()) {
      toast.error("Please tell us what went wrong.");
      return;
    }
    if (submitting) return;

    setSubmitting(true);
    try {
      const review: Review = {
        id: `rev-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        orderId: order.id,
        shopId: order.shopId,
        customerId: session?.accountId ?? "anonymous",
        customerName: session?.name ?? "Customer",
        rating,
        description: description.trim(),
        createdAt: new Date().toISOString(),
      };
      addReview(review);
      addNotification(
        createNotification({
          recipientId: order.shopId,
          recipientRole: "shopkeeper",
          type: "review_received",
          title: "New Review Received",
          message: `${review.customerName} left a ${review.rating}-star review on order ${order.id}.`,
          relatedEntityId: review.id,
          entityType: "review",
        }),
      );
      toast.success("Review submitted successfully.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="card-surface p-5">
      <h2 className="text-base font-semibold">Review {order.shopName}</h2>
      <p className="mt-2 text-sm text-muted-foreground">How was your experience?</p>

      {/* Stars */}
      <div className="mt-3 flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            aria-label={`${star} star${star > 1 ? "s" : ""}`}
            className="p-0.5 transition-colors"
            onMouseEnter={() => setHoveredStar(star)}
            onMouseLeave={() => setHoveredStar(0)}
            onClick={() => setRating(star)}
          >
            <Star
              className={`h-6 w-6 ${
                star <= displayRating
                  ? "fill-primary text-primary"
                  : "fill-none text-muted-foreground/40"
              }`}
            />
          </button>
        ))}
      </div>

      {/* Description */}
      <div className="mt-4">
        <label className="text-sm text-muted-foreground">
          {needsDescription
            ? "Tell us what went wrong *"
            : "Tell us about your experience (optional)"}
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="mt-2 w-full rounded-md border border-border bg-card px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          placeholder={
            needsDescription
              ? "Describe the issue so we can improve..."
              : "Share your feedback..."
          }
        />
      </div>

      {/* Submit */}
      <div className="mt-3 flex justify-end">
        <button
          type="button"
          disabled={submitting}
          onClick={handleSubmit}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {submitting ? "Submitting…" : "Submit Review"}
        </button>
      </div>
    </div>
  );
}

function SubmittedReview({ review }: { review: Review }) {
  return (
    <div className="card-surface p-5">
      <div className="flex items-center gap-2">
        <CheckCircle className="h-4 w-4 text-success" />
        <h2 className="text-base font-semibold">Your Review</h2>
      </div>
      <div className="mt-3 flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-5 w-5 ${
              star <= review.rating
                ? "fill-primary text-primary"
                : "fill-none text-muted-foreground/40"
            }`}
          />
        ))}
      </div>
      {review.description && (
        <p className="mt-2 text-sm text-muted-foreground">"{review.description}"</p>
      )}
      {!review.description && (
        <p className="mt-2 text-sm text-muted-foreground italic">No additional comment.</p>
      )}
    </div>
  );
}
