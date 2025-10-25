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

export const useCreateProduct = (options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) =>
      productAPI.createProduct(data),

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
    mutationFn: (data) => productAPI.createListing(data),
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

export const useListingStatus = (productId) => {
  return useQuery({
    queryKey: queryKeys.products.listingStatus(productId),
    queryFn: () => productAPI.getListingStatus(productId),
    enabled: !!productId,
    refetchInterval: 2000, // Poll every 2 seconds
  });
}