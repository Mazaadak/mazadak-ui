import apiClient from "../lib/apiClient";
export const cartAPI = {
    // returns DetailedCartItemResponseDTO[]
    getCartItems: () => apiClient.get(`/carts/items/detailed`),

    // add item: body { productId: UUID, quantity: int }
    addItemToCart: (productId, quantity = 1) =>
        apiClient.post(`/carts/items`, { productId, quantity }),

    // remove item by productId
    removeItemFromCart: (productId) => apiClient.delete(`/carts/items/${productId}`),

    // update item quantity (PUT /carts/items/{productId}) body { quantity }
    updateItemQuantity: (productId, quantity) =>
        apiClient.put(`/carts/items/${productId}`, { quantity }),

    // reduce quantity (PATCH /carts/items/reduce/{productId}?quantity=)
    reduceItemQuantity: (productId, quantity = 1) =>
        apiClient.patch(`/carts/items/reduce/${productId}`, null, { params: { quantity } }),

    // clear cart (POST /carts/clear)
    clearCart: () => apiClient.post(`/carts/clear`),
};