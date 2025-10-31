import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from './queryKeys';
import { addressAPI } from "../api/address";
import { useAuth } from "../contexts/AuthContext";

// Fetch addresses hook
export const useAddresses = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: queryKeys.addresses.addresses,
    queryFn: () => addressAPI.getAddresses(),
    enabled: !!user?.token,
  });
};

// Add address hook
export const useAddAddress = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (address) => addressAPI.addAddress(address),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.addresses.addresses });
    },
  });
};

// Update address hook
export const useUpdateAddress = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ addressId, address }) => 
      addressAPI.updateAddress(addressId, address),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.addresses.addresses });
    },
  });
};

// Delete address hook
export const useDeleteAddress = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (addressId) => addressAPI.deleteAddress(addressId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.addresses.addresses });
    },
  });
};
