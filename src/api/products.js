import apiClient from "../lib/apiClient";

export const productAPI = {
    getProducts: (filters = {}, pageable = {}) =>
        apiClient.get("/products", { params: { ...filters, ...pageable } }),

    getProduct: (id) => apiClient.get(`/products/${id}`),

    createProduct: (data) => apiClient.post("/products", { type: "NONE", price: 0, ...data }),
  
    getCategories: () => apiClient.get("/categories"),

    createListing: (data) => apiClient.post("/products/listings", data),

    getListingStatus: (id) => apiClient.get(`/products/listings/${id}/status`),
    
}