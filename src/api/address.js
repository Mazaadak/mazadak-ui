import apiClient from "../lib/apiClient";

export const addressAPI = {
  // Get all addresses for the authenticated user
  getAddresses: async () => {
    const result = await apiClient.get('/address');
    console.log('API getAddresses result:', result);
    // If the result is an array, return it directly
    if (Array.isArray(result)) {
      return result;
    }
    // If it's wrapped in an object, extract the array
    return result || [];
  },
  
  // Add a new address
  addAddress: (address) => apiClient.post('/address', address),
  
  // Update an existing address - endpoint is /address/update/{address-id}
  updateAddress: (addressId, address) => apiClient.put(`/address/update/${addressId}`, address),
  
  // Delete an address - endpoint is /address/{address-id}
  deleteAddress: (addressId) => apiClient.delete(`/address/${addressId}`),
};
