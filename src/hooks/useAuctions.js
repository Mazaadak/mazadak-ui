import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { auctionAPI } from '../api/auctions';
import { queryKeys } from './queryKeys';

export const useAuction = (auctionId) => {
  return useQuery({
    queryKey: queryKeys.auctions.auction(auctionId),
    queryFn: () => auctionAPI.getAuction(auctionId),
    enabled: !!auctionId,
    // refetch every 5 seconds for live auction updates
    refetchInterval: 5000,
  });
};

export const useAuctions = (filters = {}, pageable = {}) => {
  return useQuery({
    queryKey: [...queryKeys.auctions.auctions, filters, pageable],
    queryFn: () => auctionAPI.getAuctions(filters, pageable),
    keepPreviousData: true,
    staleTime: 5000, // Consider data fresh for 5 seconds
    // refetch every 30 seconds for live auction lists (reduced from 10s)
    refetchInterval: 5000,
  });
};

export const useWatchlist = () => {
  return useQuery({
    queryKey: queryKeys.auctions.watchlist,
    queryFn: () => auctionAPI.getWatchlist(),
    // refetch watchlist periodically
    refetchInterval: 10000,
  });
};

export const useWatchAuction = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (auctionId) => 
      auctionAPI.watchAuction(auctionId),
    onSuccess: () => {
      // Invalidate watchlist and auctions queries to refresh the data
      queryClient.invalidateQueries(queryKeys.auctions.watchlist);
      queryClient.invalidateQueries(queryKeys.auctions.auctions);
    },
  });
};

export const useUnwatchAuction = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (auctionId) => 
      auctionAPI.unwatchAuction(auctionId),
    onSuccess: () => {
      // Invalidate watchlist and auctions queries to refresh the data
      queryClient.invalidateQueries(queryKeys.auctions.watchlist);
      queryClient.invalidateQueries(queryKeys.auctions.auctions);
    },
  });
};

export const useCancelAuction = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (auctionId) => auctionAPI.cancelAuction(auctionId),
    onSuccess: (data, auctionId) => {
      queryClient.invalidateQueries(queryKeys.auctions.auction(auctionId));
      queryClient.invalidateQueries(queryKeys.auctions.auctions);
      // Also invalidate products since product type changes when auction is cancelled
      queryClient.invalidateQueries(queryKeys.products.products);
    },
  });
};

export const usePauseAuction = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (auctionId) => auctionAPI.pauseAuction(auctionId),
    onSuccess: (data, auctionId) => {
      queryClient.invalidateQueries(queryKeys.auctions.auction(auctionId));
      queryClient.invalidateQueries(queryKeys.auctions.auctions);
    },
  });
};

export const useResumeAuction = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (auctionId) => auctionAPI.resumeAuction(auctionId),
    onSuccess: (data, auctionId) => {
      queryClient.invalidateQueries(queryKeys.auctions.auction(auctionId));
      queryClient.invalidateQueries(queryKeys.auctions.auctions);
    },
  });
};

export const useDeleteAuction = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (auctionId) => auctionAPI.deleteAuction(auctionId),
    onSuccess: () => {
      // Don't invalidate immediately - let the caller handle it with proper delay
      // The backend needs time to process the AuctionDeletedEvent
      console.log('Auction deleted successfully, backend processing event...');
    },
  });
};

export const useUpdateAuction = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ auctionId, data }) => auctionAPI.updateAuction(auctionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(queryKeys.auctions.auctions);
      queryClient.invalidateQueries(queryKeys.products.products);
    },
  });
};