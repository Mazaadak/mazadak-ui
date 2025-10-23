import { createContext, useContext, useState, useEffect } from "react";
import apiClient from "../lib/apiClient";
import { getAccessToken, setAccessToken, clearAccessToken } from "../lib/apiClient";
import { useUser } from "../hooks/useUsers";
import { usersAPI } from "../api/users";
import { data } from "react-router-dom";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const decodeToken = (token) => {
  if (!token) return null;
  try {
    const payload = token.split('.')[1];
    const decodedPayload = JSON.parse(atob(payload));
    return decodedPayload;
  } catch (error) {
    console.error("Error decoding token:", error);
    return null;
  }
};

const setUserFromToken = async (token) => {
  if (!token) {
    setUser(null);
    return;
  }

  try {
    const decodedToken = decodeToken(token);
    if (decodedToken && decodedToken['user-id']) { 
      const userData = await fetchUserData(decodedToken['user-id']);
      const dataToBeStored = { userId: decodedToken['user-id'], ...userData, token: token };
      console.log("Setting user data:", dataToBeStored);
      setUser(dataToBeStored);
    } else {
      console.warn("No user ID found in token");
      setUser({ token });
    }
  } catch (error) {
    console.error("Error setting user from token:", error);
    setUser({ token });
  }
};

  const fetchUserData = async (userId) => {
    try {
      const userData = await usersAPI.getUser(userId);
      return userData;
    } catch (error) {
      console.error("Error fetching user data:", error);
      throw error;
    }
  };

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
      await setUserFromToken(data.jwtToken);
      console.log("User is authenticated");
    } catch (error) {
      console.log("No active session");
      clearAccessToken();
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    const response = await apiClient.post("/auth/login", { username, password });
    setAccessToken(response.jwtToken);
    await setUserFromToken(response.jwtToken);
    return response;
  };

  const register = async (userData) => {
    const response = await apiClient.post("/users/register", userData);
    return response;
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
    setAccessToken(response.accessToken);
    return response.accessToken;
  };

  const resetPassword = async (password) => {
    const response = await apiClient.post("/auth/reset-password", { token: getAccessToken(), password: password });
    setAccessToken(response.jwtToken);
    await setUserFromToken(response.jwtToken);
    return response;
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