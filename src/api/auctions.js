import apiClient from "../lib/apiClient";

export const auctionAPI = {
    // AUCTION ENDPOINTS
    getAuction: (auctionId) => 
        apiClient.get(`/auctions/${auctionId}`),

    getAuctions: (filters = {}, pageable = {}) => {
        console.log('Fetching auctions with:', { filters, pageable });
        return apiClient.get('/auctions', {
            params: {
                ...filters,
                ...pageable
            }
        }).then(response => {
            console.log('Auctions API response:', response);
            return response;
        });
    },

    // WATCH/UNWATCH ENDPOINTS
    watchAuction: (auctionId) => 
        apiClient.post(`/auctions/${auctionId}/watch`),

    unwatchAuction: (auctionId) => 
        apiClient.post(`/auctions/${auctionId}/unwatch`),

    getWatchlist: () => 
        apiClient.get('/auctions/watchlist'),

    isAuctionWatched: (auctionId) => 
        apiClient.get(`/auctions/${auctionId}/is-watched`),

    // AUCTION ACTIONS 
    cancelAuction: (auctionId) => 
        apiClient.post(`/auctions/${auctionId}/cancel`),

    pauseAuction: (auctionId) => 
        apiClient.post(`/auctions/${auctionId}/pause`),

    resumeAuction: (auctionId) => 
        apiClient.post(`/auctions/${auctionId}/resume`),

    deleteAuction: (auctionId) => 
        apiClient.delete(`/auctions/${auctionId}`),

    updateAuction: (auctionId, data) => 
        apiClient.put(`/auctions/${auctionId}`, data),

    deleteAuction: (auctionId) => 
        apiClient.delete(`/auctions/${auctionId}`),

    // BID ENDPOINTS
    placeBid: (auctionId, bidData, idempotencyKey) => 
        apiClient.post(`/auctions/${auctionId}/bids`, bidData, {
            headers: {
                'Idempotency-Key': idempotencyKey
            }
        }),

    getBids: (auctionId, params = {}) => 
        apiClient.get(`/auctions/${auctionId}/bids`, { params }),

    getHighestBid: (auctionId) => 
        apiClient.get(`/auctions/${auctionId}/bids/highest`),

    getBidderBids: (bidderId, params = {}) => 
        apiClient.get(`/auctions/bidder/${bidderId}/bids`, { params }),

    // PROXY BID ENDPOINTS
    createOrUpdateProxyBid: (auctionId, bidderId, proxyBidData) => 
        apiClient.put(`/auctions/${auctionId}/proxy-bids/${bidderId}`, proxyBidData),

    getProxyBid: (auctionId, bidderId) => 
        apiClient.get(`/auctions/${auctionId}/proxy-bids/${bidderId}`),

    deleteProxyBid: (auctionId, bidderId) => 
        apiClient.delete(`/auctions/${auctionId}/proxy-bids/${bidderId}`),
}