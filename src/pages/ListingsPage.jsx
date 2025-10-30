import React, { useState, useMemo, useEffect } from 'react';
import { Search, Filter, SlidersHorizontal, Clock, Tag, TrendingUp, ShoppingCart, Eye, ChevronLeft, ChevronRight, Bell, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useProducts } from '@/hooks/useProducts';
import { useAuctions, useWatchlist, useWatchAuction, useUnwatchAuction } from '@/hooks/useAuctions';
import { useAddToCart } from '../hooks/useCart';
import { toast } from 'sonner';


// TODO: seller name

const ListingsPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Get all state from URL params with defaults
  const activeTab = searchParams.get('tab') || 'auctions';
  const searchQuery = searchParams.get('q') || '';
  const sortBy = searchParams.get('sort') || (activeTab === 'auctions' ? 'endTime' : 'price');
  const pageSize = parseInt(searchParams.get('pageSize')) || 20;
  const auctionPage = parseInt(searchParams.get('auctionPage')) || 0;
  const productPage = parseInt(searchParams.get('productPage')) || 0;

  // Auction filters from URL
  const auctionFilters = {
    minHighestBid: searchParams.get('auctionMinBid') || '',
    maxHighestBid: searchParams.get('auctionMaxBid') || '',
    startsBefore: searchParams.get('auctionStartsBefore') || '',
    startsAfter: searchParams.get('auctionStartsAfter') || '',
    endsBefore: searchParams.get('auctionEndsBefore') || '',
    endsAfter: searchParams.get('auctionEndsAfter') || '',
    title: searchParams.get('q') || ''
  };

  // Product filters from URL
  const productFilters = {
    minPrice: searchParams.get('productMinPrice') || '',
    maxPrice: searchParams.get('productMaxPrice') || '',
    categories: searchParams.get('categories') ? searchParams.get('categories').split(',') : [],
    maxRating: searchParams.get('maxRating') || '',
    type: 'FIXED',
    title: searchParams.get('q') || ''
  };

  // Update URL when any state changes
  const updateURL = (updates) => {
    const newSearchParams = new URLSearchParams(searchParams);
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value === '' || value === null || value === undefined || (Array.isArray(value) && value.length === 0)) {
        newSearchParams.delete(key);
      } else if (Array.isArray(value)) {
        newSearchParams.set(key, value.join(','));
      } else {
        newSearchParams.set(key, value.toString());
      }
    });
    
    setSearchParams(newSearchParams);
  };

  // Handlers for different state changes
  const handleTabChange = (value) => {
    const updates = { 
      tab: value,
      sort: value === 'auctions' ? 'endTime' : 'price',
      auctionPage: '0',
      productPage: '0'
    };
    updateURL(updates);
  };

  const handleSearchChange = (value) => {
    updateURL({ 
      q: value,
      auctionPage: '0',
      productPage: '0'
    });
  };

  const handleSortChange = (value) => {
    updateURL({ sort: value });
  };

  const handlePageSizeChange = (value) => {
    updateURL({ 
      pageSize: value,
      auctionPage: '0',
      productPage: '0'
    });
  };

  const handleAuctionPageChange = (page) => {
    updateURL({ auctionPage: page.toString() });
  };

  const handleProductPageChange = (page) => {
    updateURL({ productPage: page.toString() });
  };

  // Auction filter handlers
  const handleAuctionFilterChange = (filterUpdates) => {
    const updates = {
      ...filterUpdates,
      auctionPage: '0'
    };
    updateURL(updates);
  };

  // Product filter handlers
  const handleProductFilterChange = (filterUpdates) => {
    const updates = {
      ...filterUpdates,
      productPage: '0'
    };
    updateURL(updates);
  };

  // Build auction query params
  const auctionQueryParams = useMemo(() => {
    const filters = {};
    
    if (searchQuery && activeTab === 'auctions') {
      filters.title = searchQuery;
    }
    if (auctionFilters.minHighestBid) filters.minHighestBid = auctionFilters.minHighestBid;
    if (auctionFilters.maxHighestBid) filters.maxHighestBid = auctionFilters.maxHighestBid;
    if (auctionFilters.startsBefore) filters.startsBefore = auctionFilters.startsBefore;
    if (auctionFilters.startsAfter) filters.startsAfter = auctionFilters.startsAfter;
    if (auctionFilters.endsBefore) filters.endsBefore = auctionFilters.endsBefore;
    if (auctionFilters.endsAfter) filters.endsAfter = auctionFilters.endsAfter;
    
    return filters;
  }, [searchQuery, activeTab, auctionFilters]);

  const auctionPageable = useMemo(() => ({
    page: auctionPage,
    size: pageSize,
    sort: sortBy === 'endTime' ? 'endTime,asc' : 
          sortBy === 'price' ? 'highestBidPlaced.amount,asc' : 
          sortBy === 'priceDesc' ? 'highestBidPlaced.amount,desc' : 
          'startTime,asc'
  }), [auctionPage, pageSize, sortBy]);

  // Build product query params
  const productQueryParams = useMemo(() => {
    const filters = {
      type: 'FIXED'
    };
    
    if (searchQuery && activeTab === 'fixed') {
      filters.title = searchQuery;
    }
    if (productFilters.minPrice) filters.minPrice = productFilters.minPrice;
    if (productFilters.maxPrice) filters.maxPrice = productFilters.maxPrice;
    if (productFilters.maxRating) filters.maxRating = productFilters.maxRating;
    if (productFilters.categories && productFilters.categories.length > 0) {
      filters.categories = productFilters.categories;
    }
    
    return filters;
  }, [searchQuery, activeTab, productFilters]);

  const productPageable = useMemo(() => ({
    page: productPage,
    size: pageSize,
    sort: sortBy === 'price' ? 'price,asc' : 
          sortBy === 'priceDesc' ? 'price,desc' : 
          'createdAt,desc'
  }), [productPage, pageSize, sortBy]);

  // Fetch data using hooks
  const { 
    data: auctionsData, 
    isLoading: auctionsLoading, 
    isError: auctionsError,
    error: auctionsErrorDetails
  } = useAuctions(auctionQueryParams, auctionPageable);

  const { 
    data: productsData, 
    isLoading: productsLoading, 
    isError: productsError 
  } = useProducts(productQueryParams, productPageable);

  // Debug: Log auction data
  React.useEffect(() => {
    console.log('Auctions Data:', {
      auctionsData,
      isLoading: auctionsLoading,
      isError: auctionsError,
      error: auctionsErrorDetails,
      filters: auctionQueryParams,
      pageable: auctionPageable
    });
  }, [auctionsData, auctionsLoading, auctionsError, auctionsErrorDetails, auctionQueryParams, auctionPageable]);

  // Extract data from API response (Spring Boot Page format)
  // Handle cases where backend returns null, undefined, or empty string
  const auctions = (auctionsData && typeof auctionsData === 'object') ? (auctionsData.content || []) : [];
  const auctionTotalPages = (auctionsData && typeof auctionsData === 'object') ? (auctionsData.totalPages || 0) : 0;
  const auctionTotalElements = (auctionsData && typeof auctionsData === 'object') ? (auctionsData.totalElements || 0) : 0;

  const products = (productsData && typeof productsData === 'object') ? (productsData.content || []) : [];
  const productTotalPages = (productsData && typeof productsData === 'object') ? (productsData.totalPages || 0) : 0;
  const productTotalElements = (productsData && typeof productsData === 'object') ? (productsData.totalElements || 0) : 0;

  // Fetch watchlist
  const { data: watchlistData } = useWatchlist();
  
  // Create a Set of watched auction IDs for O(1) lookup
  const watchedAuctionIds = useMemo(() => {
    if (!watchlistData) return new Set();
    return new Set(watchlistData.map(item => item.auction.id));
  }, [watchlistData]);

  // Helper function to check if auction is watched
  const isAuctionWatched = (auctionId) => {
    return watchedAuctionIds.has(auctionId);
  };
  
  const getTimeRemaining = (endTime) => {
    const diff = new Date(endTime) - new Date();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h`;
    return 'Ending soon';
  };
  
  const getStatusVariant = (status) => {
    const variants = {
      SCHEDULED: 'secondary',
      STARTED: 'default',
      ACTIVE: 'default',
      PAUSED: 'outline'
    };
    return variants[status] || 'secondary';
  };
  
  const clearFilters = () => {
    // Clear all filter-related params
    const paramsToClear = [
      'q', 'sort', 'pageSize', 'auctionPage', 'productPage',
      'auctionMinBid', 'auctionMaxBid', 'auctionStartsBefore', 'auctionStartsAfter', 
      'auctionEndsBefore', 'auctionEndsAfter',
      'productMinPrice', 'productMaxPrice', 'categories', 'maxRating'
    ];
    
    const newSearchParams = new URLSearchParams();
    // Keep only the tab
    newSearchParams.set('tab', activeTab);
    setSearchParams(newSearchParams);
  };

  const watchAuctionMutation = useWatchAuction();
  const unwatchAuctionMutation = useUnwatchAuction();

  const handleToggleWatch = async (auctionId, isWatched, e) => {
    e.stopPropagation();
    
    try {
      if (isWatched) {
        await unwatchAuctionMutation.mutateAsync(auctionId);
        toast.success("Auction unwatched!");
      } else {
        await watchAuctionMutation.mutateAsync(auctionId);
        toast.success("Auction watched!");
      }
    } catch (error) {
      toast.error(isWatched ? "Failed to unwatch auction" : "Failed to watch auction");
    }
  };

  const addToCart = useAddToCart();

  const handleAddToCart = async (productId, e) => {
    e.stopPropagation();
    
    try {
      await addToCart.mutateAsync({ productId });
      toast.success("Product added to cart!");
    } catch (error) {
      toast.error("Failed to add product to cart");
    }
  };

  const FiltersContent = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Filters</h3>
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          Clear all
        </Button>
      </div>
      
      {activeTab === 'auctions' ? (
        <div className="space-y-6">
          <div className="space-y-3">
            <Label className="text-base">Current Bid Range</Label>
            <div className="space-y-2">
              <Input
                type="number"
                placeholder="Min"
                value={auctionFilters.minHighestBid}
                onChange={(e) => {
                  handleAuctionFilterChange({ auctionMinBid: e.target.value });
                }}
              />
              <Input
                type="number"
                placeholder="Max"
                value={auctionFilters.maxHighestBid}
                onChange={(e) => {
                  handleAuctionFilterChange({ auctionMaxBid: e.target.value });
                }}
              />
            </div>
          </div>
          
          <div className="space-y-3">
            <Label className="text-base">Start Time</Label>
            <div className="space-y-2">
              <div>
                <Label htmlFor="startsAfter" className="text-xs text-muted-foreground">Starts After</Label>
                <Input
                  id="startsAfter"
                  type="datetime-local"
                  value={auctionFilters.startsAfter}
                  onChange={(e) => {
                    handleAuctionFilterChange({ auctionStartsAfter: e.target.value });
                  }}
                />
              </div>
              <div>
                <Label htmlFor="startsBefore" className="text-xs text-muted-foreground">Starts Before</Label>
                <Input
                  id="startsBefore"
                  type="datetime-local"
                  value={auctionFilters.startsBefore}
                  onChange={(e) => {
                    handleAuctionFilterChange({ auctionStartsBefore: e.target.value });
                  }}
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <Label className="text-base">End Time</Label>
            <div className="space-y-2">
              <div>
                <Label htmlFor="endsAfter" className="text-xs text-muted-foreground">Ends After</Label>
                <Input
                  id="endsAfter"
                  type="datetime-local"
                  value={auctionFilters.endsAfter}
                  onChange={(e) => {
                    handleAuctionFilterChange({ auctionEndsAfter: e.target.value });
                  }}
                />
              </div>
              <div>
                <Label htmlFor="endsBefore" className="text-xs text-muted-foreground">Ends Before</Label>
                <Input
                  id="endsBefore"
                  type="datetime-local"
                  value={auctionFilters.endsBefore}
                  onChange={(e) => {
                    handleAuctionFilterChange({ auctionEndsBefore: e.target.value });
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="space-y-3">
            <Label className="text-base">Price Range</Label>
            <div className="space-y-2">
              <Input
                type="number"
                placeholder="Min"
                value={productFilters.minPrice}
                onChange={(e) => {
                  handleProductFilterChange({ productMinPrice: e.target.value });
                }}
              />
              <Input
                type="number"
                placeholder="Max"
                value={productFilters.maxPrice}
                onChange={(e) => {
                  handleProductFilterChange({ productMaxPrice: e.target.value });
                }}
              />
            </div>
          </div>
          
          <div className="space-y-3">
            <Label className="text-base">Maximum Rating</Label>
            <Select
              value={productFilters.maxRating}
              onValueChange={(value) => {
                handleProductFilterChange({ maxRating: value });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Any rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=" ">Any</SelectItem>
                <SelectItem value="5">Up to 5 Stars</SelectItem>
                <SelectItem value="4">Up to 4 Stars</SelectItem>
                <SelectItem value="3">Up to 3 Stars</SelectItem>
                <SelectItem value="2">Up to 2 Stars</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  );

  const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    const pages = [];
    const maxVisible = 5;
    
    let startPage = Math.max(0, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages - 1, startPage + maxVisible - 1);
    
    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(0, endPage - maxVisible + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="flex items-center justify-center gap-2 mt-8">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 0}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        {startPage > 0 && (
          <>
            <Button
              variant="outline"
              onClick={() => onPageChange(0)}
            >
              1
            </Button>
            {startPage > 1 && <span className="px-2">...</span>}
          </>
        )}
        
        {pages.map(page => (
          <Button
            key={page}
            variant={currentPage === page ? "default" : "outline"}
            onClick={() => onPageChange(page)}
          >
            {page + 1}
          </Button>
        ))}
        
        {endPage < totalPages - 1 && (
          <>
            {endPage < totalPages - 2 && <span className="px-2">...</span>}
            <Button
              variant="outline"
              onClick={() => onPageChange(totalPages - 1)}
            >
              {totalPages}
            </Button>
          </>
        )}
        
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages - 1}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold mb-6">Marketplace</h1>
          
          <div className="flex gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search listings..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                  <SheetDescription>
                    Refine your search results
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-6">
                  <FiltersContent />
                </div>
              </SheetContent>
            </Sheet>
          </div>
          
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList>
              <TabsTrigger value="auctions">
                Auctions
                <Badge variant="secondary" className="ml-2">
                  {auctionTotalElements}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="fixed">
                Fixed Price 
                <Badge variant="secondary" className="ml-2">
                  {productTotalElements}
                </Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <SlidersHorizontal className="h-4 w-4" />
            <span>Sort by:</span>
          </div>
          <div className="flex gap-3 items-center">
            <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="12">12 per page</SelectItem>
                <SelectItem value="20">20 per page</SelectItem>
                <SelectItem value="40">40 per page</SelectItem>
                <SelectItem value="60">60 per page</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={handleSortChange}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {activeTab === 'auctions' ? (
                  <>
                    <SelectItem value="endTime">Ending Soon</SelectItem>
                    <SelectItem value="price">Price: Low to High</SelectItem>
                    <SelectItem value="priceDesc">Price: High to Low</SelectItem>
                  </>
                ) : (
                  <>
                    <SelectItem value="price">Price: Low to High</SelectItem>
                    <SelectItem value="priceDesc">Price: High to Low</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Tabs value={activeTab}>
          <TabsContent value="auctions" className="mt-0">
            {auctionsLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : auctionsError ? (
              <Card className="p-12">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2 text-destructive">Error loading auctions</h3>
                  <p className="text-muted-foreground mb-4">
                    Please try again later
                  </p>
                  <Button onClick={() => window.location.reload()}>Retry</Button>
                </div>
              </Card>
            ) : auctions.length > 0 ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {auctions.map(auction => (
                    <Card 
                      key={auction.id} 
                      className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
                      onClick={() => navigate(`/auctions/${auction.id}`)}
                    >
                      <div className="relative aspect-square bg-muted">
                        <div className="absolute top-2 left-2 z-10">
                          <Badge variant={getStatusVariant(auction.status)} className="text-xs">
                            {auction.status}
                          </Badge>
                        </div>
                        <div className="absolute top-2 right-2 z-10">
                          <Badge variant="secondary" className="bg-black/70 text-white hover:bg-black/80 text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            {getTimeRemaining(auction.endTime)}
                          </Badge>
                        </div>
                        {auction.product?.images?.[0]?.imageUri && (
                          <img 
                            src={auction.product.images[0].imageUri} 
                            alt={auction.title}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <CardHeader className="p-3 pb-2">
                        <h3 className="font-semibold text-sm truncate">{auction.title || auction.product?.title}</h3>
                        <p className="text-xs text-muted-foreground">by {auction.sellerName || 'Seller'}</p>
                      </CardHeader>
                      <CardContent className="p-3 pt-0 pb-2">
                        {auction.highestBidPlaced ? (
                          <div className="space-y-0.5">
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-lg font-bold">
                                ${auction.highestBidPlaced.amount?.toFixed(2) || '0.00'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-green-600">
                              <TrendingUp className="h-3 w-3" />
                              <span>Current bid</span>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            <div className="text-lg font-bold">
                              ${auction.startingPrice?.toFixed(2) || '0.00'}
                            </div>
                            <div className="text-xs text-muted-foreground">starting bid</div>
                          </div>
                        )}
                      </CardContent>
                      <CardFooter className="p-3 pt-0">
                        {auction.status === 'SCHEDULED' ? (
                          <Button 
                            className="w-full h-8 text-xs" 
                            size="sm"
                            variant={isAuctionWatched(auction.id) ? "default" : "outline"}
                            onClick={(e) => handleToggleWatch(auction.id, isAuctionWatched(auction.id), e)}
                          >
                            <Bell className="h-3 w-3 mr-1" />
                            {isAuctionWatched(auction.id) ? 'Unwatch' : 'Watch'}
                          </Button>
                        ) : (
                          <Button 
                            className="w-full h-8 text-xs" 
                            size="sm"
                            onClick={(e) => e.stopPropagation()}
                          >
                            View Details
                          </Button>
                        )}
                      </CardFooter>
                    </Card>
                  ))}
                </div>
                <Pagination
                  currentPage={auctionPage}
                  totalPages={auctionTotalPages}
                  onPageChange={handleAuctionPageChange}
                />
              </>
            ) : (
              <Card className="p-12">
                <div className="text-center">
                  <Search className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No results found</h3>
                  <p className="text-muted-foreground mb-4">
                    Try adjusting your filters or search query
                  </p>
                  <Button onClick={clearFilters}>Clear Filters</Button>
                </div>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="fixed" className="mt-0">
            {productsLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : productsError ? (
              <Card className="p-12">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2 text-destructive">Error loading products</h3>
                  <p className="text-muted-foreground mb-4">
                    Please try again later
                  </p>
                  <Button onClick={() => window.location.reload()}>Retry</Button>
                </div>
              </Card>
            ) : products.length > 0 ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {products.map(product => {
                    const avgRating = product.ratings?.length > 0
                      ? product.ratings.reduce((sum, r) => sum + r.rating, 0) / product.ratings.length
                      : 0;
                    
                    return (
                      <Card 
                        key={product.productId} 
                        className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
                        onClick={() => navigate(`/products/${product.productId}`)}
                      >
                        <div className="relative aspect-square bg-muted">
                          {avgRating > 0 && (
                            <div className="absolute top-2 left-2 z-10">
                              <Badge className="bg-yellow-400 text-yellow-900 hover:bg-yellow-500 text-xs">
                                ★ {avgRating.toFixed(1)}
                              </Badge>
                            </div>
                          )}
                          {product.images?.[0]?.imageUri && (
                            <img 
                              src={product.images[0].imageUri} 
                              alt={product.title}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <CardHeader className="p-3 pb-2">
                          <h3 className="font-semibold text-sm truncate">{product.title}</h3>
                          <p className="text-xs text-muted-foreground">by {product.sellerName || 'Seller'}</p>
                        </CardHeader>
                        <CardContent className="p-3 pt-0 pb-2">
                          <span className="text-lg font-bold">
                            ${product.price?.toFixed(2) || '0.00'}
                          </span>
                        </CardContent>
                        <CardFooter className="p-3 pt-0 flex-col gap-2">
                          <Button 
                            className="w-full h-8 text-xs" 
                            size="sm"
                            variant="outline"
                            onClick={(e) => { e.stopPropagation(); navigate(`/products/${product.productId}`); }}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View Details
                          </Button>
                          <Button 
                            className="w-full h-8 text-xs" 
                            size="sm"
                            onClick={(e) => handleAddToCart(product.productId, e)}
                          >
                            <ShoppingCart className="h-3 w-3 mr-1" />
                            Add to Cart
                          </Button>
                        </CardFooter>
                      </Card>
                    );
                  })}
                </div>
                <Pagination
                  currentPage={productPage}
                  totalPages={productTotalPages}
                  onPageChange={handleProductPageChange}
                />
              </>
            ) : (
              <Card className="p-12">
                <div className="text-center">
                  <Search className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No results found</h3>
                  <p className="text-muted-foreground mb-4">
                    Try adjusting your filters or search query
                  </p>
                  <Button onClick={clearFilters}>Clear Filters</Button>
                </div>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ListingsPage;