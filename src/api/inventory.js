import apiClient from "../lib/apiClient";

const inventoryApi = {

  getInventoryItem: (productId) => apiClient.get(`/inventories/${productId}`),
  
  updateInventoryItem: (productId, quantity) =>
    apiClient.put(`/inventories/${productId}`, {quantity }),

  deleteInventoryItem: (productId) => apiClient.delete(`/inventories/${productId}`),
};

export default inventoryApi;