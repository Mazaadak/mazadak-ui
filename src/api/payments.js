import apiClient from "../lib/apiClient";

export const paymentsAPI = {
  // Create payment intent
  createPaymentIntent: (request) => {
    return apiClient.post('/api/payments/create-payment-intent', request);
  },

  // Capture payment
  capturePayment: (orderId) => {
    return apiClient.post(`/api/payments/${orderId}/capture`);
  },

  // Cancel payment
  cancelPayment: (orderId) => {
    return apiClient.post(`/api/payments/${orderId}/cancel`);
  },

  // Refund payment
  refundPayment: (request) => {
    return apiClient.post('/api/payments/refund', request);
  }
};

export const onboardingAPI = {
  // Generate Stripe OAuth URL
  getOAuthUrl: (sellerId, redirectUrl) => {
    return apiClient.post('/api/onboarding/oauth/url', { sellerId, redirectUrl });
  },

  // Get connected account ID
  getConnectedAccountId: (sellerId) => {
    return apiClient.get(`/api/onboarding/get-account/${sellerId}`);
  }
};
