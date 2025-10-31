import axios from "axios";

const API_BASE_URL = "http://localhost:18090";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Store access token in sessionStorage to survive page reloads
export const setAccessToken = (token) => {
  if (token) {
    sessionStorage.setItem('accessToken', token);
  } else {
    sessionStorage.removeItem('accessToken');
  }
};

export const getAccessToken = () => {
  return sessionStorage.getItem('accessToken');
};

export const clearAccessToken = () => {
  sessionStorage.removeItem('accessToken');
};

// attach access token interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// response interceptor to handle 401 errors and token refresh
apiClient.interceptors.response.use(
  (response) => {
    // Handle empty responses or non-JSON responses
    if (response.data === '' || response.data === null || response.data === undefined) {
      console.warn('Empty response received:', response);
      return null;
    }
    return response.data;
  },
  async (error) => {    
    const originalRequest = error.config;

    // if 401 and we haven't tried refreshing yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // try to refresh token
        const refreshResponse = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true } // send httpOnly cookie
        );

        const newAccessToken = refreshResponse.data.jwtToken;
        setAccessToken(newAccessToken);

        // retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // refresh failed - user needs to login again
        clearAccessToken();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;

