import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useWatchlist, useUnwatchAuction } from '@/hooks/useAuctions';
import { Clock, TrendingUp, Bell, BellOff, Loader2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const WatchlistPage = () => {
  const navigate = useNavigate();
  const { data: watchlistData, isLoading, isError, error } = useWatchlist();
  const unwatchAuctionMutation = useUnwatchAuction();

  const getTimeRemaining = (endTime) => {
    const diff = new Date(endTime) - new Date();
    if (diff <= 0) return 'Ended';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getTimeUntilStart = (startTime) => {
    const diff = new Date(startTime) - new Date();
    if (diff <= 0) return null;
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `Starts in ${days}d ${hours}h`;
    if (hours > 0) return `Starts in ${hours}h`;
    return 'Starting soon';
  };

  const getStatusVariant = (status) => {
    const variants = {
      SCHEDULED: 'secondary',
      STARTED: 'default',
      ACTIVE: 'default',
      PAUSED: 'outline',
      ENDED: 'destructive',
      CANCELLED: 'destructive'
    };
    return variants[status] || 'secondary';
  };

  const getStatusColor = (status) => {
    const colors = {
      SCHEDULED: 'text-blue-600',
      STARTED: 'text-green-600',
      ACTIVE: 'text-green-600',
      PAUSED: 'text-yellow-600',
      ENDED: 'text-red-600',
      CANCELLED: 'text-red-600'
    };
    return colors[status] || 'text-gray-600';
  };

  const handleUnwatch = async (auctionId, auctionTitle, e) => {
    e.stopPropagation();
    
    try {
      await unwatchAuctionMutation.mutateAsync(auctionId);
      toast.success(`Removed "${auctionTitle}" from watchlist`);
    } catch (error) {
      toast.error('Failed to remove from watchlist');
    }
  };

  const handleAuctionClick = (auctionId) => {
    navigate(`/auctions/${auctionId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold mb-6">My Watchlist</h1>
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold mb-6">My Watchlist</h1>
          <Card className="p-12">
            <div className="text-center">
              <AlertCircle className="h-16 w-16 mx-auto text-destructive mb-4" />
              <h3 className="text-lg font-semibold mb-2">Error loading watchlist</h3>
              <p className="text-muted-foreground mb-4">
                {error?.message || 'Please try again later'}
              </p>
              <Button onClick={() => window.location.reload()}>Retry</Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const watchlist = watchlistData || [];
  const activeAuctions = watchlist.filter(item => 
    ['SCHEDULED', 'STARTED', 'ACTIVE'].includes(item.auction.status)
  );
  const inactiveAuctions = watchlist.filter(item => 
    ['PAUSED', 'ENDED', 'CANCELLED'].includes(item.auction.status)
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">My Watchlist</h1>
            <p className="text-muted-foreground mt-1">
              {watchlist.length} {watchlist.length === 1 ? 'auction' : 'auctions'} watched
            </p>
          </div>
          {watchlist.length > 0 && (
            <Badge variant="secondary" className="text-lg px-4 py-2">
              <Bell className="h-4 w-4 mr-2" />
              {activeAuctions.length} Active
            </Badge>
          )}
        </div>

        {watchlist.length === 0 ? (
          <Card className="p-12">
            <div className="text-center">
              <Bell className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Your watchlist is empty</h3>
              <p className="text-muted-foreground mb-6">
                Start watching auctions to get notified when they start or end
              </p>
              <Button onClick={() => navigate('/listings?tab=auctions')}>
                Browse Auctions
              </Button>
            </div>
          </Card>
        ) : (
          <>
            {/* Active Auctions */}
            {activeAuctions.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">Active Auctions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {activeAuctions.map((item) => {
                    const { auction } = item;
                    const isScheduled = auction.status === 'SCHEDULED';
                    const timeUntilStart = isScheduled ? getTimeUntilStart(auction.startTime) : null;
                    
                    return (
                      <Card
                        key={auction.id}
                        className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
                        onClick={() => handleAuctionClick(auction.id)}
                      >
                        <div className="relative aspect-square bg-muted">
                          <div className="absolute top-2 left-2 z-10">
                            <Badge variant={getStatusVariant(auction.status)} className="text-xs">
                              {auction.status}
                            </Badge>
                          </div>
                          {!isScheduled && (
                            <div className="absolute top-2 right-2 z-10">
                              <Badge variant="secondary" className="bg-black/70 text-white hover:bg-black/80 text-xs">
                                <Clock className="h-3 w-3 mr-1" />
                                {getTimeRemaining(auction.endTime)}
                              </Badge>
                            </div>
                          )}
                          {auction.product?.images?.[0]?.imageUri && (
                            <img
                              src={auction.product.images[0].imageUri}
                              alt={auction.title || auction.product?.title}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        
                        <CardHeader className="p-3 pb-2">
                          <h3 className="font-semibold text-sm truncate">
                            {auction.title || auction.product?.title}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            by {auction.sellerName || 'Seller'}
                          </p>
                        </CardHeader>
                        
                        <CardContent className="p-3 pt-0 pb-2">
                          {isScheduled ? (
                            <div className="space-y-1">
                              <div className="text-lg font-bold">
                                ${auction.startingPrice?.toFixed(2) || '0.00'}
                              </div>
                              <div className="text-xs text-blue-600">
                                {timeUntilStart}
                              </div>
                            </div>
                          ) : auction.highestBidPlaced ? (
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
                        
                        <CardFooter className="p-3 pt-0 flex gap-2">
                          <Button
                            className="flex-1 h-8 text-xs"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAuctionClick(auction.id);
                            }}
                          >
                            View Details
                          </Button>
                          <Button
                            className="h-8 text-xs"
                            size="sm"
                            variant="outline"
                            onClick={(e) => handleUnwatch(auction.id, auction.title || auction.product?.title, e)}
                            disabled={unwatchAuctionMutation.isLoading}
                          >
                            <BellOff className="h-3 w-3" />
                          </Button>
                        </CardFooter>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Inactive Auctions */}
            {inactiveAuctions.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4 text-muted-foreground">
                  Inactive Auctions
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {inactiveAuctions.map((item) => {
                    const { auction } = item;
                    
                    return (
                      <Card
                        key={auction.id}
                        className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer opacity-75"
                        onClick={() => handleAuctionClick(auction.id)}
                      >
                        <div className="relative aspect-square bg-muted">
                          <div className="absolute top-2 left-2 z-10">
                            <Badge variant={getStatusVariant(auction.status)} className="text-xs">
                              {auction.status}
                            </Badge>
                          </div>
                          {auction.product?.images?.[0]?.imageUri && (
                            <img
                              src={auction.product.images[0].imageUri}
                              alt={auction.title || auction.product?.title}
                              className="w-full h-full object-cover grayscale"
                            />
                          )}
                        </div>
                        
                        <CardHeader className="p-3 pb-2">
                          <h3 className="font-semibold text-sm truncate">
                            {auction.title || auction.product?.title}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            by {auction.sellerName || 'Seller'}
                          </p>
                        </CardHeader>
                        
                        <CardContent className="p-3 pt-0 pb-2">
                          <div className="space-y-0.5">
                            <div className="text-lg font-bold">
                              ${auction.highestBidPlaced?.amount?.toFixed(2) || auction.startingPrice?.toFixed(2) || '0.00'}
                            </div>
                            <div className={`text-xs font-medium ${getStatusColor(auction.status)}`}>
                              {auction.status === 'ENDED' ? 'Auction ended' : 
                               auction.status === 'CANCELLED' ? 'Auction cancelled' : 
                               'Auction paused'}
                            </div>
                          </div>
                        </CardContent>
                        
                        <CardFooter className="p-3 pt-0">
                          <Button
                            className="w-full h-8 text-xs"
                            size="sm"
                            variant="outline"
                            onClick={(e) => handleUnwatch(auction.id, auction.title || auction.product?.title, e)}
                            disabled={unwatchAuctionMutation.isLoading}
                          >
                            <BellOff className="h-3 w-3 mr-1" />
                            Remove
                          </Button>
                        </CardFooter>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default WatchlistPage;