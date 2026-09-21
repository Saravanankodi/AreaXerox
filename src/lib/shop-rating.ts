import type { Review, Shop } from "@/types";

export function shopAggregateRating(reviews: Review[], shopId: string) {
  const shopReviews = reviews.filter((r) => r.shopId === shopId);
  if (shopReviews.length === 0) return null;
  const avg = shopReviews.reduce((sum, r) => sum + r.rating, 0) / shopReviews.length;
  return { rating: Math.round(avg * 10) / 10, count: shopReviews.length };
}

export function shopDisplayRating(reviews: Review[], shop: Shop) {
  const agg = shopAggregateRating(reviews, shop.id);
  if (agg) return agg;
  return { rating: shop.rating, count: 0 };
}
