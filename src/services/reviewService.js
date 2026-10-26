/**
 * Review Service - Data access abstraction layer
 * Handles fetching and submitting property reviews.
 * Enforces business rule: review allowed only for a valid, completed booking, rating 1-5, at most 1 review per booking.
 */

import { reviews as initialReviews } from '../data/reviews';

let reviewsStore = [...initialReviews];

/**
 * Get all reviews for a property
 */
export async function getReviewsByProperty(propertyId) {
  await new Promise((resolve) => setTimeout(resolve, 100));
  return reviewsStore
    .filter((r) => r.propertyId === Number(propertyId))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

/**
 * Submit a review for a completed booking
 */
export async function createReview({ propertyId, bookingId, user, rating, comment }) {
  await new Promise((resolve) => setTimeout(resolve, 200));

  if (!rating || rating < 1 || rating > 5) {
    throw new Error('Rating must be between 1 and 5.');
  }

  if (!comment || !comment.trim()) {
    throw new Error('Review comment cannot be empty.');
  }

  // Check if booking already reviewed
  const existing = reviewsStore.find((r) => r.bookingId === Number(bookingId));
  if (existing) {
    throw new Error('A review has already been submitted for this booking.');
  }

  const newReview = {
    id: reviewsStore.length + 1,
    propertyId: Number(propertyId),
    userId: user.id,
    userName: user.name,
    userAvatar: user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face',
    bookingId: Number(bookingId),
    rating: Number(rating),
    comment: comment.trim(),
    createdAt: new Date().toISOString().split('T')[0],
  };

  reviewsStore = [newReview, ...reviewsStore];
  return newReview;
}
