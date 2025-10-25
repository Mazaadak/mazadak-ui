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