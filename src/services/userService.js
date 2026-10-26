/**
 * User Service - Authentication & User Data Layer
 * Provides simulated login, registration, and quick demo role switcher for college presentations.
 */

import { users as initialUsers, mockCredentials } from '../data/users';

let usersStore = [...initialUsers];

// Session storage key for demo persistency
const SESSION_KEY = 'staynest_current_user';

/**
 * Get currently logged-in user from localStorage/session (defaults to Guest Arjun Mehta for instant UX)
 */
export function getCurrentUser() {
  try {
    const saved = localStorage.getItem(SESSION_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (err) {
    console.error('Error reading current user session', err);
  }
  // Default to Guest Arjun for immediate browsing
  return usersStore[0];
}

/**
 * Set current logged-in user
 */
export function setCurrentUser(user) {
  try {
    if (user) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
  } catch (err) {
    console.error('Error writing current user session', err);
  }
}

/**
 * Simulate Login
 * In production, this calls POST /api/auth/login
 */
export async function loginUser(email, password) {
  await new Promise((resolve) => setTimeout(resolve, 200));

  const cred = mockCredentials.find(
    (c) => c.email.toLowerCase() === email.toLowerCase() && c.password === password
  );

  if (!cred) {
    // Check if user was registered during session
    const registeredUser = usersStore.find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );
    if (registeredUser) {
      setCurrentUser(registeredUser);
      return registeredUser;
    }
    throw new Error('Invalid email or password. Use demo accounts or register a new user.');
  }

  const user = usersStore.find((u) => u.id === cred.userId);
  setCurrentUser(user);
  return user;
}

/**
 * Simulate Registration
 * In production, this calls POST /api/auth/register
 */
export async function registerUser({ name, email, phone, role = 'GUEST', password }) {
  await new Promise((resolve) => setTimeout(resolve, 200));

  const existing = usersStore.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    throw new Error('A user with this email already exists.');
  }

  const newUser = {
    id: usersStore.length + 1,
    name,
    email,
    phone,
    role,
    createdAt: new Date().toISOString().split('T')[0],
    avatar: role === 'HOST'
      ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face'
      : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face',
  };

  usersStore = [...usersStore, newUser];
  mockCredentials.push({ email, password, userId: newUser.id });
  setCurrentUser(newUser);
  return newUser;
}

/**
 * Simulate Logout
 */
export async function logoutUser() {
  await new Promise((resolve) => setTimeout(resolve, 100));
  localStorage.removeItem(SESSION_KEY);
  return true;
}

/**
 * Get all users (Admin view)
 */
export async function getAllUsersAdmin() {
  await new Promise((resolve) => setTimeout(resolve, 100));
  return [...usersStore];
}
