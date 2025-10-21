import { createContext, useContext, useState, useEffect } from "react";
import apiClient from "../lib/apiClient";
import { getAccessToken, setAccessToken, clearAccessToken } from "../lib/apiClient";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // check if user is already logged in on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // Use fetch directly to avoid interceptor interference
      const response = await fetch("http://localhost:18090/auth/refresh", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("No active session");
      }

      const data = await response.json();
      setAccessToken(data.jwtToken);
      setUser({ token: data.jwtToken });
    } catch (error) {
      console.log("No active session");
      clearAccessToken();
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    const response = await apiClient.post("/auth/login", { username, password });
    setAccessToken(response.data.jwtToken);
    setUser({ token: response.data.jwtToken });
    return response.data;
  };

  const register = async (userData) => {
    const response = await apiClient.post("/users/register", userData);
    return response.data;
  };

  const logout = async () => {
    try {
      await fetch("http://localhost:18090/auth/logout", {
        method: "POST",
        credentials: "include", 
        headers: {
          "Content-Type": "application/json",
        },
        // TODO: fix double refresh issue
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      clearAccessToken();
      setUser(null);
    }
  };

  const forgotPassword = async (email) => {
    await apiClient.post("/auth/forget-password", { email });
  };

  const verifyOtp = async (email, otp) => {
    const response = await apiClient.post("/auth/verify-otp", { email, otp });
    setAccessToken(response.data.accessToken);
    return response.data.accessToken;
  };

  const resetPassword = async (password) => {
    const response = await apiClient.post("/auth/reset-password", { token: getAccessToken(), password: password });
    setAccessToken(response.data.jwtToken);
    setUser({ token: response.data.jwtToken }); // TODO: set real user data
    return response.data;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        forgotPassword,
        verifyOtp,
        resetPassword,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};