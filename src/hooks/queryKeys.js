export const queryKeys = {
    auctions: {
        auctions: ['auctions'],
        auction: (id) => ['auctions', id],
    },
    products: {
        products: ['products'],
        product: (id) => ['products', id],
        listingStatus: (id) => ['products', id, 'listingStatus'],
    },
    users: {
        user: (id) => ['users', id],
        users: ['users'],
    },
    categories: {
        categories: ['categories'],
        category: (id) => ['categories', id],
    }
}