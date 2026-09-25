import { createFileRoute, Link } from "@/lib/navigation";
import { useState, useMemo } from "react";
import { Star, Search, MessageSquare, Send } from "lucide-react";
import { toast } from "sonner";
import { ShopShell } from "@/components/layout/ShopShell";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { useMyShop } from "@/lib/useMyShop";
import { shopAggregateRating } from "@/lib/shop-rating";
import { cn } from "@/lib/utils";
import type { Review } from "@/types";

export const Route = createFileRoute("/shop/reviews")({
  head: () => ({
    meta: [
      { title: "Reviews — XEROXMATE Shop" },
      {
        name: "description",
        content: "View customer reviews and ratings for your shop.",
      },
      { property: "og:title", content: "Reviews — XEROXMATE Shop" },
      { property: "og:description", content: "View customer reviews and ratings." },
    ],
  }),
  component: ShopReviews,
});

const RATING_FILTERS = [0, 5, 4, 3, 2, 1] as const;

function ShopReviews() {
  const { reviews } = useStore();
  const shop = useMyShop();
  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState<number>(0);

  const shopReviews = useMemo(() => {
    let result = reviews.filter((r) => r.shopId === shop.id);

    if (ratingFilter > 0) {
      result = result.filter((r) => r.rating === ratingFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.customerName.toLowerCase().includes(q) ||
          r.orderId.toLowerCase().includes(q),
      );
    }

    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [reviews, shop.id, ratingFilter, search]);

  const agg = shopAggregateRating(reviews, shop.id);

  return (
    <ShopShell title="Reviews" subtitle="Customer feedback for your shop.">
      {/* Summary */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="card-surface flex items-center gap-3 px-5 py-3">
          <Star className="h-5 w-5 fill-primary text-primary" />
          <div>
            <p className="text-lg font-bold">
              {agg ? agg.rating.toFixed(1) : "—"}
            </p>
            <p className="text-xs text-muted-foreground">
              {agg ? `Based on ${agg.count} review${agg.count === 1 ? "" : "s"}` : "No reviews yet"}
            </p>
          </div>
        </div>
        <div className="mb-4 flex justify-end  items-center gap-4 ">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by customer name or order ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-full rounded-md border border-border bg-card pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {RATING_FILTERS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRatingFilter(r)}
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                  ratingFilter === r
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground",
                )}
              >
                {r === 0 ? "All" : `${r}★`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Empty state */}
      {shopReviews.length === 0 && (
        <div className="py-16 text-center">
          <MessageSquare className="mx-auto h-8 w-8 text-muted-foreground/40" />
          <p className="mt-3 text-sm text-muted-foreground">
            {reviews.filter((r) => r.shopId === shop.id).length === 0
              ? "No reviews yet."
              : "No reviews match your filters."}
          </p>
        </div>
      )}

      {/* Responsive review grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {shopReviews.map((review) => (
          <ShopReviewCard key={review.id} review={review} />
        ))}
      </div>
    </ShopShell>
  );
}

function ShopReviewCard({ review }: { review: Review }) {
  const { orders, replyToReview } = useStore();
  const [replyDraft, setReplyDraft] = useState("");
  const [showReplyBox, setShowReplyBox] = useState(false);
  const order = orders.find((o) => o.id === review.orderId);

  function submitReply() {
    const text = replyDraft.trim();
    if (!text) {
      toast.error("Enter a reply before sending.");
      return;
    }
    replyToReview(review.id, text);
    setReplyDraft("");
    setShowReplyBox(false);
    toast.success("Reply published.");
  }

  return (
    <div className="card-surface flex flex-col p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold">{review.customerName}</p>
          <div className="mt-1 flex gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={cn(
                  "h-4 w-4",
                  star <= review.rating
                    ? "fill-primary text-primary"
                    : "fill-none text-muted-foreground/40",
                )}
              />
            ))}
          </div>
        </div>
        <span className="shrink-0 text-xs text-muted-foreground">
          {new Date(review.createdAt).toLocaleDateString("en-IN")}
        </span>
      </div>
      {review.description ? (
        <p className="mt-2 flex-1 text-sm text-muted-foreground">{review.description}</p>
      ) : (
        <p className="mt-2 flex-1 text-sm italic text-muted-foreground/60">No additional comment.</p>
      )}

      {review.reply && (
        <div className="mt-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">{`Shop's reply`}</p>
          <p className="mt-1 text-sm">{review.reply}</p>
        </div>
      )}

      {showReplyBox && (
        <textarea
          value={replyDraft}
          onChange={(e) => setReplyDraft(e.target.value)}
          rows={2}
          placeholder="Reply to this review…"
          className="mt-3 w-full rounded-md border border-border bg-card px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none"
        />
      )}

      <div className="mt-3 flex items-center gap-2 border-t border-border pt-2 text-xs text-muted-foreground">
        <span>Order:</span>
        {order ? (
          <Link
            to="/shop/orders/$orderId"
            params={{ orderId: review.orderId }}
            className="font-medium text-primary hover:underline"
          >
            {review.orderId}
          </Link>
        ) : (
          <span className="font-medium">{review.orderId}</span>
        )}
      </div>

      <div className="mt-3 flex justify-end gap-2">
        {showReplyBox ? (
          <>
            <Button size="sm" variant="outline" onClick={() => { setShowReplyBox(false); setReplyDraft(""); }}>
              Cancel
            </Button>
            <Button size="sm" onClick={submitReply} className="gap-1">
              <Send className="h-3.5 w-3.5" /> Publish
            </Button>
          </>
        ) : (
          <Button size="sm" variant="outline" onClick={() => setShowReplyBox(true)}>
            {review.reply ? "Edit reply" : "Reply"}
          </Button>
        )}
      </div>
    </div>
  );
}
