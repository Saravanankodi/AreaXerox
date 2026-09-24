import {
    collection,
    doc,
    setDoc,
    updateDoc,
    onSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Review } from "@/types";

const REVIEWS_COLLECTION = "reviews";

/**
 * Persists a customer review to Firestore.
 */
export async function createReviewInDb(review: Review): Promise<void> {
    await setDoc(doc(db, REVIEWS_COLLECTION, review.id), review);
}

/**
 * Persists a shopkeeper's public reply to a review.
 */
export async function updateReviewReplyInDb(reviewId: string, reply: string): Promise<void> {
    await updateDoc(doc(db, REVIEWS_COLLECTION, reviewId), {
        reply,
        updatedAt: new Date().toISOString(),
    });
}

/**
 * Subscribes to real-time updates for all reviews.
 */
export function listenToReviews(
    onUpdate: (reviews: Review[]) => void,
    onError?: (error: unknown) => void
): () => void {
    return onSnapshot(
        collection(db, REVIEWS_COLLECTION),
        (snapshot) => {
            const reviews = snapshot.docs.map((doc) => doc.data() as Review);
            reviews.sort(
                (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
            onUpdate(reviews);
        },
        (error) => {
            console.warn("Warning in listenToReviews:", error);
            onError?.(error);
        }
    );
}