import apiClient from "../lib/apiClient";

export const ordersAPI = {
  // Get order by ID
  getOrderById: (orderId) => apiClient.get(`/orders/${orderId}`),

  // Get orders with filters
  getOrders: (filters = {}, page = 0, size = 10, sort = 'createdAt,ASC') => {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        if (Array.isArray(value)) {
          value.forEach(v => params.append(key, v));
        } else {
          params.append(key, value);
        }
      }
    });
    
    params.append('page', page);
    params.append('size', size);
    params.append('sort', sort);
    
    return apiClient.get(`/orders?${params.toString()}`);
  },

  // Checkout (Fixed Price)
  checkout: (checkoutRequest, idempotencyKey) => {
    return apiClient.post('/orders/checkout', checkoutRequest, {
      headers: {
        'Idempotency-Key': idempotencyKey
      }
    });
  },

  // Provide address for auction checkout
  provideAddress: (orderId, address) => {
    return apiClient.post(`/orders/checkout/${orderId}/address`, address);
  },

  // Cancel checkout
  cancelCheckout: (orderId) => {
    return apiClient.post(`/orders/checkout/${orderId}/cancel`);
  },

  // Get checkout status (polling)
  getCheckoutStatus: (orderId) => {
    return apiClient.get(`/orders/checkout/${orderId}/status`);
  }
};
