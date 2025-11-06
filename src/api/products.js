import apiClient from "../lib/apiClient";

export const productAPI = {
    getProducts: (filters = {}, pageable = {}) =>
        apiClient.get("/products", { params: { ...filters, ...pageable } }),

    getProduct: (id) => apiClient.get(`/products/${id}`),

    createProduct: (data, idempotencyKey) => {
        const formData = new FormData();
        
        // Create the product data as a JSON blob
        const productData = {
            title: data.title,
            description: data.description,
            price: data.price || 0,
            type: data.type || 'NONE',
            categoryId: data.categoryId
        };
        
        // Append as a Blob with application/json content type
        const productBlob = new Blob([JSON.stringify(productData)], {
            type: 'application/json'
        });
        formData.append('createRequest', productBlob);
        
        // Append images if they exist
        if (data.images && data.images.length > 0) {
            data.images.forEach((image) => {
                formData.append('images', image);
            });
        }
        
        return apiClient.post("/products", formData, {
            headers: {
                "Idempotency-Key": idempotencyKey,
                "Content-Type": undefined, // Let browser set multipart/form-data with boundary
            }
        });
    },
    
    updateProduct: (id, data) => apiClient.put(`/products/${id}`, data),
    
    deleteProduct: (id) => apiClient.delete(`/products/${id}`),

    getCategories: () => apiClient.get("/categories"),

    createListing: (data, idempotencyKey) => apiClient.post("/products/listings", data, { headers: { "Idempotency-Key": idempotencyKey } }),

    getListingStatus: (id, idempotencyKey) => apiClient.get(`/products/listings/${id}/status`, { headers: { "Idempotency-Key": idempotencyKey } }),
    
    // Ratings
    getProductRatings: (productId, page = 0, size = 10) => 
        apiClient.get(`/products/${productId}/ratings`, {
            params: { page, size, sortField: 'ratingId', direction: 'desc' }
        }),
    
    createRating: (productId, data, idempotencyKey) =>
        apiClient.post(`/products/${productId}/ratings`, data, { 
            headers: { 'Idempotency-Key': idempotencyKey } 
        }),

    updateRating: (ratingId, data) => 
        apiClient.put(`/products/ratings/${ratingId}`, data),
    
    deleteRating: (ratingId) => 
        apiClient.delete(`/products/ratings/${ratingId}`),
}