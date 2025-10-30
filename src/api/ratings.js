import apiClient from "../lib/apiClient";

export const ratingsAPI = {
  // Get ratings for a product (paginated)
  getProductRatings: (productId, page = 0, size = 10) => 
    apiClient.get(`/products/${productId}/ratings`, {
      params: { page, size, sortField: 'ratingId', direction: 'desc' }
    }),
  
  // Create a rating
  createRating: (productId, data, idempotencyKey) =>
  apiClient.post(
    `/products/${productId}/ratings`, data, { headers: { 'Idempotency-Key': idempotencyKey } }
  ),

  // Update a rating
  updateRating: (ratingId, data) => 
    apiClient.put(`/products/ratings/${ratingId}`, data ),
  
  // Delete a rating
  deleteRating: (ratingId) => 
    apiClient.delete(`/products/ratings/${ratingId}`),
  
  // Get single rating
  getRating: (ratingId) => 
    apiClient.get(`/products/ratings/${ratingId}`),
  
  // Get ratings by user
  getUserRatings: (userId, page = 0, size = 10) => 
    apiClient.get(`/products/ratings/user/${userId}`, {
      params: { page, size }
    }),
};