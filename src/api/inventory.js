import apiClient from "../lib/apiClient";

const inventoryApi = {

  getInventoryItem: (productId) => apiClient.get(`/inventories/${productId}`),
  updateInventoryItem: (productId, data) => apiClient.put(`/inventories/${productId}`, data),
  deleteInventoryItem: (productId) => apiClient.delete(`/inventories/${productId}`),
};

export default inventoryApi;