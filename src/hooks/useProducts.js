import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productAPI } from '../api/products';
import { queryKeys } from './queryKeys';
import { v4 as uuidv4 } from 'uuid';

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

// Ratings
export const useProductRatings = (productId, page = 0, size = 10) => {
  return useQuery({
    queryKey: queryKeys.products.ratings(productId, page, size),
    queryFn: () => productAPI.getProductRatings(productId, page, size),
    enabled: !!productId,
  });
};

export const useCreateRating = () => {
  const idempotencyKey = (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : uuidv4();

  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ productId, data }) => 
      productAPI.createRating(productId, data, idempotencyKey),
    
    onSuccess: (data, variables) => {
      // Invalidate all rating queries for this product (all pages)
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.products.ratingsForProduct(variables.productId) 
      });
      // Also invalidate product to update average rating
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.products.product(variables.productId) 
      });
    },
  });
};

export const useUpdateRating = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ ratingId, data }) => 
      productAPI.updateRating(ratingId, data),
    
    onSuccess: () => {
      // Invalidate all ratings and products
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.products.allRatings 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.products.products 
      });
    },
  });
};

export const useDeleteRating = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (ratingId) => 
      productAPI.deleteRating(ratingId),
    
    onSuccess: () => {
      // Invalidate all ratings and products
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.products.allRatings 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.products.products 
      });
    },
  });
};