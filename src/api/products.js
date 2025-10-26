import apiClient from "../lib/apiClient";

export const productAPI = {
    getProducts: (filters = {}, pageable = {}) =>
        apiClient.get("/products", { params: { ...filters, ...pageable } }),

    getProduct: (id) => apiClient.get(`/products/${id}`),

    createProduct: (data, idempotencyKey) => apiClient.post("/products", { type: "NONE", price: 0, ...data }, { headers: { "Idempotency-Key": idempotencyKey } }),
  
    getCategories: () => apiClient.get("/categories"),

    createListing: (data, idempotencyKey) => apiClient.post("/products/listings", data, { headers: { "Idempotency-Key": idempotencyKey } }),

    getListingStatus: (id, idempotencyKey) => apiClient.get(`/products/listings/${id}/status`, { headers: { "Idempotency-Key": idempotencyKey } }),
    
}