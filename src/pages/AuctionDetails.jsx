import { useParams, useNavigate } from 'react-router-dom';
import { useAuction, useBidderBids, useBids, usePauseAuction, useResumeAuction, useCancelAuction, useDeleteAuction } from '../hooks/useAuctions';
import { useProduct } from '../hooks/useProducts';
import { useUser } from '../hooks/useUsers';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Separator } from '../components/ui/separator';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { AuctionCountdown } from '../components/auction/AuctionCountdown';
import { BidForm } from '../components/auction/BidForm';
import { ProxyBidForm } from '../components/auction/ProxyBidForm';
import { BidHistory } from '../components/auction/BidHistory';
import { 
  ArrowLeft, 
  Package, 
  AlertCircle, 
  User, 
  Clock,
  TrendingUp,
  DollarSign,
  Gavel,
  Pause,
  Play,
  XCircle,
  Trash2
} from 'lucide-react';
import { 
  canUserBid, 
  isAuctionActive, 
  formatCurrency, 
  formatEgyptTime,
  getAuctionStatusVariant 
} from '../lib/auctionUtils';
import { useState } from 'react';

const AuctionDetails = () => {
  const { auctionId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [selectedImage, setSelectedImage] = useState(0);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  const pauseAuction = usePauseAuction();
  const resumeAuction = useResumeAuction();
  const cancelAuction = useCancelAuction();
  const deleteAuction = useDeleteAuction();

  // Fetch auction with polling every 2 seconds
  const { data: auction, isLoading: isLoadingAuction, error: auctionError } = useAuction(
    auctionId,
    { enablePolling: true }
  );

  // Fetch product details
  const { data: product, isLoading: isLoadingProduct } = useProduct(auction?.productId);

  // Fetch seller details
  const { data: seller, isLoading: isLoadingSeller } = useUser(auction?.sellerId);

  // Fetch bid history to get user's actual last bid (including proxy bids)
  const { data: bidsData } = useBids(
    auctionId,
    { page: 0, size: 50 },
    { enablePolling: true }
  );

  // Fetch user's bids for this auction (only if authenticated and not owner)
  const { data: userBidsData } = useBidderBids(
    user?.userId,
    { page: 0, size: 100 },
  );

  // Filter bids by current user from the bid history
  const allBids = bidsData?.content || [];
  const userBidsFromHistory = allBids.filter(bid => bid.bidderId === user?.userId);
  
  // Check if user is winning by comparing their ID with the highest bid's bidder ID
  const isUserWinning = auction?.highestBidPlaced?.bidderId === user?.userId;
  
  // Get user's last bid:
  // - If winning: show the highest bid (which is theirs)
  // - If not winning but has bids: show their most recent bid from history (includes proxy bids)
  // - Otherwise: null
  const userLastBid = isUserWinning 
    ? auction.highestBidPlaced 
    : (userBidsFromHistory.length > 0 ? userBidsFromHistory[0] : null); // First item is most recent due to sorting

  const isLoading = isLoadingAuction || isLoadingProduct;
  const userCanBid = canUserBid(auction, user?.userId);
  const isOwner = user?.userId === auction?.sellerId;
  const auctionActive = isAuctionActive(auction);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Loading auction details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (auctionError || !auction) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Card className="border-destructive">
          <CardContent className="pt-6 text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
            <div>
              <h3 className="font-semibold text-lg">Error Loading Auction</h3>
              <p className="text-sm text-muted-foreground mt-2">
                {auctionError?.message || 'Auction not found'}
              </p>
            </div>
            <Button onClick={() => navigate('/listings')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Listings
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasImages = product?.images && product.images.length > 0;
  const displayImage = hasImages ? product.images[selectedImage]?.imageUri : null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Back Button */}
      <Button 
        variant="ghost" 
        onClick={() => navigate(-1)}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left Column - Product Images */}
        <div className="space-y-4">
          <Card className="overflow-hidden">
            <div className="aspect-square relative bg-muted">
              {displayImage ? (
                <img 
                  src={displayImage}
                  alt={auction.title}
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Package className="h-24 w-24 text-muted-foreground" />
                </div>
              )}
            </div>
          </Card>

          {/* Thumbnail Grid */}
          {hasImages && product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {product.images.map((image, idx) => (
                <button
                  key={image.imageId}
                  onClick={() => setSelectedImage(idx)}
                  className={`aspect-square relative bg-muted rounded-lg overflow-hidden border-2 transition-colors ${
                    selectedImage === idx
                      ? 'border-primary'
                      : 'border-transparent hover:border-muted-foreground/50'
                  }`}
                >
                  <img 
                    src={image.imageUri}
                    alt={`${auction.title} view ${idx + 1}`}
                    className="object-cover w-full h-full"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Product Description */}
          {product && (
            <Card>
              <CardHeader>
                <CardTitle>Product Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {product.category && (
                  <div>
                    <p className="text-sm text-muted-foreground">Category</p>
                    <Badge variant="secondary">{product.category.name}</Badge>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Description</p>
                  <p className="text-sm leading-relaxed">{product.description}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Auction Info & Bidding */}
        <div className="space-y-6">
          {/* Auction Header */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Badge variant={getAuctionStatusVariant(auction.status)}>
                {auction.status}
              </Badge>
              <AuctionCountdown 
                endTime={auction.endTime} 
                status={auction.status}
              />
            </div>
            
            <h1 className="text-3xl font-bold mb-4">{auction.title}</h1>

            {/* Seller Info - Compact */}
            {seller && (
              <div className="flex items-center gap-2 text-sm mb-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={seller.avatar} alt={seller.username} />
                  <AvatarFallback className="text-xs">
                    {seller.username?.substring(0, 2).toUpperCase() || <User className="h-3 w-3" />}
                  </AvatarFallback>
                </Avatar>
                <span className="text-muted-foreground">Sold by</span>
                <span className="font-medium">{seller.username || seller.email}</span>
              </div>
            )}

            {/* Auction Times - Compact */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>Starts: {formatEgyptTime(auction.startTime, 'MMM dd, h:mm a')}</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>Ends: {formatEgyptTime(auction.endTime, 'MMM dd, h:mm a')}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Current Bid Info */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Gavel className="h-4 w-4" />
                    Current Highest Bid
                  </p>
                  {auction.highestBidPlaced ? (
                    <p className="text-3xl font-bold mt-1">
                      {formatCurrency(auction.highestBidPlaced.amount)}
                    </p>
                  ) : (
                    <div className="mt-1">
                      <p className="text-lg font-semibold text-muted-foreground">No bids yet</p>
                      <p className="text-xs text-muted-foreground">Starting at {formatCurrency(auction.startingPrice)}</p>
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <TrendingUp className="h-4 w-4" />
                    Starting Price
                  </p>
                  <p className="text-xl font-semibold mt-1">
                    {formatCurrency(auction.startingPrice)}
                  </p>
                </div>
              </div>
              
              <Separator className="my-4" />
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Bid Increment</p>
                  <p className="font-medium">{formatCurrency(auction.bidIncrement)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Reserve Price</p>
                  <p className="font-medium">
                    {auction.reservePrice ? formatCurrency(auction.reservePrice) : 'None'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User's Last Bid Status */}
          {isAuthenticated && userLastBid && !isOwner && (
            <Card className={isUserWinning ? "border-green-500 bg-green-500/5" : "border-yellow-500 bg-yellow-500/5"}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-full ${isUserWinning ? 'bg-green-500' : 'bg-yellow-500'}`}>
                    <Gavel className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">
                      {isUserWinning ? '🎉 You are winning!' : 'Your Last Bid'}
                    </h3>
                    <p className="text-2xl font-bold mb-2">
                      {formatCurrency(userLastBid.amount)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {isUserWinning 
                        ? 'You have the highest bid. Keep monitoring the auction!' 
                        : 'You have been outbid. Place a higher bid to win!'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Bidding Section */}
          {!isAuthenticated && auctionActive && (
            <Card className="border-primary">
              <CardContent className="pt-6 text-center space-y-4">
                <Info className="h-12 w-12 text-primary mx-auto" />
                <div>
                  <h3 className="font-semibold text-lg">Sign in to Bid</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    You must be logged in to place bids
                  </p>
                </div>
                <Button onClick={() => navigate('/login')} className="w-full">
                  Sign In
                </Button>
              </CardContent>
            </Card>
          )}

          {isAuthenticated && isOwner && (
            <Card className="border-blue-500/50 bg-blue-500/5">
              <CardContent className="pt-6">
                <div className="flex flex-col gap-3">
                  <h3 className="text-sm font-medium text-center mb-2">Auction Management</h3>
                  
                  {/* Pause button - Only for STARTED status */}
                  {auction.status === 'STARTED' && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => pauseAuction.mutate(auctionId, {
                        onSuccess: () => {
                          // Auction data will auto-refresh from polling
                        }
                      })}
                      disabled={pauseAuction.isPending}
                    >
                      <Pause className="h-4 w-4 mr-2" />
                      {pauseAuction.isPending ? 'Pausing...' : 'Pause Auction'}
                    </Button>
                  )}
                  
                  {/* Resume button - Only for PAUSED status */}
                  {auction.status === 'PAUSED' && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => resumeAuction.mutate(auctionId, {
                        onSuccess: () => {
                          // Auction data will auto-refresh from polling
                        }
                      })}
                      disabled={resumeAuction.isPending}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      {resumeAuction.isPending ? 'Resuming...' : 'Resume Auction'}
                    </Button>
                  )}
                  
                  {/* Cancel button - Only for SCHEDULED or STARTED status */}
                  {(auction.status === 'SCHEDULED' || auction.status === 'STARTED') && (
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={() => setCancelDialogOpen(true)}
                      disabled={cancelAuction.isPending}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      {cancelAuction.isPending ? 'Cancelling...' : 'Cancel Auction'}
                    </Button>
                  )}
                  
                  {/* Show informational message for statuses with no actions */}
                  {auction.status === 'ACTIVE' && (
                    <p className="text-sm text-muted-foreground text-center">
                      Auction is active with bids. No management actions available.
                    </p>
                  )}
                  {auction.status === 'ENDED' && (
                    <p className="text-sm text-muted-foreground text-center">
                      Auction has ended. No management actions available.
                    </p>
                  )}
                  {auction.status === 'CANCELLED' && (
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={() => setDeleteDialogOpen(true)}
                      disabled={deleteAuction.isPending}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {deleteAuction.isPending ? 'Deleting...' : 'Delete Auction'}
                    </Button>
                  )}
                  
                  {/* Error messages */}
                  {(pauseAuction.isError || resumeAuction.isError || cancelAuction.isError || deleteAuction.isError) && (
                    <div className="flex items-center gap-2 text-sm text-destructive">
                      <AlertCircle className="h-4 w-4" />
                      <span>
                        {pauseAuction.error?.message || 
                         resumeAuction.error?.message || 
                         cancelAuction.error?.message || 
                         deleteAuction.error?.message ||
                         'An error occurred'}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {isAuthenticated && userCanBid && (
            <Tabs defaultValue="manual" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="manual">Manual Bid</TabsTrigger>
                <TabsTrigger value="proxy">Auto Bid</TabsTrigger>
              </TabsList>
              <TabsContent value="manual">
                <BidForm auction={auction} userId={user.userId} />
              </TabsContent>
              <TabsContent value="proxy">
                <ProxyBidForm auction={auction} userId={user.userId} />
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>

      {/* Bid History Section */}
      <div className="mt-8">
        <BidHistory 
          auctionId={auction.id} 
          highestBidId={auction.highestBidPlaced?.id}
          currentUserId={user?.userId}
        />
      </div>

      {/* Cancel Auction Confirmation Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Auction</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel "{product?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancelDialogOpen(false)}
              disabled={cancelAuction.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                cancelAuction.mutate(auctionId, {
                  onSuccess: () => {
                    setCancelDialogOpen(false);
                    // Auction data will auto-refresh from polling
                  }
                });
              }}
              disabled={cancelAuction.isPending}
            >
              {cancelAuction.isPending ? 'Cancelling...' : 'Cancel Auction'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Auction Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Auction</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{product?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleteAuction.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                deleteAuction.mutate(auctionId, {
                  onSuccess: () => {
                    setDeleteDialogOpen(false);
                    // Navigate back to listings page, auctions tab
                    navigate('/listings?tab=auctions');
                  }
                });
              }}
              disabled={deleteAuction.isPending}
            >
              {deleteAuction.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AuctionDetails;
