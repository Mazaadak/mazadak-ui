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
}