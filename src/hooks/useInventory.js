import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import inventoryApi from '../api/inventory';
import { queryKeys } from './queryKeys';

export const useInventoryItem = (productId) => {
    const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.inventory.item(productId),
    queryFn: () => inventoryApi.getInventoryItem(productId),
     enabled: !!user?.token,
  });
};

export const useUpdateInventoryItem = () => {
    const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productId, quantity }) =>
      inventoryApi.updateInventoryItem(productId, quantity),

    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries(queryKeys.inventory.item(variables.productId));
    },
  });
};

export const useDeleteInventoryItem = () => {
    const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId) =>
      inventoryApi.deleteInventoryItem(productId),

    onSuccess: (data, productId) => {
      // Don't invalidate immediately - let the caller handle it with proper delay
      // The backend needs time to process the InventoryDeletedEvent
      console.log('Inventory deleted successfully, backend processing event...');
    },
  });
};