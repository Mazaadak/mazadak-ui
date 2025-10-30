import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ratingsAPI } from '../api/ratings';
import { queryKeys } from './queryKeys';


// Get product ratings
export const useProductRatings = (productId, page = 0, size = 10) => {
  return useQuery({
    queryKey: queryKeys.ratings.productRatings(productId, page, size),
    queryFn: () => ratingsAPI.getProductRatings(productId, page, size),
    enabled: !!productId,
  });
};


// Create rating
export const useCreateRating = () => {

  const idempotencyKey = (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : uuidv4();


  console.log("Generated Idempotency Key:", idempotencyKey);
  
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ productId, data }) => 
      ratingsAPI.createRating(productId, data, idempotencyKey),
    
    onSuccess: (data, variables) => {
      // Invalidate product ratings to refetch
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.ratings.productRatings(variables.productId) 
      });
      // Also invalidate product to update average rating
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.products.product(variables.productId) 
      });
    },
  });
};

// Update rating
export const useUpdateRating = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ ratingId, data }) => 
      ratingsAPI.updateRating(ratingId, data),
    
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.ratings.all 
      });
    },
  });
};

// Delete rating
export const useDeleteRating = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (ratingId) => 
      ratingsAPI.deleteRating(ratingId),
    
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.ratings.all 
      });
    },
  });
};