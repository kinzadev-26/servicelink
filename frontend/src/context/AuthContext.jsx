import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { getMe, loginUser, registerUser } from '../services/authService.js';
import { getToken, saveToken, setUnauthorizedHandler } from '../services/api.js';

export const AuthContext = createContext(null);

// Holds "who is logged in" for the whole app. Components read it with the useAuth() hook.
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(getToken())); // true while we check a saved token
  const [sessionExpired, setSessionExpired] = useState(false);

  const logout = useCallback(() => {
    saveToken(null);
    setUser(null);
  }, []);

  // Page refresh: if a token is saved, ask the server who it belongs to.
  useEffect(() => {
    if (!getToken()) return;
    getMe()
      .then((body) => setUser(body.data.user))
      .catch(() => saveToken(null))
      .finally(() => setLoading(false));
  }, []);

  // Any 401 from the API logs the user out and shows a "session expired" notice on the login page.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      if (getToken()) setSessionExpired(true);
      logout();
    });
  }, [logout]);

  const finishAuth = (body) => {
    saveToken(body.data.token);
    setUser(body.data.user);
    setSessionExpired(false);
    return body;
  };
  const login = useCallback(async (values) => finishAuth(await loginUser(values)), []);
  const register = useCallback(async (values) => finishAuth(await registerUser(values)), []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout, sessionExpired, isAuthenticated: Boolean(user) }),
    [user, loading, login, register, logout, sessionExpired]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
