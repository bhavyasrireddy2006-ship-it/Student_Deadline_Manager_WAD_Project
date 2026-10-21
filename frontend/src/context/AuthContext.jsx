import { useState, useEffect } from "react";
import API from "../services/api";
import { AuthContext } from "./AuthContextInstance";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem("token") || null);
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem("token")));

  // Verify session on initial load if token exists
  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    if (!savedToken) {
      return;
    }

    let active = true;

    API.get("/auth/me")
      .then((response) => {
        if (active && response.data && response.data.user) {
          setUser(response.data.user);
          localStorage.setItem("user", JSON.stringify(response.data.user));
        }
      })
      .catch((err) => {
        console.error("Session verification error:", err.message);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        if (active) {
          setUser(null);
          setToken(null);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const login = async (email, password) => {
    const response = await API.post("/auth/login", { email, password });
    const { token: receivedToken, user: receivedUser } = response.data;

    localStorage.setItem("token", receivedToken);
    localStorage.setItem("user", JSON.stringify(receivedUser));

    setToken(receivedToken);
    setUser(receivedUser);

    return response.data;
  };

  const register = async (name, email, password) => {
    const response = await API.post("/auth/register", { name, email, password });
    if (response.data.token && response.data.user) {
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
      setToken(response.data.token);
      setUser(response.data.user);
    }
    return response.data;
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token && !!user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
