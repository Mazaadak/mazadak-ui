import React, { useState, useMemo } from 'react';
import { Search, Filter, SlidersHorizontal, Clock, Tag, TrendingUp, ShoppingCart, Eye, ChevronLeft, ChevronRight, Bell } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

// Dummy data generation
const generateDummyAuctions = () => {
  const titles = ['Vintage Watch', 'Rare Painting', 'Antique Furniture', 'Classic Car', 'Designer Handbag', 'Sports Memorabilia'];
  const statuses = ['SCHEDULED', 'STARTED', 'ACTIVE', 'PAUSED'];
  const sellerNames = ['John Smith', 'Sarah Johnson', 'Mike Williams', 'Emily Brown', 'David Garcia'];
  
  return Array.from({ length: 45 }, (_, i) => ({
    id: `auction-${i}`,
    productId: `product-${i}`,
    sellerId: `seller-${i % 3}`,
    sellerName: sellerNames[i % sellerNames.length],
    title: `${titles[i % titles.length]} ${i + 1}`,
    startingPrice: Math.floor(Math.random() * 500) + 50,
    reservePrice: Math.floor(Math.random() * 1000) + 500,
    highestBidPlaced: Math.random() > 0.5 ? {
      id: `bid-${i}`,
      auctionId: `auction-${i}`,
      bidderId: `bidder-${i}`,
      amount: Math.floor(Math.random() * 800) + 100
    } : null,
    bidIncrement: 10,
    startTime: new Date(Date.now() + (Math.random() - 0.5) * 86400000 * 7).toISOString(),
    endTime: new Date(Date.now() + Math.random() * 86400000 * 14).toISOString(),
    status: statuses[Math.floor(Math.random() * statuses.length)],
    product: {
      productId: `product-${i}`,
      title: `${titles[i % titles.length]} ${i + 1}`,
      description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
      images: [{
        imageId: i,
        imageUri: `https://images.unsplash.com/photo-${1500000000000 + i}?w=400`,
        isPrimary: true,
        position: 0
      }],
      ratings: [],
      category: { id: i % 5, name: 'Category ' + (i % 5) }
    }
  }));
};

const generateDummyProducts = () => {
  const titles = ['Laptop', 'Smartphone', 'Camera', 'Headphones', 'Tablet', 'Smartwatch', 'Gaming Console'];
  const sellerNames = ['Jane Doe', 'Alex Martinez', 'Chris Lee', 'Taylor Swift', 'Jordan Davis'];
  
  return Array.from({ length: 60 }, (_, i) => ({
    productId: `fixed-product-${i}`,
    sellerId: `seller-${i % 4}`,
    sellerName: sellerNames[i % sellerNames.length],
    title: `${titles[i % titles.length]} ${i + 1}`,
    description: 'High-quality product in excellent condition.',
    price: Math.floor(Math.random() * 1500) + 100,
    type: 'FIXED',
    status: 'ACTIVE',
    category: { id: i % 5, name: 'Category ' + (i % 5) },
    images: [{
      imageId: i + 100,
      imageUri: `https://images.unsplash.com/photo-${1600000000000 + i}?w=400`,
      isPrimary: true,
      position: 0
    }],
    ratings: Array.from({ length: Math.floor(Math.random() * 5) }, (_, j) => ({
      ratingId: j,
      rating: Math.floor(Math.random() * 2) + 4,
      reviewText: 'Great product!'
    }))
  }));
};

const ListingsPage = () => {
  const [activeTab, setActiveTab] = useState('auctions');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('endTime');
  
  // Pagination
  const [auctionPage, setAuctionPage] = useState(0);
  const [productPage, setProductPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  
  // Auction filters
  const [auctionFilters, setAuctionFilters] = useState({
    status: [],
    minBid: '',
    maxBid: '',
    startsBefore: '',
    startsAfter: '',
    endsBefore: '',
    endsAfter: ''
  });
  
  // Product filters
  const [productFilters, setProductFilters] = useState({
    minPrice: '',
    maxPrice: '',
    category: [],
    minRating: ''
  });
  
  const auctions = useMemo(() => generateDummyAuctions(), []);
  const products = useMemo(() => generateDummyProducts(), []);
  
  // Filter and sort auctions
  const filteredAuctions = useMemo(() => {
    let filtered = auctions.filter(a => 
      ['SCHEDULED', 'STARTED', 'ACTIVE', 'PAUSED'].includes(a.status)
    );
    
    if (searchQuery) {
      filtered = filtered.filter(a => 
        a.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (auctionFilters.status.length > 0) {
      filtered = filtered.filter(a => auctionFilters.status.includes(a.status));
    }
    
    if (auctionFilters.minBid) {
      filtered = filtered.filter(a => {
        const currentBid = a.highestBidPlaced?.amount || a.startingPrice;
        return currentBid >= parseFloat(auctionFilters.minBid);
      });
    }
    
    if (auctionFilters.maxBid) {
      filtered = filtered.filter(a => {
        const currentBid = a.highestBidPlaced?.amount || a.startingPrice;
        return currentBid <= parseFloat(auctionFilters.maxBid);
      });
    }
    
    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'endTime') {
        return new Date(a.endTime) - new Date(b.endTime);
      } else if (sortBy === 'price') {
        const priceA = a.highestBidPlaced?.amount || a.startingPrice;
        const priceB = b.highestBidPlaced?.amount || b.startingPrice;
        return priceA - priceB;
      } else if (sortBy === 'priceDesc') {
        const priceA = a.highestBidPlaced?.amount || a.startingPrice;
        const priceB = b.highestBidPlaced?.amount || b.startingPrice;
        return priceB - priceA;
      }
      return 0;
    });
    
    return filtered;
  }, [auctions, searchQuery, auctionFilters, sortBy]);
  
  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let filtered = products;
    
    if (searchQuery) {
      filtered = filtered.filter(p => 
        p.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (productFilters.minPrice) {
      filtered = filtered.filter(p => p.price >= parseFloat(productFilters.minPrice));
    }
    
    if (productFilters.maxPrice) {
      filtered = filtered.filter(p => p.price <= parseFloat(productFilters.maxPrice));
    }
    
    if (productFilters.minRating) {
      filtered = filtered.filter(p => {
        if (p.ratings.length === 0) return false;
        const avgRating = p.ratings.reduce((sum, r) => sum + r.rating, 0) / p.ratings.length;
        return avgRating >= parseFloat(productFilters.minRating);
      });
    }
    
    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'price') {
        return a.price - b.price;
      } else if (sortBy === 'priceDesc') {
        return b.price - a.price;
      } else if (sortBy === 'rating') {
        const avgA = a.ratings.length > 0 ? a.ratings.reduce((s, r) => s + r.rating, 0) / a.ratings.length : 0;
        const avgB = b.ratings.length > 0 ? b.ratings.reduce((s, r) => s + r.rating, 0) / b.ratings.length : 0;
        return avgB - avgA;
      }
      return 0;
    });
    
    return filtered;
  }, [products, searchQuery, productFilters, sortBy]);
  
  // Paginate
  const paginatedAuctions = useMemo(() => {
    const start = auctionPage * pageSize;
    return filteredAuctions.slice(start, start + pageSize);
  }, [filteredAuctions, auctionPage, pageSize]);
  
  const paginatedProducts = useMemo(() => {
    const start = productPage * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, productPage, pageSize]);
  
  const auctionTotalPages = Math.ceil(filteredAuctions.length / pageSize);
  const productTotalPages = Math.ceil(filteredProducts.length / pageSize);
  
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
    setAuctionFilters({
      status: [],
      minBid: '',
      maxBid: '',
      startsBefore: '',
      startsAfter: '',
      endsBefore: '',
      endsAfter: ''
    });
    setProductFilters({
      minPrice: '',
      maxPrice: '',
      category: [],
      minRating: ''
    });
    setSearchQuery('');
    setAuctionPage(0);
    setProductPage(0);
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
            <Label className="text-base">Status</Label>
            {['SCHEDULED', 'STARTED', 'ACTIVE', 'PAUSED'].map(status => (
              <div key={status} className="flex items-center space-x-2">
                <Checkbox
                  id={`status-${status}`}
                  checked={auctionFilters.status.includes(status)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setAuctionFilters(prev => ({
                        ...prev,
                        status: [...prev.status, status]
                      }));
                    } else {
                      setAuctionFilters(prev => ({
                        ...prev,
                        status: prev.status.filter(s => s !== status)
                      }));
                    }
                    setAuctionPage(0);
                  }}
                />
                <Label htmlFor={`status-${status}`} className="font-normal cursor-pointer">
                  {status}
                </Label>
              </div>
            ))}
          </div>
          
          <div className="space-y-3">
            <Label className="text-base">Current Bid Range</Label>
            <div className="space-y-2">
              <Input
                type="number"
                placeholder="Min"
                value={auctionFilters.minBid}
                onChange={(e) => {
                  setAuctionFilters(prev => ({ ...prev, minBid: e.target.value }));
                  setAuctionPage(0);
                }}
              />
              <Input
                type="number"
                placeholder="Max"
                value={auctionFilters.maxBid}
                onChange={(e) => {
                  setAuctionFilters(prev => ({ ...prev, maxBid: e.target.value }));
                  setAuctionPage(0);
                }}
              />
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
                  setProductFilters(prev => ({ ...prev, minPrice: e.target.value }));
                  setProductPage(0);
                }}
              />
              <Input
                type="number"
                placeholder="Max"
                value={productFilters.maxPrice}
                onChange={(e) => {
                  setProductFilters(prev => ({ ...prev, maxPrice: e.target.value }));
                  setProductPage(0);
                }}
              />
            </div>
          </div>
          
          <div className="space-y-3">
            <Label className="text-base">Minimum Rating</Label>
            <Select
              value={productFilters.minRating}
              onValueChange={(value) => {
                setProductFilters(prev => ({ ...prev, minRating: value }));
                setProductPage(0);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Any rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Any</SelectItem>
                <SelectItem value="4">4+ Stars</SelectItem>
                <SelectItem value="3">3+ Stars</SelectItem>
                <SelectItem value="2">2+ Stars</SelectItem>
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
    
    const handleWatchAuction = async (auctionId, e) => {
    e.stopPropagation(); // Prevent card click
    // TODO: Implement POST /auctions/{auctionId}/watch
    console.log(`Watching auction: ${auctionId}`);
  };

  const handleAddToCart = async (productId, e) => {
    e.stopPropagation(); // Prevent card click
    // TODO: Implement add to cart
    console.log(`Adding product to cart: ${productId}`);
  };

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
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setAuctionPage(0);
                  setProductPage(0);
                }}
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
          
          <Tabs value={activeTab} onValueChange={(value) => {
            setActiveTab(value);
            setSortBy(value === 'auctions' ? 'endTime' : 'price');
          }}>
            <TabsList>
              <TabsTrigger value="auctions">
                Auctions
                <Badge variant="secondary" className="ml-2">
                  {filteredAuctions.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="fixed">
                Fixed Price 
                <Badge variant="secondary" className="ml-2">
                  {filteredProducts.length}
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
            <Select value={pageSize.toString()} onValueChange={(value) => {
              setPageSize(parseInt(value));
              setAuctionPage(0);
              setProductPage(0);
            }}>
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
            <Select value={sortBy} onValueChange={setSortBy}>
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
                    <SelectItem value="rating">Highest Rated</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Tabs value={activeTab}>
          <TabsContent value="auctions" className="mt-0">
            {paginatedAuctions.length > 0 ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {paginatedAuctions.map(auction => (
                    <Card 
                      key={auction.id} 
                      className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
                      onClick={() => window.location.href = `/auctions/${auction.id}`}
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
                      </div>
                      <CardHeader className="p-3 pb-2">
                        <h3 className="font-semibold text-sm truncate">{auction.title}</h3>
                        <p className="text-xs text-muted-foreground">by {auction.sellerName}</p>
                      </CardHeader>
                      <CardContent className="p-3 pt-0 pb-2">
                        {auction.highestBidPlaced ? (
                          <div className="space-y-0.5">
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-lg font-bold">
                                ${auction.highestBidPlaced.amount.toFixed(2)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-green-600">
                              <TrendingUp className="h-3 w-3" />
                              <span>{Math.floor(Math.random() * 10) + 1} bids</span>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            <div className="text-lg font-bold">
                              ${auction.startingPrice.toFixed(2)}
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
                            variant="outline"
                            onClick={(e) => handleWatchAuction(auction.id, e)}
                          >
                            <Bell className="h-3 w-3 mr-1" />
                            Watch
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
                  onPageChange={setAuctionPage}
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
            {paginatedProducts.length > 0 ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {paginatedProducts.map(product => {
                    const avgRating = product.ratings.length > 0
                      ? product.ratings.reduce((sum, r) => sum + r.rating, 0) / product.ratings.length
                      : 0;
                    
                    return (
                      <Card 
                        key={product.productId} 
                        className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
                        onClick={() => window.location.href = `/products/${product.productId}`}
                      >
                        <div className="relative aspect-square bg-muted">
                          {product.ratings.length > 0 && (
                            <div className="absolute top-2 left-2 z-10">
                              <Badge className="bg-yellow-400 text-yellow-900 hover:bg-yellow-500 text-xs">
                                ★ {avgRating.toFixed(1)}
                              </Badge>
                            </div>
                          )}
                        </div>
                        <CardHeader className="p-3 pb-2">
                          <h3 className="font-semibold text-sm truncate">{product.title}</h3>
                          <p className="text-xs text-muted-foreground">by {product.sellerName}</p>
                        </CardHeader>
                        <CardContent className="p-3 pt-0 pb-2">
                          <span className="text-lg font-bold">
                            ${product.price.toFixed(2)}
                          </span>
                        </CardContent>
                        <CardFooter className="p-3 pt-0 flex-col gap-2">
                          <Button 
                            className="w-full h-8 text-xs" 
                            size="sm"
                            variant="outline"
                            onClick={(e) => e.stopPropagation()}
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
                  onPageChange={setProductPage}
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