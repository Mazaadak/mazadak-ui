import apiClient from "../lib/apiClient";

export const productAPI = {
    getProducts: (filters = {}, pageable = {}) =>
        apiClient.get("/products", { params: { ...filters, ...pageable } }),

    getProduct: (id) => apiClient.get(`/products/${id}`),

    createProduct: (data) => apiClient.post("/products", { type: "AUCTION", price: 0, ...data }), // TODO: make it none
  
    getCategories: () => apiClient.get("/categories"),
}