import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from './queryKeys';
import { ordersAPI } from "../api/orders";
import { useAuth } from "../contexts/AuthContext";

// Fetch order by ID
export const useOrder = (orderId, options = {}) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: queryKeys.orders.order(orderId),
    queryFn: () => ordersAPI.getOrderById(orderId),
    enabled: !!user?.token && !!orderId,
    ...options
  });
};

// Fetch orders with filters
export const useOrders = (filters = {}, page = 0, size = 10, sort = 'createdAt,ASC') => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: queryKeys.orders.list(filters, page, size, sort),
    queryFn: () => ordersAPI.getOrders(filters, page, size, sort),
    enabled: !!user?.token,
  });
};

// Checkout mutation
export const useCheckout = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, address, idempotencyKey }) => 
      ordersAPI.checkout({ userId, address }, idempotencyKey),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cart.cart });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.orders });
    },
  });
};

// Provide address for auction checkout
export const useProvideAddress = () => {
  return useMutation({
    mutationFn: ({ orderId, address }) => 
      ordersAPI.provideAddress(orderId, address),
  });
};

// Cancel checkout
export const useCancelCheckout = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (orderId) => ordersAPI.cancelCheckout(orderId),
    onSuccess: (_, orderId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.order(orderId) });
    },
  });
};

// Get checkout status (with polling)
export const useCheckoutStatus = (orderId, options = {}) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: queryKeys.orders.checkoutStatus(orderId),
    queryFn: () => ordersAPI.getCheckoutStatus(orderId),
    enabled: !!user?.token && !!orderId,
    refetchInterval: (data) => {
      // Stop polling if status is COMPLETED or FAILED
      if (data?.status === 'COMPLETED' || data?.status === 'FAILED') {
        return false;
      }
      return 2000; // Poll every 2 seconds
    },
    ...options
  });
};
