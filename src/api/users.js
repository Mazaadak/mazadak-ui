import apiClient from "../lib/apiClient";

export const usersAPI = {
  getUser: (id) => apiClient.get(`/users/${id}`),
  
}