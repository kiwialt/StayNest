/**
 * Booking Service - Data access abstraction layer
 * Handles simulated reservation creation, cancellation, payment simulation, and booking queries.
 */

import { bookings as initialBookings } from '../data/bookings';
import { calculateNights, calculateBookingTotal } from '../utils/helpers';

let bookingsStore = [...initialBookings];

/**
 * Get all bookings for a guest
 */
export async function getBookingsByUser(userId) {
  await new Promise((resolve) => setTimeout(resolve, 150));
  return bookingsStore
    .filter((b) => b.userId === Number(userId))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

/**
 * Get all bookings for properties owned by a host
 */
export async function getBookingsByHost(hostPropertyIds = []) {
  await new Promise((resolve) => setTimeout(resolve, 150));
  return bookingsStore
    .filter((b) => hostPropertyIds.includes(b.propertyId))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

/**
 * Get all bookings (for Admin)
 */
export async function getAllBookingsAdmin() {
  await new Promise((resolve) => setTimeout(resolve, 150));
  return [...bookingsStore].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

/**
 * Create a new booking with simulated payment
 * Enforces business rules:
 * 1. check-out > check-in
 * 2. guests <= property max guests
 * 3. Total amount = nights * price per night + service fee
 * 4. Payment status SUCCESS confirms booking
 */
export async function createBooking({
  user,
  property,
  checkIn,
  checkOut,
  guests,
  paymentMethod = 'UPI',
}) {
  await new Promise((resolve) => setTimeout(resolve, 300));

  const nights = calculateNights(checkIn, checkOut);
  if (nights <= 0) {
    throw new Error('Check-out date must be later than check-in date.');
  }

  if (Number(guests) > property.maxGuests) {
    throw new Error(`Guest count cannot exceed property maximum of ${property.maxGuests}.`);
  }

  const { total, baseTotal, serviceFee } = calculateBookingTotal(property.pricePerNight, nights);

  // Generate simulated transaction
  const txnId = 'TXN_' + paymentMethod + '_' + Math.floor(1000000000 + Math.random() * 9000000000);

  const newBooking = {
    id: 100 + bookingsStore.length + 1,
    userId: user.id,
    userName: user.name,
    propertyId: property.id,
    propertyName: property.name,
    propertyImage: property.images?.[0]?.url || 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=400',
    city: property.location?.city || 'Goa',
    checkIn,
    checkOut,
    guests: Number(guests),
    numberOfNights: nights,
    pricePerNight: property.pricePerNight,
    baseTotal,
    serviceFee,
    totalAmount: total,
    status: 'CONFIRMED', // Confirmed upon successful simulated payment
    createdAt: new Date().toISOString().split('T')[0],
    payment: {
      id: 300 + bookingsStore.length + 1,
      amount: total,
      paymentMethod,
      status: 'SUCCESS',
      transactionId: txnId,
      paymentDate: new Date().toLocaleString('en-IN'),
    },
    hasReview: false,
  };

  bookingsStore = [newBooking, ...bookingsStore];
  return newBooking;
}

/**
 * Cancel a booking
 * Rule: Cancelling a booking makes its dates available again.
 */
export async function cancelBooking(bookingId) {
  await new Promise((resolve) => setTimeout(resolve, 150));
  const booking = bookingsStore.find((b) => b.id === Number(bookingId));
  if (!booking) {
    throw new Error('Booking not found');
  }

  if (booking.status === 'COMPLETED') {
    throw new Error('Completed bookings cannot be cancelled.');
  }

  booking.status = 'CANCELLED';
  if (booking.payment) {
    booking.payment.status = 'FAILED';
  }

  return { ...booking };
}
