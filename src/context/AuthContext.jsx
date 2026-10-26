import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser, setCurrentUser as persistUser, loginUser, registerUser, logoutUser } from '../services/userService';
import { users } from '../data/users';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUserState] = useState(getCurrentUser());
  const [loading, setLoading] = useState(false);

  // Switch active persona quickly for college presentation demo
  const switchRole = (role) => {
    let matchedUser;
    if (role === 'GUEST') {
      matchedUser = users.find((u) => u.role === 'GUEST'); // Arjun
    } else if (role === 'HOST') {
      matchedUser = users.find((u) => u.role === 'HOST'); // Priya
    } else if (role === 'ADMIN') {
      matchedUser = users.find((u) => u.role === 'ADMIN'); // Admin
    }
    if (matchedUser) {
      persistUser(matchedUser);
      setCurrentUserState(matchedUser);
    }
  };

  const handleLogin = async (email, password) => {
    setLoading(true);
    try {
      const user = await loginUser(email, password);
      setCurrentUserState(user);
      return user;
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (data) => {
    setLoading(true);
    try {
      const user = await registerUser(data);
      setCurrentUserState(user);
      return user;
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    // Default to Guest for easy browsing
    const guestUser = users.find((u) => u.role === 'GUEST');
    persistUser(guestUser);
    setCurrentUserState(guestUser);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        login: handleLogin,
        register: handleRegister,
        logout: handleLogout,
        switchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
