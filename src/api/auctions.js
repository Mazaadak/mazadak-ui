import apiClient from "../lib/apiClient";

export const auctionAPI = {
    // AUCTION ENDPOINTS
    getAuction: (auctionId) => 
        apiClient.get(`/auctions/${auctionId}`),

    getAuctions: (filters = {}, pageable = {}) => 
        apiClient.get('/auctions', {
            params: {
                ...filters,
                ...pageable
            }
        }),

    // WATCH/UNWATCH ENDPOINTS
    watchAuction: (auctionId) => 
        apiClient.post(`/auctions/${auctionId}/watch`),

    unwatchAuction: (auctionId) => 
        apiClient.post(`/auctions/${auctionId}/unwatch`),

    // AUCTION ACTIONS 
    cancelAuction: (auctionId) => 
        apiClient.post(`/auctions/${auctionId}/cancel`),

    pauseAuction: (auctionId) => 
        apiClient.post(`/auctions/${auctionId}/pause`),

    resumeAuction: (auctionId) => 
        apiClient.post(`/auctions/${auctionId}/resume`),
}