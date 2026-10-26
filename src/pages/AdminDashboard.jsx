import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAllPropertiesAdmin, updatePropertyStatus } from '../services/propertyService';
import { getAllBookingsAdmin } from '../services/bookingService';
import { getAllUsersAdmin } from '../services/userService';
import {
  formatCurrency,
  formatDate,
  getPropertyStatusClass,
  getBookingStatusClass,
  getPaymentStatusClass,
} from '../utils/helpers';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [properties, setProperties] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adminTab, setAdminTab] = useState('overview');

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [u, p, b] = await Promise.all([
        getAllUsersAdmin(),
        getAllPropertiesAdmin(),
        getAllBookingsAdmin(),
      ]);
      setUsers(u);
      setProperties(p);
      setBookings(b);
    } catch (err) {
      console.error('Error fetching admin data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleToggleStatus = async (propId, currentStatus) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await updatePropertyStatus(propId, nextStatus);
      await loadAdminData();
    } catch (err) {
      alert('Failed to update property status');
    }
  };

  // Derived statistics (as per Business Rule #15)
  const grossVolume = bookings
    .filter((b) => b.payment?.status === 'SUCCESS')
    .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

  const platformFees = Math.round(grossVolume * 0.1);

  return (
    <div className="staynest-admin-dashboard page-content">
      <div className="container">
        {/* Admin Header */}
        <div className="admin-header">
          <div>
            <div className="admin-pill-tag">
              <span className="badge badge-error">Administrator Access</span>
              <span className="text-secondary">Logged in as {currentUser?.name}</span>
            </div>
            <h1 className="admin-title">Platform Governance & Database Control</h1>
            <p className="admin-subtitle">
              System administration interface for USERS, PROPERTY, BOOKING, and PAYMENT entities.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={loadAdminData}
          >
            ↻ Refresh DB Data
          </button>
        </div>

        {/* Global Statistics Cards */}
        <div className="admin-stats-grid">
          <div className="stat-card card">
            <div className="stat-icon-wrapper gross-vol">₹</div>
            <div className="stat-content">
              <span className="stat-label">Gross Transaction Volume</span>
              <span className="stat-value">{formatCurrency(grossVolume)}</span>
              <span className="stat-sub">Platform commission: {formatCurrency(platformFees)}</span>
            </div>
          </div>

          <div className="stat-card card">
            <div className="stat-icon-wrapper users">👥</div>
            <div className="stat-content">
              <span className="stat-label">Registered Users</span>
              <span className="stat-value">{users.length}</span>
              <span className="stat-sub">
                {users.filter((u) => u.role === 'HOST').length} Hosts, {users.filter((u) => u.role === 'GUEST').length} Guests
              </span>
            </div>
          </div>

          <div className="stat-card card">
            <div className="stat-icon-wrapper properties">🏢</div>
            <div className="stat-content">
              <span className="stat-label">Managed Properties</span>
              <span className="stat-value">{properties.length}</span>
              <span className="stat-sub">
                {properties.filter((p) => p.status === 'ACTIVE').length} Active, {properties.filter((p) => p.status === 'PENDING').length} Pending review
              </span>
            </div>
          </div>

          <div className="stat-card card">
            <div className="stat-icon-wrapper bookings">📑</div>
            <div className="stat-content">
              <span className="stat-label">Total Bookings</span>
              <span className="stat-value">{bookings.length}</span>
              <span className="stat-sub">
                {bookings.filter((b) => b.status === 'CONFIRMED' || b.status === 'COMPLETED').length} Successful
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="admin-tabs-bar">
          <button
            type="button"
            className={`admin-tab-btn ${adminTab === 'overview' ? 'active' : ''}`}
            onClick={() => setAdminTab('overview')}
          >
            Properties Governance ({properties.length})
          </button>
          <button
            type="button"
            className={`admin-tab-btn ${adminTab === 'users' ? 'active' : ''}`}
            onClick={() => setAdminTab('users')}
          >
            Users Registry ({users.length})
          </button>
          <button
            type="button"
            className={`admin-tab-btn ${adminTab === 'bookings' ? 'active' : ''}`}
            onClick={() => setAdminTab('bookings')}
          >
            Bookings & Payments ({bookings.length})
          </button>
        </div>

        {/* Tab 1: Properties Governance */}
        {adminTab === 'overview' && (
          <div className="admin-tab-panel">
            <div className="admin-table-card card">
              <div className="table-header-desc">
                <h3>PROPERTY Entity Table</h3>
                <p>Admins can toggle property visibility (ACTIVE / INACTIVE) as per Business Rule #14.</p>
              </div>
              <div className="table-responsive-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Property Name</th>
                      <th>Host</th>
                      <th>Location</th>
                      <th>Type</th>
                      <th>Price</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {properties.map((p) => (
                      <tr key={p.id}>
                        <td><strong>#{p.id}</strong></td>
                        <td className="prop-name-text">{p.name}</td>
                        <td>{p.hostName}</td>
                        <td>{p.location?.city}, {p.location?.state}</td>
                        <td><span className="badge badge-neutral">{p.propertyType}</span></td>
                        <td className="font-bold">{formatCurrency(p.pricePerNight)}</td>
                        <td>
                          <span className={`badge ${getPropertyStatusClass(p.status)}`}>
                            {p.status}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className={`btn btn-sm ${p.status === 'ACTIVE' ? 'btn-outline' : 'btn-primary'}`}
                            onClick={() => handleToggleStatus(p.id, p.status)}
                          >
                            {p.status === 'ACTIVE' ? 'Deactivate' : 'Approve & Activate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Users Registry */}
        {adminTab === 'users' && (
          <div className="admin-tab-panel">
            <div className="admin-table-card card">
              <div className="table-header-desc">
                <h3>USERS Entity Registry</h3>
                <p>Single USERS table distinguished by Role column (GUEST, HOST, ADMIN).</p>
              </div>
              <div className="table-responsive-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>User ID</th>
                      <th>Full Name</th>
                      <th>Email (Unique)</th>
                      <th>Phone</th>
                      <th>Role</th>
                      <th>Registered</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id}>
                        <td><strong>#{u.id}</strong></td>
                        <td className="user-name-cell">
                          {u.avatar ? (
                            <img src={u.avatar} alt={u.name} className="user-thumb" />
                          ) : (
                            <div className="user-thumb placeholder">{u.name[0]}</div>
                          )}
                          <span>{u.name}</span>
                        </td>
                        <td className="email-cell">{u.email}</td>
                        <td>{u.phone}</td>
                        <td>
                          <span
                            className={`badge ${
                              u.role === 'ADMIN'
                                ? 'badge-error'
                                : u.role === 'HOST'
                                ? 'badge-warning'
                                : 'badge-info'
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td>{u.createdAt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Bookings & Payments */}
        {adminTab === 'bookings' && (
          <div className="admin-tab-panel">
            <div className="admin-table-card card">
              <div className="table-header-desc">
                <h3>BOOKING & PAYMENT Relational Joined View</h3>
                <p>Atomic booking records with linked payment transaction IDs and methods.</p>
              </div>
              <div className="table-responsive-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Booking ID</th>
                      <th>Property</th>
                      <th>Dates</th>
                      <th>Amount</th>
                      <th>Booking Status</th>
                      <th>Payment Method</th>
                      <th>Txn ID</th>
                      <th>Payment Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((b) => (
                      <tr key={b.id}>
                        <td><strong>#{b.id}</strong></td>
                        <td className="prop-name-text">{b.propertyName}</td>
                        <td>{b.checkIn} → {b.checkOut}</td>
                        <td className="font-bold text-teal">{formatCurrency(b.totalAmount)}</td>
                        <td>
                          <span className={`badge ${getBookingStatusClass(b.status)}`}>
                            {b.status}
                          </span>
                        </td>
                        <td>{b.payment?.paymentMethod || 'N/A'}</td>
                        <td className="text-mono">{b.payment?.transactionId || '—'}</td>
                        <td>
                          <span className={`badge ${getPaymentStatusClass(b.payment?.status)}`}>
                            {b.payment?.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
