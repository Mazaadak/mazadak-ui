export const queryKeys = {
    auctions: {
        auctions: ['auctions'],
        auction: (id) => ['auctions', id],
        bids: (auctionId) => ['auctions', auctionId, 'bids'],
        highestBid: (auctionId) => ['auctions', auctionId, 'highest-bid'],
        bidderBids: (bidderId) => ['auctions', 'bidder', bidderId, 'bids'],
        proxyBid: (auctionId, bidderId) => ['auctions', auctionId, 'proxy-bids', bidderId],
        watchlist: ['auctions', 'watchlist'],
    },
    products: {
        products: ['products'],
        product: (id) => ['products', id],
        listingStatus: (id) => ['products', id, 'listingStatus'],
        userProducts: ['products', 'my-listings'],
    },
    users: {
        user: (id) => ['users', id],
        users: ['users'],
    },
    categories: {
        categories: ['categories'],
        category: (id) => ['categories', id],
    },
    cart: {
        cart: ['cart'],
        cartItem: (id) => ['cart','item', id],
    },
    inventory: {
        item: (id) => ['inventory', id],
    },
    addresses: {
        addresses: ['addresses'],
        address: (id) => ['addresses', id],
    },
    ratings: {
        all: ['ratings'],
        productRatings: (productId, page, size) => ['ratings', 'product', productId, page, size],
        userRatings: (userId, page, size) => ['ratings', 'user', userId, page, size],
        rating: (ratingId) => ['ratings', ratingId],
    },
    orders: {
        orders: ['orders'],
        order: (id) => ['orders', id],
        list: (filters, page, size, sort) => ['orders', 'list', filters, page, size, sort],
        checkoutStatus: (orderId) => ['orders', orderId, 'checkout-status'],
    },
    payments: {
        stripeAccount: (sellerId) => ['payments', 'stripe-account', sellerId],
    }
};