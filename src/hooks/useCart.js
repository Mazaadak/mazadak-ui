import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from './queryKeys';
import { cartAPI } from "../api/cart";
import { useAuth } from "../contexts/AuthContext";

// Fetch cart items hook
export const useCartItems = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: queryKeys.cart.cart,
    queryFn: () => cartAPI.getCartItems(),
    enabled: !!user?.token,
  });
};

// Add to cart hook
export const useAddToCart = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ productId, quantity = 1 }) => 
      cartAPI.addItemToCart(productId, quantity),
    
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cart.cart });
    },
  });
};

// Remove from cart hook
export const useRemoveFromCart = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (productId) => 
      cartAPI.removeItemFromCart(productId),
    
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cart.cart });
    },
  });
};

// Update cart item hook
export const useUpdateCartItem = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ productId, quantity }) => 
      cartAPI.updateItemQuantity(productId, quantity),
    
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cart.cart });
    },
  });
};

// Clear cart hook
export const useClearCart = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => 
      cartAPI.clearCart(),
    
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cart.cart });
    },
  });
};

// Check if cart is active hook
export const useIsCartActive = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: queryKeys.cart.isActive,
    queryFn: () => cartAPI.isCartActive(),
    enabled: !!user?.token,
  });
};