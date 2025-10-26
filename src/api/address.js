import apiClient from "../lib/apiClient";

export const addressAPI = {
  // Get all addresses for the authenticated user
  getAddresses: () => apiClient.get('/address'),
  
  // Add a new address
  addAddress: (address) => apiClient.post('/address', address),
  
  // Update an existing address
  updateAddress: (addressId, address) => apiClient.put(`/address/${addressId}`, address),
  
  // Delete an address
  deleteAddress: (addressId) => apiClient.delete(`/address/${addressId}`),
};
