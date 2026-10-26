import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createBooking } from '../services/bookingService';
import {
  formatCurrency,
  calculateNights,
  calculateBookingTotal,
  getToday,
  getTomorrow,
} from '../utils/helpers';
import './BookingCard.css';

export default function BookingCard({ property }) {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [checkIn, setCheckIn] = useState(getToday());
  const [checkOut, setCheckOut] = useState(getTomorrow());
  const [guests, setGuests] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('UPI');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successModalData, setSuccessModalData] = useState(null);

  const nights = calculateNights(checkIn, checkOut);
  const { total, baseTotal, serviceFee } = calculateBookingTotal(property.pricePerNight, nights);

  const handleBooking = async (e) => {
    e.preventDefault();
    setError('');

    if (nights <= 0) {
      setError('Check-out date must be later than check-in date.');
      return;
    }

    if (guests > property.maxGuests) {
      setError(`Maximum guests allowed for this stay is ${property.maxGuests}.`);
      return;
    }

    setLoading(true);
    try {
      const newBooking = await createBooking({
        user: currentUser,
        property,
        checkIn,
        checkOut,
        guests,
        paymentMethod,
      });

      setSuccessModalData(newBooking);
    } catch (err) {
      setError(err.message || 'Failed to complete booking.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="staynest-booking-card card">
      {/* Price Header */}
      <div className="booking-card-header">
        <div className="booking-price-display">
          <span className="price-val">{formatCurrency(property.pricePerNight)}</span>
          <span className="price-unit"> / night</span>
        </div>
        <div className="booking-rating-display">
          <span className="star-icon">★</span>
          <span className="rating-score">
            {property.averageRating > 0 ? property.averageRating.toFixed(2) : 'New'}
          </span>
          {property.reviewCount > 0 && (
            <span className="review-count">({property.reviewCount})</span>
          )}
        </div>
      </div>

      {/* Date & Guest Form */}
      <form onSubmit={handleBooking} className="booking-form-box">
        <div className="booking-inputs-grid">
          <div className="booking-input-cell">
            <label className="cell-label">Check-in</label>
            <input
              type="date"
              className="cell-input"
              value={checkIn}
              min={getToday()}
              onChange={(e) => {
                setCheckIn(e.target.value);
                if (checkOut && e.target.value >= checkOut) {
                  setCheckOut('');
                }
              }}
              required
            />
          </div>

          <div className="booking-input-cell">
            <label className="cell-label">Check-out</label>
            <input
              type="date"
              className="cell-input"
              value={checkOut}
              min={checkIn || getTomorrow()}
              onChange={(e) => setCheckOut(e.target.value)}
              required
            />
          </div>

          <div className="booking-input-cell full-width">
            <label className="cell-label">Guests (Max: {property.maxGuests})</label>
            <select
              className="cell-select"
              value={guests}
              onChange={(e) => setGuests(Number(e.target.value))}
            >
              {Array.from({ length: property.maxGuests }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n} {n === 1 ? 'Guest' : 'Guests'}
                </option>
              ))}
            </select>
          </div>

          <div className="booking-input-cell full-width">
            <label className="cell-label">Simulated Payment Method</label>
            <select
              className="cell-select"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
              <option value="CARD">Debit / Credit Card</option>
              <option value="NET_BANKING">Net Banking (HDFC / SBI / ICICI)</option>
            </select>
          </div>
        </div>

        {error && <div className="booking-error-banner">{error}</div>}

        {/* Submit Reserve Button */}
        <button
          type="submit"
          className="btn btn-primary btn-full btn-lg reserve-btn"
          disabled={loading || nights <= 0}
        >
          {loading ? 'Processing Reservation...' : 'Reserve (Simulated)'}
        </button>

        <p className="no-charge-notice">
          ✨ You won't be charged real money. This simulates an atomic MySQL transaction.
        </p>

        {/* Price Breakdown */}
        {nights > 0 && (
          <div className="price-breakdown-section">
            <div className="breakdown-row">
              <span>{formatCurrency(property.pricePerNight)} × {nights} {nights === 1 ? 'night' : 'nights'}</span>
              <span>{formatCurrency(baseTotal)}</span>
            </div>
            <div className="breakdown-row">
              <span>StayNest service fee (10%)</span>
              <span>{formatCurrency(serviceFee)}</span>
            </div>
            <div className="breakdown-divider"></div>
            <div className="breakdown-row total-row">
              <span>Total before taxes</span>
              <span className="total-val">{formatCurrency(total)}</span>
            </div>
          </div>
        )}
      </form>

      {/* Confirmation Modal */}
      {successModalData && (
        <div className="booking-success-modal-overlay">
          <div className="booking-success-card">
            <div className="success-icon-badge">✓</div>
            <h3 className="success-title">Reservation Confirmed!</h3>
            <p className="success-subtitle">
              Your simulated booking has been recorded with transaction status <strong>SUCCESS</strong>.
            </p>

            <div className="success-summary-box">
              <div className="summary-item">
                <span className="s-label">Booking ID:</span>
                <span className="s-val">#{successModalData.id}</span>
              </div>
              <div className="summary-item">
                <span className="s-label">Dates:</span>
                <span className="s-val">{successModalData.checkIn} to {successModalData.checkOut} ({successModalData.numberOfNights} nights)</span>
              </div>
              <div className="summary-item">
                <span className="s-label">Guests:</span>
                <span className="s-val">{successModalData.guests}</span>
              </div>
              <div className="summary-item">
                <span className="s-label">Amount Paid:</span>
                <span className="s-val font-bold text-teal">{formatCurrency(successModalData.totalAmount)}</span>
              </div>
              <div className="summary-item">
                <span className="s-label">Txn Reference:</span>
                <span className="s-val text-mono">{successModalData.payment.transactionId}</span>
              </div>
            </div>

            <div className="modal-actions-row">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSuccessModalData(null)}
              >
                Close
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setSuccessModalData(null);
                  navigate('/my-bookings');
                }}
              >
                View My Bookings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
