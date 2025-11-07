import { useState, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useDeleteProduct, useProduct, useProducts } from '../hooks/useProducts';
import { 
  useAuctions, 
  usePauseAuction, 
  useResumeAuction, 
  useCancelAuction,
  useDeleteAuction 
} from '../hooks/useAuctions';
import { useInventoryItem, useDeleteInventoryItem } from '../hooks/useInventory';
import { useUser } from '../hooks/useUsers';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { 
  Package, 
  Pencil, 
  Trash2, 
  Plus, 
  AlertCircle, 
  Eye,
  ListPlus,
  ListX,
  RefreshCw,
  PlayCircle,
  PauseCircle,
  XCircle,
  Clock,
  TrendingUp,
  Loader2,
  User,
  ShoppingBag,
  Gavel,
  Sparkles,
  Store,
  Tag
} from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { useEffect } from 'react';
import { EditAuctionSheet } from '../components/EditAuctionSheet';
import { EditFixedPriceSheet } from '../components/EditFixedPriceSheet';
import { EditProductSheet } from '../components/EditProductSheet';
import { formatAuctionStatus } from '../lib/auctionUtils';


export const MyListingsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  
  // Get active tab from URL or default to 'fixed'
  const activeTab = searchParams.get('tab') || 'fixed';

  // Reset to default tab when navigating with clean URL (no params)
  useEffect(() => {
    const hasParams = searchParams.toString().length > 0;
    if (!hasParams && activeTab !== 'fixed') {
      // Silently reset to fixed tab without updating URL
      setSearchParams({ tab: 'fixed' }, { replace: true });
    }
  }, []);
  
  // Fetch all user's products
  const { data: productsData, isLoading: productsLoading, error: productsError } = useProducts(
    { sellerId: user.userId }, 
    { size: 1000 } // Get all products for now
  );

  // Fetch all user's auctions
  const { data: auctionsData, isLoading: auctionsLoading, error: auctionsError } = useAuctions(
    { sellerId: user.userId }, 
    { size: 1000 }
  );

  const deleteProduct = useDeleteProduct();
  const deleteAuction = useDeleteAuction();
  const deleteInventory = useDeleteInventoryItem();
  const pauseAuction = usePauseAuction();
  const resumeAuction = useResumeAuction();
  const cancelAuction = useCancelAuction();
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  
  // Edit states
  const [editAuctionOpen, setEditAuctionOpen] = useState(false);
  const [auctionToEdit, setAuctionToEdit] = useState(null);
  
  const [editFixedPriceOpen, setEditFixedPriceOpen] = useState(false);
  const [fixedPriceToEdit, setFixedPriceToEdit] = useState(null);
  
  const [editProductOpen, setEditProductOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState(null);
  
  // Fetch inventory for fixed price items being edited
  const { data: fixedPriceInventory } = useInventoryItem(fixedPriceToEdit?.productId);
  
  // Track items being deleted for optimistic UI updates
  const [deletingAuctionIds, setDeletingAuctionIds] = useState(new Set());
  const [unlistingProductIds, setUnlistingProductIds] = useState(new Set());

  // Extract data from API responses
  const allProducts = productsData?.content || [];
  const allAuctions = auctionsData?.content || [];

  // Categorize products by type
  const fixedPriceProducts = useMemo(() => 
    allProducts.filter(p => p.type === 'FIXED'),
    [allProducts]
  );

  const auctionProducts = useMemo(() => 
    allProducts.filter(p => p.type === 'AUCTION'),
    [allProducts]
  );

  const unlistedProducts = useMemo(() => 
    allProducts.filter(p => p.type === 'NONE'),
    [allProducts]
  );

  // Categorize auctions by status
  const upcomingAuctions = useMemo(() => 
    allAuctions.filter(a => a.status === 'SCHEDULED'),
    [allAuctions]
  );

  const activeAuctions = useMemo(() => 
    allAuctions.filter(a => ['STARTED', 'ACTIVE'].includes(a.status)),
    [allAuctions]
  );

  const pausedAuctions = useMemo(() => 
    allAuctions.filter(a => a.status === 'PAUSED'),
    [allAuctions]
  );

  const endedAuctions = useMemo(() => 
    allAuctions.filter(a => a.status === 'ENDED'),
    [allAuctions]
  );

  const cancelledAuctions = useMemo(() => 
    allAuctions.filter(a => a.status === 'CANCELLED'),
    [allAuctions]
  );

  const invalidAuctions = useMemo(() => 
    allAuctions.filter(a => a.status === 'INVALID'),
    [allAuctions]
  );

  const completedAuctions = useMemo(() => 
    allAuctions.filter(a => a.status === 'COMPLETED'),
    [allAuctions]
  );

  const handleTabChange = (value) => {
    setSearchParams({ tab: value });
  };

  const handleDeleteClick = (item, type) => {
    setItemToDelete({ item, type });
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (itemToDelete) {
      try {
        if (itemToDelete.type === 'product') {
          await deleteProduct.mutateAsync(itemToDelete.item.productId);
          toast.success('Product deleted successfully');
        } else if (itemToDelete.type === 'auction') {
          console.log('Deleting auction:', itemToDelete.item.id);
          await deleteAuction.mutateAsync(itemToDelete.item.id);
          toast.success('Auction deleted successfully');
          
          console.log('Waiting for backend to process event...');
          // Give backend time to process the event and update the product
          setTimeout(async () => {
            console.log('Refetching products and auctions...');
            await Promise.all([
              queryClient.invalidateQueries({ queryKey: ['products'], refetchType: 'active' }),
              queryClient.invalidateQueries({ queryKey: ['auctions'], refetchType: 'active' })
            ]);
            console.log('Queries invalidated');
          }, 5000); // Increased delay to 5 seconds
        }
        setDeleteDialogOpen(false);
        setItemToDelete(null);
      } catch (error) {
        toast.error('Failed to delete item');
        console.error('Failed to delete:', error);
      }
    }
  };

  // Action handlers for auctions
  const handlePauseAuction = async (auctionId) => {
    try {
      await pauseAuction.mutateAsync(auctionId);
      toast.success('Auction paused successfully');
    } catch (error) {
      toast.error('Failed to pause auction');
      console.error('Failed to pause auction:', error);
    }
  };

  const handleResumeAuction = async (auctionId) => {
    try {
      await resumeAuction.mutateAsync(auctionId);
      toast.success('Auction resumed successfully');
    } catch (error) {
      toast.error('Failed to resume auction');
      console.error('Failed to resume auction:', error);
    }
  };

  const handleCancelAuction = async (auctionId) => {
    try {
      await cancelAuction.mutateAsync(auctionId);
      toast.success('Auction cancelled successfully');
      
      // Give backend time to process the event
      setTimeout(async () => {
        await queryClient.invalidateQueries({ queryKey: ['auctions'], refetchType: 'active' });
      }, 500);
    } catch (error) {
      toast.error('Failed to cancel auction');
      console.error('Failed to cancel auction:', error);
    }
  };

  // Action handler for unlisting fixed-price products
  const handleUnlistProduct = async (productId) => {
    try {
      console.log('Unlisting product:', productId);
      await deleteInventory.mutateAsync(productId);
      toast.success('Product unlisted successfully');
      
      console.log('Waiting for backend to process event...');
      // Give backend time to process the event and update the product
      setTimeout(async () => {
        console.log('Refetching products and inventory...');
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['products'], refetchType: 'active' }),
          queryClient.invalidateQueries({ queryKey: ['inventory'], refetchType: 'active' })
        ]);
        console.log('Queries invalidated');
      }, 5000); // Increased delay to 5 seconds
    } catch (error) {
      toast.error('Failed to unlist product');
      console.error('Failed to unlist product:', error);
    }
  };

  // Handler for relisting an auction
  const handleRelistAuction = async (auction) => {
    try {
      // First, delete the old auction
      await deleteAuction.mutateAsync(auction.id);
      
      // Prepare relist data (without start/end times)
      const relistData = {
        title: auction.title,
        startingPrice: auction.startingPrice,
        reservePrice: auction.reservePrice,
        bidIncrement: auction.bidIncrement,
      };
      
      // Navigate to create-item with step 2 (form), productId, type auction, and relist data
      const params = new URLSearchParams({
        step: '2',
        productId: auction.productId,
        type: 'auction',
        relist: encodeURIComponent(JSON.stringify(relistData))
      });
      
      toast.success('Auction deleted. Create your new listing.');
      navigate(`/create-item?${params.toString()}`);
    } catch (error) {
      toast.error('Failed to delete auction for relisting');
      console.error('Failed to relist auction:', error);
    }
  };

  // Edit handlers
  const handleEditAuction = (auction) => {
    setAuctionToEdit(auction);
    setEditAuctionOpen(true);
  };

  const handleEditFixedPrice = (product) => {
    setFixedPriceToEdit(product);
    setEditFixedPriceOpen(true);
  };

  const handleEditProduct = (product) => {
    setProductToEdit(product);
    setEditProductOpen(true);
  };

  const isLoading = productsLoading || auctionsLoading;
  const error = productsError || auctionsError;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold mb-6">My Listings</h1>
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold mb-6">My Listings</h1>
          <Card className="p-12">
            <div className="text-center">
              <AlertCircle className="h-16 w-16 mx-auto text-destructive mb-4" />
              <h3 className="text-lg font-semibold mb-2">Error Loading Listings</h3>
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

  const totalListings = fixedPriceProducts.length + allAuctions.length + unlistedProducts.length;

  if (totalListings === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold mb-6">My Listings</h1>
          <Card className="p-12">
            <div className="text-center">
              <Package className="h-24 w-24 text-muted-foreground mx-auto opacity-50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Listings Yet</h3>
              <p className="text-muted-foreground mb-6">
                Start selling by creating your first product listing
              </p>
              <Button asChild size="lg">
                <Link to="/create-item">
                  <Plus className="mr-2 h-5 w-5" />
                  Create Listing
                </Link>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-gradient-to-b from-muted/30 to-background">
        <div className="container mx-auto px-4 py-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div className="text-left">
                <h1 className="text-3xl font-bold">
                  My Listings
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Manage your products and auctions
                </p>
              </div>
              <Button asChild size="lg" className="hover:scale-105 transition-transform">
                <Link to="/create-item">
                  <Plus className="mr-2 h-5 w-5" />
                  Create Listing
                </Link>
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full flex justify-center">
            <TabsList className="grid max-w-lg grid-cols-3 h-12 p-1 bg-muted/50">
              <TabsTrigger 
                value="fixed"
                className="relative data-[state=active]:bg-background data-[state=active]:shadow-md transition-all duration-200 h-full rounded-md font-semibold"
              >
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  <span>Fixed Price</span>
                  <Badge 
                    variant={activeTab === 'fixed' ? 'default' : 'secondary'} 
                    className="ml-1 transition-all duration-200 font-bold"
                  >
                    {fixedPriceProducts.length}
                  </Badge>
                </div>
                {activeTab === 'fixed' && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-primary rounded-t-full" />
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="auctions"
                className="relative data-[state=active]:bg-background data-[state=active]:shadow-md transition-all duration-200 h-full rounded-md font-semibold"
              >
                <div className="flex items-center gap-2">
                  <Gavel className="h-4 w-4" />
                  <span>Auctions</span>
                  <Badge 
                    variant={activeTab === 'auctions' ? 'default' : 'secondary'} 
                    className="ml-1 transition-all duration-200 font-bold"
                  >
                    {allAuctions.length}
                  </Badge>
                </div>
                {activeTab === 'auctions' && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-primary rounded-t-full" />
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="unlisted"
                className="relative data-[state=active]:bg-background data-[state=active]:shadow-md transition-all duration-200 h-full rounded-md font-semibold"
              >
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  <span>Unlisted</span>
                  <Badge 
                    variant={activeTab === 'unlisted' ? 'default' : 'secondary'} 
                    className="ml-1 transition-all duration-200 font-bold"
                  >
                    {unlistedProducts.length}
                  </Badge>
                </div>
                {activeTab === 'unlisted' && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-primary rounded-t-full" />
                )}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab}>
          {/* Fixed Price Tab */}
          <TabsContent value="fixed" className="mt-0">
            {fixedPriceProducts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {fixedPriceProducts.map(product => (
                  <FixedPriceCard
                    key={product.productId}
                    product={product}
                    onDelete={handleDeleteClick}
                    onUnlist={handleUnlistProduct}
                    onEdit={handleEditFixedPrice}
                  />
                ))}
              </div>
            ) : (
              <EmptyState 
                icon={Package}
                title="No Fixed Price Listings"
                description="Create a fixed price listing to start selling"
              />
            )}
          </TabsContent>

          {/* Auctions Tab */}
          <TabsContent value="auctions" className="mt-0">
            {allAuctions.length > 0 ? (
              <div className="space-y-8">
                {/* Active Auctions */}
                {activeAuctions.length > 0 && (
                  <AuctionSection
                    title="Active"
                    auctions={activeAuctions}
                    onDelete={handleDeleteClick}
                    onPause={handlePauseAuction}
                    onResume={handleResumeAuction}
                    onCancel={handleCancelAuction}
                    onRelist={handleRelistAuction}
                    onEdit={handleEditAuction}
                  />
                )}

                {/* Upcoming Auctions */}
                {upcomingAuctions.length > 0 && (
                  <AuctionSection
                    title="Upcoming"
                    auctions={upcomingAuctions}
                    onDelete={handleDeleteClick}
                    onPause={handlePauseAuction}
                    onResume={handleResumeAuction}
                    onCancel={handleCancelAuction}
                    onRelist={handleRelistAuction}
                    onEdit={handleEditAuction}
                  />
                )}

                {/* Paused Auctions */}
                {pausedAuctions.length > 0 && (
                  <AuctionSection
                    title="Paused"
                    auctions={pausedAuctions}
                    onDelete={handleDeleteClick}
                    onPause={handlePauseAuction}
                    onResume={handleResumeAuction}
                    onCancel={handleCancelAuction}
                    onRelist={handleRelistAuction}
                    onEdit={handleEditAuction}
                  />
                )}

                {/* Cancelled Auctions */}
                {cancelledAuctions.length > 0 && (
                  <AuctionSection
                    title="Cancelled"
                    auctions={cancelledAuctions}
                    onDelete={handleDeleteClick}
                    onPause={handlePauseAuction}
                    onResume={handleResumeAuction}
                    onCancel={handleCancelAuction}
                    onRelist={handleRelistAuction}
                    onEdit={handleEditAuction}
                  />
                )}

                {/* Invalid Auctions */}
                {invalidAuctions.length > 0 && (
                  <AuctionSection
                    title="Invalid"
                    auctions={invalidAuctions}
                    onDelete={handleDeleteClick}
                    onPause={handlePauseAuction}
                    onResume={handleResumeAuction}
                    onCancel={handleCancelAuction}
                    onRelist={handleRelistAuction}
                    onEdit={handleEditAuction}
                  />
                )}

                {/* Completed Auctions */}
                {completedAuctions.length > 0 && (
                  <AuctionSection
                    title="Completed"
                    auctions={completedAuctions}
                    onDelete={handleDeleteClick}
                    onPause={handlePauseAuction}
                    onResume={handleResumeAuction}
                    onCancel={handleCancelAuction}
                    onRelist={handleRelistAuction}
                    onEdit={handleEditAuction}
                  />
                )}

                {/* Ended Auctions */}
                {endedAuctions.length > 0 && (
                  <AuctionSection
                    title="Ended"
                    auctions={endedAuctions}
                    onDelete={handleDeleteClick}
                    onPause={handlePauseAuction}
                    onResume={handleResumeAuction}
                    onCancel={handleCancelAuction}
                    onRelist={handleRelistAuction}
                    onEdit={handleEditAuction}
                  />
                )}
              </div>
            ) : (
              <EmptyState 
                icon={Clock}
                title="No Auctions"
                description="Create an auction listing to start"
              />
            )}
          </TabsContent>

          {/* Unlisted Tab */}
          <TabsContent value="unlisted" className="mt-0">
            {unlistedProducts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {unlistedProducts.map(product => (
                  <UnlistedProductCard
                    key={product.productId}
                    product={product}
                    onDelete={handleDeleteClick}
                    onEdit={handleEditProduct}
                  />
                ))}
              </div>
            ) : (
              <EmptyState 
                icon={Package}
                title="No Unlisted Products"
                description="Unlisted products will appear here"
              />
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Sheets */}
      <EditAuctionSheet
        auction={auctionToEdit}
        open={editAuctionOpen}
        onOpenChange={setEditAuctionOpen}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['auctions'] });
          queryClient.invalidateQueries({ queryKey: ['products'] });
        }}
      />

      <EditFixedPriceSheet
        product={fixedPriceToEdit}
        inventory={fixedPriceInventory}
        open={editFixedPriceOpen}
        onOpenChange={setEditFixedPriceOpen}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['products'] });
          queryClient.invalidateQueries({ queryKey: ['inventory'] });
        }}
      />

      <EditProductSheet
        product={productToEdit}
        open={editProductOpen}
        onOpenChange={setEditProductOpen}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {itemToDelete?.type === 'auction' ? 'Auction' : 'Product'}</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{itemToDelete?.item?.title || itemToDelete?.item?.product?.title}"? 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleteProduct.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteProduct.isPending}
            >
              {deleteProduct.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Helper Components
const EmptyState = ({ icon: Icon, title, description }) => (
  <Card className="p-16 border-2 border-dashed">
    <div className="text-center">
      <div className="inline-flex p-4 rounded-full bg-muted/50 mb-4">
        <Icon className="h-12 w-12 text-muted-foreground/50" />
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-6">{description}</p>
      <Button asChild variant="outline" size="lg" className="group">
        <Link to="/create-item">
          <Sparkles className="mr-2 h-4 w-4 group-hover:animate-spin" />
          Create Your First Listing
        </Link>
      </Button>
    </div>
  </Card>
);

const AuctionSection = ({ title, auctions, onDelete, onPause, onResume, onCancel, onRelist, onEdit }) => {
  const getIcon = (title) => {
    switch(title) {
      case 'Active': return <PlayCircle className="h-5 w-5 text-green-600" />;
      case 'Upcoming': return <Clock className="h-5 w-5 text-blue-600" />;
      case 'Paused': return <PauseCircle className="h-5 w-5 text-yellow-600" />;
      case 'Cancelled': return <XCircle className="h-5 w-5 text-red-600" />;
      case 'Invalid': return <AlertCircle className="h-5 w-5 text-orange-600" />;
      case 'Completed': return <Sparkles className="h-5 w-5 text-green-600" />;
      case 'Ended': return <TrendingUp className="h-5 w-5 text-purple-600" />;
      default: return null;
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b">
        {getIcon(title)}
        <h2 className="text-2xl font-bold">{title}</h2>
        <Badge variant="secondary" className="ml-2">{auctions.length}</Badge>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {auctions.map(auction => (
          <AuctionCard
            key={auction.id}
            auction={auction}
            onDelete={onDelete}
            onPause={onPause}
            onResume={onResume}
            onCancel={onCancel}
            onRelist={onRelist}
            onEdit={onEdit}
          />
        ))}
      </div>
    </div>
  );
};

const FixedPriceCard = ({ product, onDelete, onUnlist, onEdit }) => {
  const navigate = useNavigate();
  const { data: inventory } = useInventoryItem(product.productId);
  const { data: seller } = useUser(product.sellerId);
  const stock = inventory ? (inventory.totalQuantity - inventory.reservedQuantity) : 0;

  return (
    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group border-2 hover:border-primary/50 hover:scale-[1.02]">
      <div 
        className="relative aspect-square bg-gradient-to-br from-muted to-muted/50"
        onClick={() => navigate(`/fixed-price/${product.productId}`)}
      >
        {product.images?.[0]?.imageUri ? (
          <img 
            src={product.images[0].imageUri} 
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingBag className="h-16 w-16 text-muted-foreground/30" />
          </div>
        )}
        <div className="absolute top-3 right-3 z-10">
          <Badge 
            variant={stock > 0 ? 'secondary' : 'destructive'} 
            className="shadow-lg backdrop-blur-sm font-semibold"
          >
            {stock} in stock
          </Badge>
        </div>
        {/* Gradient Overlay */}
        <div className="absolute inset-x-0 -bottom-4 h-full bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      
      <CardHeader className="p-4 pb-3 space-y-2">
        <h3 className="font-bold text-base line-clamp-2 group-hover:text-primary transition-colors">
          {product.title}
        </h3>
        {seller && (
          <div className="flex items-center gap-2 text-xs">
            <Avatar className="h-6 w-6 border-2 border-background shadow-sm">
              <AvatarImage src={seller.personalPhoto} alt={seller.name || seller.username} />
              <AvatarFallback className="text-[10px] font-medium">
                {(seller.name || seller.firstName || seller.username)?.substring(0, 2).toUpperCase() || <User className="h-3 w-3" />}
              </AvatarFallback>
            </Avatar>
            <span className="text-muted-foreground">by you</span>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="p-4 pt-0 pb-3">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold">
            ${product.price?.toFixed(2) || '0.00'}
          </span>
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0 flex gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                className="flex-1 h-9 font-semibold group-hover:shadow-md transition-shadow" 
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/fixed-price/${product.productId}`);
                }}
              >
                <Eye className="h-4 w-4 mr-1" />
                View
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>View product details</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                className="h-9 hover:bg-primary/10 hover:text-primary transition-colors" 
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(product);
                }}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Edit product & inventory</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                className="h-9 hover:bg-orange-500/10 hover:text-orange-600 transition-colors" 
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onUnlist(product.productId);
                }}
              >
                <ListX className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Unlist from marketplace</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                className="h-9 hover:bg-destructive/10 hover:text-destructive transition-colors" 
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(product, 'product');
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Delete product</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </CardFooter>
    </Card>
  );
};

const AuctionCard = ({ auction, onDelete, onPause, onResume, onCancel, onRelist, onEdit }) => {
  const navigate = useNavigate();
  const { data: seller } = useUser(auction.sellerId);
  
  const getTimeRemaining = (endTime) => {
    const diff = new Date(endTime) - new Date();
    if (diff <= 0) return 'Ended';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  };

  const getStatusVariant = (status) => {
    const variants = {
      SCHEDULED: 'secondary',
      STARTED: 'default',
      ACTIVE: 'default',
      PAUSED: 'outline',
      ENDED: 'destructive',
      CANCELLED: 'destructive',
      INVALID: 'destructive',
      COMPLETED: 'default'
    };
    return variants[status] || 'secondary';
  };

  const getStatusIcon = (status) => {
    const icons = {
      SCHEDULED: <Clock className="h-3 w-3 mr-1" />,
      STARTED: <PlayCircle className="h-3 w-3 mr-1" />,
      ACTIVE: <PlayCircle className="h-3 w-3 mr-1" />,
      PAUSED: <PauseCircle className="h-3 w-3 mr-1" />,
      ENDED: <TrendingUp className="h-3 w-3 mr-1" />,
      CANCELLED: <XCircle className="h-3 w-3 mr-1" />,
      INVALID: <AlertCircle className="h-3 w-3 mr-1" />,
      COMPLETED: <Sparkles className="h-3 w-3 mr-1" />
    };
    return icons[status] || null;
  };

  const isActive = ['STARTED', 'ACTIVE'].includes(auction.status);
  const isPaused = auction.status === 'PAUSED';
  const isScheduled = auction.status === 'SCHEDULED';
  const isEnded = auction.status === 'ENDED';
  const isCancelledOrInvalidOrCompleted = ['CANCELLED', 'INVALID', 'COMPLETED'].includes(auction.status);
  const { data: productData } = useProduct(auction.productId);

  return (
    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group border-2 hover:border-primary/50 hover:scale-[1.02]">
      <div 
        className="relative aspect-square bg-gradient-to-br from-muted to-muted/50"
        onClick={() => navigate(`/auctions/${auction.id}`)}
      >
        <div className="absolute top-3 left-3 z-10">
          <Badge variant={getStatusVariant(auction.status)} className="text-xs font-semibold shadow-lg">
            {getStatusIcon(auction.status)}
            {formatAuctionStatus(auction.status)}
          </Badge>
        </div>
        {isActive && (
          <div className="absolute top-3 right-3 z-10">
            <Badge variant="secondary" className="bg-black/80 text-white hover:bg-black text-xs font-semibold shadow-lg backdrop-blur-sm">
              <Clock className="h-3 w-3 mr-1" />
              {getTimeRemaining(auction.endTime)}
            </Badge>
          </div>
        )}
        {productData?.images?.[0]?.imageUri ? (
          <img 
            src={productData.images[0].imageUri} 
            alt={auction.title || productData?.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Gavel className="h-16 w-16 text-muted-foreground/30" />
          </div>
        )}
        {/* Gradient Overlay */}
        <div className="absolute inset-x-0 -bottom-4 h-full bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      
      <CardHeader className="p-4 pb-3 space-y-2">
        <h3 className="font-bold text-base line-clamp-2 group-hover:text-primary transition-colors">
          {auction.title || auction.product?.title}
        </h3>
        {seller && (
          <div className="flex items-center gap-2 text-xs">
            <Avatar className="h-6 w-6 border-2 border-background shadow-sm">
              <AvatarImage src={seller.personalPhoto} alt={seller.name || seller.username} />
              <AvatarFallback className="text-[10px] font-medium">
                {(seller.name || seller.firstName || seller.username)?.substring(0, 2).toUpperCase() || <User className="h-3 w-3" />}
              </AvatarFallback>
            </Avatar>
            <span className="text-muted-foreground">by you</span>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="p-4 pt-0 pb-3">
        {auction.highestBidPlaced ? (
          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">
                ${auction.highestBidPlaced.amount?.toFixed(2) || '0.00'}
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs text-green-600">
              <TrendingUp className="h-3 w-3" />
              <span className="font-medium">Current bid</span>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">
                ${auction.startingPrice?.toFixed(2) || '0.00'}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">Starting bid</div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="p-4 pt-0 flex flex-wrap gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                className="flex-1 h-9 text-sm min-w-[80px] font-semibold group-hover:shadow-md transition-shadow" 
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/auctions/${auction.id}`);
                }}
              >
                <Eye className="h-4 w-4 mr-1" />
                View
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>View auction details</p>
            </TooltipContent>
          </Tooltip>
          
          {/* Edit button - only for scheduled auctions */}
          {isScheduled && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  className="h-9 hover:bg-primary/10 hover:text-primary transition-colors" 
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(auction);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Edit auction settings</p>
              </TooltipContent>
            </Tooltip>
          )}
          
          {/* Edit button disabled for ended/cancelled/invalid/completed auctions */}
          {(isEnded || isCancelledOrInvalidOrCompleted) && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button 
                    className="h-9" 
                    size="sm"
                    variant="outline"
                    disabled
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Cannot edit {isEnded ? 'ended' : 'cancelled/invalid/completed'} auctions</p>
              </TooltipContent>
            </Tooltip>
          )}
          
          {isPaused && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  className="h-8 text-xs" 
                  size="sm"
                  variant="outline"
                  onClick={() => onResume(auction.id)}
                >
                  <PlayCircle className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Resume auction</p>
              </TooltipContent>
            </Tooltip>
          )}
          
          {!isEnded && !isCancelledOrInvalidOrCompleted && !isActive && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  className="h-8 text-xs" 
                  size="sm"
                  variant="outline"
                  onClick={() => onCancel(auction.id)}
                >
                  <XCircle className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Cancel auction</p>
              </TooltipContent>
            </Tooltip>
          )}
          
          {(isEnded || isCancelledOrInvalidOrCompleted) && (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    className="h-8 text-xs" 
                    size="sm"
                    variant="outline"
                    onClick={() => onRelist(auction)}
                  >
                    <RefreshCw className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Relist as new auction</p>
                </TooltipContent>
              </Tooltip>
            </>
          )}
          
          {(isScheduled || isCancelledOrInvalidOrCompleted) && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  className="h-8 text-xs" 
                  size="sm"
                  variant="destructive"
                  onClick={() => onDelete(auction, 'auction')}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Delete auction</p>
              </TooltipContent>
            </Tooltip>
          )}
        </TooltipProvider>
      </CardFooter>
    </Card>
  );
};

const UnlistedProductCard = ({ product, onDelete, onEdit }) => {
  const navigate = useNavigate();
  const { data: seller } = useUser(product.sellerId);

  return (
    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 group border-2 hover:border-orange-500/50 hover:scale-[1.02] opacity-75 hover:opacity-100">
      <div 
        className="relative aspect-square bg-gradient-to-br from-muted to-muted/50"
      >
        {product.images?.[0]?.imageUri ? (
          <img 
            src={product.images[0].imageUri} 
            alt={product.title}
            className="w-full h-full object-cover opacity-60 group-hover:opacity-80 group-hover:scale-110 transition-all duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="h-16 w-16 text-muted-foreground/30 opacity-60" />
          </div>
        )}
        <div className="absolute top-3 right-3 z-10">
          <Badge variant="secondary" className="shadow-lg backdrop-blur-sm font-semibold">
            Unlisted
          </Badge>
        </div>
        {/* Gradient Overlay */}
        <div className="absolute inset-x-0 -bottom-4 h-full bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      
      <CardHeader className="p-4 pb-3 space-y-2">
        <h3 className="font-bold text-base line-clamp-2">{product.title}</h3>
        {seller && (
          <div className="flex items-center gap-2 text-xs">
            <Avatar className="h-6 w-6 border-2 border-background shadow-sm">
              <AvatarImage src={seller.personalPhoto} alt={seller.name || seller.username} />
              <AvatarFallback className="text-[10px] font-medium">
                {(seller.name || seller.firstName || seller.username)?.substring(0, 2).toUpperCase() || <User className="h-3 w-3" />}
              </AvatarFallback>
            </Avatar>
            <span className="text-muted-foreground">by you</span>
          </div>
        )}
        <p className="text-sm text-muted-foreground italic">
          Not currently listed for sale
        </p>
      </CardHeader>
      
      <CardFooter className="p-4 pt-0 flex gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                className="flex-1 h-9 font-semibold" 
                size="sm"
                onClick={() => navigate(`/create-item?step=1&productId=${product.productId}`)}
              >
                <ListPlus className="h-4 w-4 mr-1" />
                List
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>List product for sale</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                className="h-9 hover:bg-primary/10 hover:text-primary transition-colors" 
                size="sm"
                variant="outline"
                onClick={() => onEdit(product)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Edit product</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                className="h-9 hover:bg-destructive/10 hover:text-destructive transition-colors" 
                size="sm"
                variant="outline"
                onClick={() => onDelete(product, 'product')}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Delete product</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </CardFooter>
    </Card>
  );
};

export default MyListingsPage;