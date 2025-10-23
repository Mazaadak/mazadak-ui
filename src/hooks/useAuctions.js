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
    // refetch every 10 seconds for live auction lists
    refetchInterval: 10000,
  });
};

export const useWatchAuction = () => {
  return useMutation({
    mutationFn: (auctionId) => 
      auctionAPI.watchAuction(auctionId),
  });
};

export const useUnwatchAuction = () => {
  return useMutation({
    mutationFn: (auctionId) => 
      auctionAPI.unwatchAuction(auctionId),
  });
};

export const useCancelAuction = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (auctionId) => auctionAPI.cancelAuction(auctionId),
    onSuccess: (data, auctionId) => {
      queryClient.invalidateQueries(queryKeys.auctions.auction(auctionId));
      queryClient.invalidateQueries(queryKeys.auctions.auctions);
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