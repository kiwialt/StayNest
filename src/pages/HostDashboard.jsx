import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getPropertiesByHost } from '../services/propertyService';
import { getBookingsByHost } from '../services/bookingService';
import {
  formatCurrency,
  formatDate,
  getPropertyStatusClass,
  getBookingStatusClass,
} from '../utils/helpers';
import './HostDashboard.css';

export default function HostDashboard() {
  const { currentUser } = useAuth();
  const [properties, setProperties] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('properties');

  useEffect(() => {
    async function loadHostData() {
      setLoading(true);
      try {
        const hostId = currentUser?.id || 2; // Default Priya Sharma
        const hostProps = await getPropertiesByHost(hostId);
        setProperties(hostProps);

        const propIds = hostProps.map((p) => p.id);
        const hostBookings = await getBookingsByHost(propIds);
        setBookings(hostBookings);
      } catch (err) {
        console.error('Error loading host data', err);
      } finally {
        setLoading(false);
      }
    }
    loadHostData();
  }, [currentUser]);

  // Derived statistics (as per Business Rule #15: derived instead of redundantly stored)
  const totalRevenue = bookings
    .filter((b) => b.status === 'CONFIRMED' || b.status === 'COMPLETED')
    .reduce((sum, b) => sum + (b.baseTotal || b.totalAmount * 0.9), 0);

  const confirmedBookingsCount = bookings.filter(
    (b) => b.status === 'CONFIRMED' || b.status === 'COMPLETED'
  ).length;

  const avgRating =
    properties.length > 0
      ? (
          properties.reduce((sum, p) => sum + (p.averageRating || 0), 0) /
          properties.filter((p) => p.averageRating > 0).length || 0
        ).toFixed(2)
      : '0.00';

  return (
    <div className="staynest-host-dashboard page-content">
      <div className="container">
        {/* Host Header */}
        <div className="host-dash-header">
          <div>
            <div className="host-badge-row">
              <span className="badge badge-info">Host Portal</span>
              <span className="text-secondary">Logged in as {currentUser?.name}</span>
            </div>
            <h1 className="host-dash-title">Host Operations & Analytics</h1>
          </div>
          <Link to="/host/properties/new" className="btn btn-primary btn-lg">
            <span>+ Add New Listing</span>
          </Link>
        </div>

        {/* Derived Statistics Grid */}
        <div className="host-stats-grid">
          <div className="stat-card card">
            <div className="stat-icon-wrapper revenue">₹</div>
            <div className="stat-content">
              <span className="stat-label">Net Host Revenue</span>
              <span className="stat-value">{formatCurrency(totalRevenue)}</span>
              <span className="stat-sub">Derived from completed stays</span>
            </div>
          </div>

          <div className="stat-card card">
            <div className="stat-icon-wrapper listings">🏡</div>
            <div className="stat-content">
              <span className="stat-label">Total Listings</span>
              <span className="stat-value">{properties.length}</span>
              <span className="stat-sub">
                {properties.filter((p) => p.status === 'ACTIVE').length} Active on platform
              </span>
            </div>
          </div>

          <div className="stat-card card">
            <div className="stat-icon-wrapper bookings">🗓️</div>
            <div className="stat-content">
              <span className="stat-label">Reservations</span>
              <span className="stat-value">{bookings.length}</span>
              <span className="stat-sub">{confirmedBookingsCount} confirmed</span>
            </div>
          </div>

          <div className="stat-card card">
            <div className="stat-icon-wrapper rating">★</div>
            <div className="stat-content">
              <span className="stat-label">Portfolio Rating</span>
              <span className="stat-value">{avgRating}</span>
              <span className="stat-sub">Across all guest reviews</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="host-tabs-bar">
          <button
            type="button"
            className={`host-tab-btn ${activeTab === 'properties' ? 'active' : ''}`}
            onClick={() => setActiveTab('properties')}
          >
            My Properties ({properties.length})
          </button>
          <button
            type="button"
            className={`host-tab-btn ${activeTab === 'bookings' ? 'active' : ''}`}
            onClick={() => setActiveTab('bookings')}
          >
            Received Bookings ({bookings.length})
          </button>
        </div>

        {/* Tab 1: Properties Table / Cards */}
        {activeTab === 'properties' && (
          <div className="host-tab-content">
            {properties.length === 0 ? (
              <div className="empty-host-box card">
                <h3>No properties listed yet</h3>
                <p>Start monetizing your home or vacation villa today.</p>
                <Link to="/host/properties/new" className="btn btn-primary">
                  Create First Listing
                </Link>
              </div>
            ) : (
              <div className="host-properties-table-card card">
                <table className="host-table">
                  <thead>
                    <tr>
                      <th>Property</th>
                      <th>Location</th>
                      <th>Type</th>
                      <th>Price / Night</th>
                      <th>Capacity</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {properties.map((p) => (
                      <tr key={p.id}>
                        <td className="prop-name-cell">
                          <img
                            src={p.images?.[0]?.url || 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=100'}
                            alt={p.name}
                            className="prop-thumb"
                          />
                          <div>
                            <div className="prop-title-text">{p.name}</div>
                            <div className="prop-rating-sub">★ {p.averageRating ? p.averageRating.toFixed(2) : 'New'}</div>
                          </div>
                        </td>
                        <td>{p.location?.city}, {p.location?.state}</td>
                        <td><span className="badge badge-neutral">{p.propertyType}</span></td>
                        <td className="font-bold">{formatCurrency(p.pricePerNight)}</td>
                        <td>{p.maxGuests} guests</td>
                        <td>
                          <span className={`badge ${getPropertyStatusClass(p.status)}`}>
                            {p.status}
                          </span>
                        </td>
                        <td>
                          <Link to={`/property/${p.id}`} className="btn btn-sm btn-outline">
                            View Live
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Bookings */}
        {activeTab === 'bookings' && (
          <div className="host-tab-content">
            {bookings.length === 0 ? (
              <div className="empty-host-box card">
                <h3>No guest reservations yet</h3>
                <p>When travelers reserve your properties, their details will display here.</p>
              </div>
            ) : (
              <div className="host-properties-table-card card">
                <table className="host-table">
                  <thead>
                    <tr>
                      <th>Booking ID</th>
                      <th>Property</th>
                      <th>Dates</th>
                      <th>Nights</th>
                      <th>Guests</th>
                      <th>Total Payout</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((b) => (
                      <tr key={b.id}>
                        <td><strong>#{b.id}</strong></td>
                        <td>{b.propertyName}</td>
                        <td>{formatDate(b.checkIn)} → {formatDate(b.checkOut)}</td>
                        <td>{b.numberOfNights}</td>
                        <td>{b.guests}</td>
                        <td className="font-bold text-teal">{formatCurrency(b.totalAmount)}</td>
                        <td>
                          <span className={`badge ${getBookingStatusClass(b.status)}`}>
                            {b.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
