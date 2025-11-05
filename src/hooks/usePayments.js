import { useQuery, useMutation } from "@tanstack/react-query";
import { queryKeys } from './queryKeys';
import { paymentsAPI, onboardingAPI } from "../api/payments";
import { useAuth } from "../contexts/AuthContext";

// Create payment intent
export const useCreatePaymentIntent = () => {
  return useMutation({
    mutationFn: (request) => paymentsAPI.createPaymentIntent(request),
  });
};

// Capture payment
export const useCapturePayment = () => {
  return useMutation({
    mutationFn: (orderId) => paymentsAPI.capturePayment(orderId),
  });
};

// Cancel payment
export const useCancelPayment = () => {
  return useMutation({
    mutationFn: (orderId) => paymentsAPI.cancelPayment(orderId),
  });
};

// Refund payment
export const useRefundPayment = () => {
  return useMutation({
    mutationFn: (request) => paymentsAPI.refundPayment(request),
  });
};

// Get Stripe OAuth URL
export const useGetStripeOAuthUrl = () => {
  return useMutation({
    mutationFn: (sellerId) => onboardingAPI.getOAuthUrl(sellerId),
  });
};

// Check if seller has connected Stripe account
export const useStripeAccount = (sellerId) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: queryKeys.payments.stripeAccount(sellerId),
    queryFn: () => onboardingAPI.getConnectedAccountId(sellerId),
    enabled: !!user?.token && !!sellerId,
    retry: false,
  });
};
