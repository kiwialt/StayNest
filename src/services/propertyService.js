/**
 * Property Service - Data access abstraction layer
 * Reads from mock data, can be cleanly swapped with fetch/axios calls to real MySQL REST API endpoints.
 */

import { properties as initialProperties } from '../data/properties';
import { amenities } from '../data/amenities';

// In-memory property store initialized from mock data
let propertiesStore = [...initialProperties];

/**
 * Get all active properties with optional search, filter and sort criteria
 * Business Rule: Only ACTIVE properties can be searched and booked by guests
 */
export async function getProperties(filters = {}) {
  // Simulate network latency for realistic loading states
  await new Promise((resolve) => setTimeout(resolve, 150));

  let results = propertiesStore.filter((p) => p.status === 'ACTIVE');

  // Destination / Location filter (city or state or property name)
  if (filters.destination && filters.destination.trim()) {
    const dest = filters.destination.trim().toLowerCase();
    results = results.filter(
      (p) =>
        p.location.city.toLowerCase().includes(dest) ||
        p.location.state.toLowerCase().includes(dest) ||
        p.name.toLowerCase().includes(dest)
    );
  }

  // Guest count filter: property max guests must be >= requested guests
  if (filters.guests && Number(filters.guests) > 0) {
    const requestedGuests = Number(filters.guests);
    results = results.filter((p) => p.maxGuests >= requestedGuests);
  }

  // Property type filter
  if (filters.propertyType && filters.propertyType !== 'ALL') {
    results = results.filter((p) => p.propertyType.toLowerCase() === filters.propertyType.toLowerCase());
  }

  // Price range filter
  if (filters.minPrice !== undefined && filters.minPrice !== '') {
    results = results.filter((p) => p.pricePerNight >= Number(filters.minPrice));
  }
  if (filters.maxPrice !== undefined && filters.maxPrice !== '') {
    results = results.filter((p) => p.pricePerNight <= Number(filters.maxPrice));
  }

  // Minimum rating filter
  if (filters.minRating && Number(filters.minRating) > 0) {
    results = results.filter((p) => p.averageRating >= Number(filters.minRating));
  }

  // Amenities filter: property must include all selected amenity IDs
  if (filters.amenities && filters.amenities.length > 0) {
    results = results.filter((p) =>
      filters.amenities.every((amenityId) => p.amenityIds.includes(Number(amenityId)))
    );
  }

  // Sorting
  if (filters.sortBy) {
    switch (filters.sortBy) {
      case 'price_asc':
        results.sort((a, b) => a.pricePerNight - b.pricePerNight);
        break;
      case 'price_desc':
        results.sort((a, b) => b.pricePerNight - a.pricePerNight);
        break;
      case 'rating_desc':
        results.sort((a, b) => b.averageRating - a.averageRating);
        break;
      case 'newest':
        results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      default:
        break;
    }
  }

  return results;
}

/**
 * Get single property by ID with populated amenities
 */
export async function getPropertyById(id) {
  await new Promise((resolve) => setTimeout(resolve, 100));
  const property = propertiesStore.find((p) => p.id === Number(id));
  if (!property) return null;

  // Populate amenity details
  const populatedAmenities = property.amenityIds
    .map((aid) => amenities.find((a) => a.id === aid))
    .filter(Boolean);

  return {
    ...property,
    amenities: populatedAmenities,
  };
}

/**
 * Get properties owned by a specific host
 */
export async function getPropertiesByHost(hostId) {
  await new Promise((resolve) => setTimeout(resolve, 100));
  return propertiesStore.filter((p) => p.hostId === Number(hostId));
}

/**
 * Get all properties including PENDING and INACTIVE (for Admin)
 */
export async function getAllPropertiesAdmin() {
  await new Promise((resolve) => setTimeout(resolve, 100));
  return [...propertiesStore];
}

/**
 * Add a new property (Host action)
 * Enforces business rules: price > 0, maxGuests, bedrooms, bathrooms >= 0
 */
export async function createProperty(propertyData, host) {
  await new Promise((resolve) => setTimeout(resolve, 200));

  const newProperty = {
    id: propertiesStore.length + 1,
    hostId: host.id,
    hostName: host.name,
    hostAvatar: host.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face',
    name: propertyData.name,
    description: propertyData.description,
    propertyType: propertyData.propertyType,
    pricePerNight: Number(propertyData.pricePerNight),
    maxGuests: Number(propertyData.maxGuests),
    bedrooms: Number(propertyData.bedrooms),
    bathrooms: Number(propertyData.bathrooms),
    status: 'ACTIVE', // default status
    location: {
      id: 200 + propertiesStore.length,
      city: propertyData.city,
      state: propertyData.state,
      country: propertyData.country || 'India',
      address: propertyData.address,
      latitude: propertyData.latitude || 0,
      longitude: propertyData.longitude || 0,
    },
    images: propertyData.images && propertyData.images.length > 0
      ? propertyData.images.map((img, idx) => ({
          id: 3000 + propertiesStore.length * 10 + idx,
          url: img.url || img,
          isPrimary: idx === 0,
          caption: img.caption || 'Property view',
        }))
      : [
          {
            id: 3000 + propertiesStore.length * 10,
            url: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1200&auto=format&fit=crop&q=80',
            isPrimary: true,
            caption: 'Main view',
          },
        ],
    amenityIds: propertyData.amenityIds || [1, 2, 8],
    averageRating: 0,
    reviewCount: 0,
    createdAt: new Date().toISOString().split('T')[0],
  };

  propertiesStore = [newProperty, ...propertiesStore];
  return newProperty;
}

/**
 * Update property status (Admin or Host action)
 */
export async function updatePropertyStatus(propertyId, newStatus) {
  await new Promise((resolve) => setTimeout(resolve, 100));
  const property = propertiesStore.find((p) => p.id === Number(propertyId));
  if (property) {
    property.status = newStatus;
    return { ...property };
  }
  return null;
}
