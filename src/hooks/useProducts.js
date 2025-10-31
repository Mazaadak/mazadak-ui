import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productAPI } from '../api/products';
import { queryKeys } from './queryKeys';

export const useProducts = (filters = {}, pageable = {}) => {
  return useQuery({
    queryKey: [...queryKeys.products.products, filters, pageable],
    queryFn: () => productAPI.getProducts(filters, pageable),
    keepPreviousData: true,
  });
}

export const useProduct = (productId) => {
  return useQuery({
    queryKey: queryKeys.products.product(productId),
    queryFn: () => productAPI.getProduct(productId),
    enabled: !!productId,
  });
}

export const useUpdateProduct = (options = {}) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ productId, data }) =>
      productAPI.updateProduct(productId, data),

    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries(queryKeys.products.products);
      queryClient.setQueryData(queryKeys.products.product(data.id), data);

      options.onSuccess?.(data, variables, context);
    },

    onError: (error, variables, context) => {
      options.onError?.(error, variables, context);
    },
  });
}

// Delete product
export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (productId) => 
      productAPI.deleteProduct(productId),
    
    onSuccess: () => {
      // Invalidate all product-related queries
      queryClient.invalidateQueries(queryKeys.products.products);
      queryClient.invalidateQueries(queryKeys.auctions.auctions);
      queryClient.invalidateQueries(queryKeys.inventory.items);
    },
  });
};

export const useCreateProduct = (options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ data, idempotencyKey }) =>
      productAPI.createProduct(data, idempotencyKey),

    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries(queryKeys.products.products);
      queryClient.setQueryData(queryKeys.products.product(data.id), data);

      options.onSuccess?.(data, variables, context);
    },

    onError: (error, variables, context) => {
      options.onError?.(error, variables, context);
    },
  });
};

export const useCategories = () => {
  return useQuery({
    queryKey: queryKeys.products.categories,
    queryFn: () => productAPI.getCategories(),
  });
}


export const useCreateListing = (options = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ data, idempotencyKey }) => productAPI.createListing(data, idempotencyKey),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries(queryKeys.products.products);
      // TODO should invalidate auctions and inventories also
      options.onSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      options.onError?.(error, variables, context);
    },
  });
}

export const useListingStatus = (productId, idempotencyKey) => {
  return useQuery({
    queryKey: queryKeys.products.listingStatus(productId),
    queryFn: () => productAPI.getListingStatus(productId, idempotencyKey),
    enabled: !!productId,
    refetchInterval: 2000, // Poll every 2 seconds
  });
}