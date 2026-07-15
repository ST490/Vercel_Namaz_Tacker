import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

const USERS_KEY = 'namaz_users';
const SESSION_KEY = 'namaz_session';

// Simple hash (non-cryptographic, good enough for local-only storage)
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (Math.imul(31, hash) + str.charCodeAt(i)) | 0;
  }
  return hash.toString(36);
}

function loadUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    // Restore session on mount
    try {
      const session = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
      if (session && session.username) {
        setUser(session);
        setIsAuthenticated(true);
      }
    } catch {
      // ignore
    }
    setIsLoadingAuth(false);
  }, []);

  /**
   * Register a new account. Returns { ok, error }.
   */
  const register = (username, password) => {
    const trimmed = username.trim().toLowerCase();
    if (!trimmed || trimmed.length < 2) return { ok: false, error: 'Username must be at least 2 characters.' };
    if (password.length < 4) return { ok: false, error: 'Password must be at least 4 characters.' };

    const users = loadUsers();
    if (users[trimmed]) return { ok: false, error: 'Username already taken.' };

    users[trimmed] = { username: trimmed, passwordHash: simpleHash(password) };
    saveUsers(users);
    return { ok: true };
  };

  /**
   * Login with username + password. Returns { ok, error }.
   */
  const login = (username, password) => {
    const trimmed = username.trim().toLowerCase();
    const users = loadUsers();
    const account = users[trimmed];

    if (!account) return { ok: false, error: 'No account found with that username.' };
    if (account.passwordHash !== simpleHash(password)) return { ok: false, error: 'Incorrect password.' };

    const session = { username: trimmed, isGuest: false };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    setUser(session);
    setIsAuthenticated(true);
    setAuthError(null);
    return { ok: true };
  };

  /**
   * Continue as guest — creates a temporary session, data stored under 'guest' key.
   */
  const loginAsGuest = () => {
    const session = { username: 'guest', isGuest: true };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    setUser(session);
    setIsAuthenticated(true);
    setAuthError(null);
  };

  const logout = () => {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      authError,
      login,
      register,
      loginAsGuest,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
