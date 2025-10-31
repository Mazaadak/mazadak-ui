import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { auctionAPI } from '../api/auctions';
import { queryKeys } from './queryKeys';

export const useAuction = (auctionId, options = {}) => {
  return useQuery({
    queryKey: queryKeys.auctions.auction(auctionId),
    queryFn: () => auctionAPI.getAuction(auctionId),
    enabled: !!auctionId,
    // refetch every 2 seconds for live auction updates
    refetchInterval: options.enablePolling ? 2000 : false,
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
    onSuccess: (data, auctionId) => {
      // Invalidate the specific auction
      queryClient.invalidateQueries(queryKeys.auctions.auction(auctionId));
      // Invalidate all auction list queries (this will catch all filters/pagination combos)
      queryClient.invalidateQueries({ queryKey: queryKeys.auctions.auctions });
      // Also invalidate watchlist in case the deleted auction was watched
      queryClient.invalidateQueries(queryKeys.auctions.watchlist);
    },
  });
};

// ==================== BID HOOKS ====================

export const usePlaceBid = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ auctionId, bidData, idempotencyKey }) => 
      auctionAPI.placeBid(auctionId, bidData, idempotencyKey),
    onSuccess: (data, variables) => {
      // Invalidate auction to refresh highest bid
      queryClient.invalidateQueries(queryKeys.auctions.auction(variables.auctionId));
      // Invalidate bids list
      queryClient.invalidateQueries(queryKeys.auctions.bids(variables.auctionId));
      // Invalidate highest bid
      queryClient.invalidateQueries(queryKeys.auctions.highestBid(variables.auctionId));
      // Invalidate bidder's bids
      queryClient.invalidateQueries(queryKeys.auctions.bidderBids(variables.bidData.bidderId));
    },
  });
};

export const useBids = (auctionId, params = {}, options = {}) => {
  return useQuery({
    queryKey: [...queryKeys.auctions.bids(auctionId), params],
    queryFn: () => auctionAPI.getBids(auctionId, params),
    enabled: !!auctionId,
    // Poll every 2 seconds for live bid updates
    refetchInterval: options.enablePolling ? 2000 : false,
    keepPreviousData: true,
  });
};

export const useHighestBid = (auctionId, options = {}) => {
  return useQuery({
    queryKey: queryKeys.auctions.highestBid(auctionId),
    queryFn: () => auctionAPI.getHighestBid(auctionId),
    enabled: !!auctionId,
    // Poll every 2 seconds for live highest bid updates
    refetchInterval: options.enablePolling ? 2000 : false,
  });
};

export const useBidderBids = (bidderId, params = {}) => {
  return useQuery({
    queryKey: [...queryKeys.auctions.bidderBids(bidderId), params],
    queryFn: () => auctionAPI.getBidderBids(bidderId, params),
    enabled: !!bidderId,
    keepPreviousData: true,
  });
};

// ==================== PROXY BID HOOKS ====================

export const useCreateOrUpdateProxyBid = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ auctionId, bidderId, proxyBidData }) => 
      auctionAPI.createOrUpdateProxyBid(auctionId, bidderId, proxyBidData),
    onSuccess: (data, variables) => {
      // Invalidate proxy bid
      queryClient.invalidateQueries(
        queryKeys.auctions.proxyBid(variables.auctionId, variables.bidderId)
      );
      // Invalidate auction (might affect current bid)
      queryClient.invalidateQueries(queryKeys.auctions.auction(variables.auctionId));
      // Invalidate bids list
      queryClient.invalidateQueries(queryKeys.auctions.bids(variables.auctionId));
    },
  });
};

export const useProxyBid = (auctionId, bidderId) => {
  return useQuery({
    queryKey: queryKeys.auctions.proxyBid(auctionId, bidderId),
    queryFn: () => auctionAPI.getProxyBid(auctionId, bidderId),
    enabled: !!auctionId && !!bidderId,
    retry: false, // Don't retry if proxy bid doesn't exist
  });
};

export const useDeleteProxyBid = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ auctionId, bidderId }) => 
      auctionAPI.deleteProxyBid(auctionId, bidderId),
    onSuccess: (data, variables) => {
      // Invalidate proxy bid
      queryClient.invalidateQueries(
        queryKeys.auctions.proxyBid(variables.auctionId, variables.bidderId)
      );
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
      queryClient.invalidateQueries(queryKeys.products.products);
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