import { useProduct, useDeleteProduct, useProductRatings } from "../hooks/useProducts";
import { useInventoryItem, useDeleteInventoryItem } from "../hooks/useInventory";
import { useAddToCart } from "../hooks/useCart";
import { useUser } from "../hooks/useUsers";
import { useAuth } from "../contexts/AuthContext";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Separator } from "../components/ui/separator";
import { Badge } from "../components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { ShoppingCart, Star, Package, ArrowLeft, Check, AlertCircle, MessageSquare, User, Pencil, Trash2, ListX } from "lucide-react";
import { useState } from "react";
import { RatingForm } from "../components/RatingForm";
import { RatingList } from "../components/RatingList";
import { EditFixedPriceSheet } from "../components/EditFixedPriceSheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { toast } from "sonner";

const FixedPriceDetails = () => {
  const productId = useParams().productId;
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [ratingsPage, setRatingsPage] = useState(0);
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [triggerReviewEdit, setTriggerReviewEdit] = useState(false);

  const deleteProduct = useDeleteProduct();
  const deleteInventory = useDeleteInventoryItem();

  
  console.log("Product ID:", productId);
  
  const { data: product, isLoading, error } = useProduct(productId);
  // Only fetch seller data if user is authenticated
  const { data: seller } = useUser(user ? product?.sellerId : null);
  const { data: inventoryItem } = useInventoryItem(productId);
  const { data: ratingsData, isLoading: ratingsLoading } = useProductRatings(productId, ratingsPage, 10);
  const isOwner = product?.sellerId === user?.userId;
  
  const stock = inventoryItem ? inventoryItem.totalQuantity - inventoryItem.reservedQuantity : 0;
  console.log("Inventory Item:", inventoryItem);

  const addToCart = useAddToCart();

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Loading product details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Card className="border-destructive">
          <CardContent className="pt-6 text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
            <div>
              <h3 className="font-semibold text-lg">Error Loading Product</h3>
              <p className="text-sm text-muted-foreground mt-2">{error.message}</p>
            </div>
            <Button onClick={() => navigate(-1)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Card>
          <CardContent className="pt-6 text-center space-y-4">
            <Package className="h-12 w-12 text-muted-foreground mx-auto" />
            <div>
              <h3 className="font-semibold text-lg">Product Not Found</h3>
              <p className="text-sm text-muted-foreground mt-2">
                The product you're looking for doesn't exist
              </p>
            </div>
            <Button onClick={() => navigate('/listings')}>
              Browse Listings
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleAddToCart = () => {
    addToCart.mutate(
      { productId: product.productId, quantity },
      {
        onSuccess: () => {
          console.log('Added to cart successfully!');
        },
        onError: (err) => {
          console.error('Failed to add to cart:', err);
        }
      }
    );
  };

  const handleUnlist = async () => {
    try {
      await deleteInventory.mutateAsync(product.productId);
      toast.success('Product Unlisted', {
        description: 'The product has been removed from the marketplace.',
      });
      navigate('/my-listings');
    } catch (error) {
      console.error('Error unlisting product:', error);
      toast.error('Failed to Unlist', {
        description: 'Could not unlist the product. Please try again.',
      });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteProduct.mutateAsync(product.productId);
      toast.success('Product Deleted', {
        description: 'The product has been permanently deleted.',
      });
      setDeleteDialogOpen(false);
      navigate('/my-listings');
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to Delete', {
        description: 'Could not delete the product. Please try again.',
      });
    }
  };

  const calculateAverageRating = () => {
    if (!product.ratings || product.ratings.length === 0) return 0;
    const sum = product.ratings.reduce((acc, r) => acc + r.rating, 0);
    return (sum / product.ratings.length).toFixed(1);
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < Math.floor(rating)
            ? 'fill-yellow-400 text-yellow-400'
            : 'text-gray-300'
        }`}
      />
    ));
  };

  const averageRating = calculateAverageRating();
  const hasImages = product.images && product.images.length > 0;
  const displayImage = hasImages ? product.images[selectedImage]?.imageUri : null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
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
        {/* Image Gallery */}
        <div className="space-y-4">
          <Card className="overflow-hidden">
            <div className="aspect-square relative bg-muted">
              {displayImage ? (
                <img 
                  src={displayImage}
                  alt={product.title}
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
                    alt={`${product.title} view ${idx + 1}`}
                    className="object-cover w-full h-full"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              {product.category?.name && (
                <Badge variant="secondary">{product.category.name}</Badge>
              )}
              {stock > 0 ? (
                <Badge variant="outline" className="text-green-600 border-green-600">
                  <Check className="mr-1 h-3 w-3" />
                  In Stock ({stock} available)
                </Badge>
              ) : (
                <Badge variant="destructive">Out of Stock</Badge>
              )}
            </div>
            
            <h1 className="text-3xl font-bold mb-2">{product.title}</h1>
            
            {/* Seller Info */}
            {seller && (
              <div className="flex items-center gap-2 text-sm mb-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={seller.personalPhoto} alt={seller.name || seller.username} />
                  <AvatarFallback className="text-xs">
                    {(seller.name || seller.firstName || seller.username)?.substring(0, 2).toUpperCase() || <User className="h-3 w-3" />}
                  </AvatarFallback>
                </Avatar>
                <span className="text-muted-foreground">Sold by</span>
                <span className="font-medium">
                  {seller.name || (seller.firstName && seller.lastName ? `${seller.firstName} ${seller.lastName}` : seller.firstName || seller.username || 'Seller')}
                </span>
              </div>
            )}
            
            {/* Rating */}
            {product.ratings && product.ratings.length > 0 && (
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center gap-1">
                  {renderStars(averageRating)}
                </div>
                <span className="font-medium">{averageRating}</span>
                <span className="text-muted-foreground">
                  ({product.ratings.length} {product.ratings.length === 1 ? 'review' : 'reviews'})
                </span>
              </div>
            )}
          </div>

          <Separator />

          {/* Price */}
          <div>
            <p className="text-sm text-muted-foreground mb-1">Price</p>
            <p className="text-4xl font-bold">
              ${Number(product.price).toFixed(2)}
            </p>
          </div>

          <Separator />

          {/* Description */}
          <div>
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-muted-foreground leading-relaxed">
              {product.description}
            </p>
          </div>

          <Separator />

          {/* Quantity Selector */}
          <div>
            <label className="text-sm font-medium mb-2 block">Quantity</label>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                -
              </Button>
              <span className="w-12 text-center font-medium text-lg">
                {quantity}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(Math.min(stock || 99, quantity + 1))}
                disabled={quantity >= (stock || 99)}
              >
                +
              </Button>
            </div>
          </div>

          {/* Seller Controls */}
          {isOwner && (
            <Card className="border-primary/50 bg-primary/5">
              <CardContent className="pt-6">
                <p className="text-sm font-semibold mb-4">Manage Your Listing</p>
                <div className="flex flex-col gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => setEditSheetOpen(true)}
                        >
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit Product & Inventory
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Update product details and stock</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                          onClick={handleUnlist}
                          disabled={deleteInventory.isPending}
                        >
                          <ListX className="h-4 w-4 mr-2" />
                          {deleteInventory.isPending ? 'Unlisting...' : 'Unlist from Marketplace'}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Remove from marketplace (keeps product)</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="destructive"
                          className="w-full justify-start"
                          onClick={() => setDeleteDialogOpen(true)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Product
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Permanently delete product</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Add to Cart Button */}
          {!isOwner && (
            <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-muted-foreground">Subtotal</span>
                <span className="text-2xl font-bold">
                  ${(Number(product.price) * quantity).toFixed(2)}
                </span>
              </div>
              <Button
                onClick={handleAddToCart}
                disabled={addToCart.isPending || !stock || stock === 0 || product.sellerId === user?.userId}
                className="w-full"
                size="lg"
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                {product.sellerId === user?.userId
                  ? 'Your Product'
                  : addToCart.isPending
                  ? 'Adding to Cart...'
                  : stock === 0
                  ? 'Out of Stock'
                  : 'Add to Cart'}
              </Button>
              {addToCart.isSuccess && (
                <p className="text-sm text-green-600 text-center mt-2 flex items-center justify-center gap-1">
                  <Check className="h-4 w-4" />
                  Added to cart successfully!
                </p>
              )}
              {addToCart.isError && (
                <p className="text-sm text-destructive text-center mt-2 flex items-center justify-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  Failed to add to cart. Please try again.
                </p>
              )}
            </CardContent>
          </Card>
          )}
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-12">
        <Separator className="mb-8" />
        
        <h2 className="text-3xl font-bold mb-6">Customer Reviews</h2>

        {/* Write Review Form - Top */}
        {!isOwner && (
          <Card id="review-form" className="border-primary/50 bg-primary/5 mb-6">
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4">Write a Review</h3>
              <RatingForm 
                productId={productId}
                userId={user?.userId}
                existingRatings={ratingsData?.content || []}
                triggerEdit={triggerReviewEdit}
                onSuccess={() => {
                  console.log('Review submitted successfully!');
                  setTriggerReviewEdit(false);
                }}
              />
            </CardContent>
          </Card>
        )}
        
        {/* Main Content: Summary Left, Reviews Right */}
        {product.ratings && product.ratings.length > 0 ? (
          <div className="grid lg:grid-cols-[350px_1fr] gap-6">
            {/* Left: Rating Summary - Sticky */}
            <div className="lg:sticky lg:top-4 h-fit">
              <Card className="border-2">
                <CardContent className="pt-6">
                  <div className="text-center mb-4">
                    <div className="text-5xl font-bold mb-2">{averageRating}</div>
                    <div className="flex items-center justify-center gap-1 mb-2">
                      {renderStars(averageRating)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {ratingsData?.totalElements || product.ratings.length} {(ratingsData?.totalElements || product.ratings.length) === 1 ? 'review' : 'reviews'}
                    </p>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  {/* Rating Distribution */}
                  <div className="space-y-2">
                    {[5, 4, 3, 2, 1].map((stars) => {
                      const count = product.ratings.filter(r => r.rating === stars).length;
                      const percentage = (count / product.ratings.length) * 100;
                      return (
                        <div key={stars} className="flex items-center gap-2">
                          <span className="text-sm w-8">{stars}★</span>
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-yellow-400 transition-all duration-300"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-sm text-muted-foreground w-8 text-right">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right: Reviews List - Scrollable */}
            <div className="space-y-4">
              <div className="space-y-4">
                <RatingList 
                  ratings={ratingsData?.content || []}
                  isLoading={ratingsLoading}
                  currentUserId={user?.userId}
                  onEdit={(rating) => {
                    // Trigger edit mode in the form
                    setTriggerReviewEdit(true);
                    // Scroll to the review form
                    setTimeout(() => {
                      const reviewSection = document.getElementById('review-form');
                      if (reviewSection) {
                        reviewSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }
                    }, 100);
                  }}
                />

                {/* Pagination */}
                {ratingsData && ratingsData.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-6">
                    <Button
                      variant="outline"
                      onClick={() => setRatingsPage(prev => Math.max(0, prev - 1))}
                      disabled={ratingsPage === 0}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {ratingsPage + 1} of {ratingsData.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      onClick={() => setRatingsPage(prev => prev + 1)}
                      disabled={ratingsPage >= ratingsData.totalPages - 1}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* No reviews yet */
          <Card className={isOwner ? "border-muted bg-muted/20" : "border-primary/50 bg-primary/5"}>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Reviews Yet</h3>
                <p className="text-muted-foreground">
                  {isOwner ? "You cannot review your own product" : "Be the first to share your experience with this product!"}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Sheet */}
      {product && inventoryItem && (
        <EditFixedPriceSheet
          open={editSheetOpen}
          onOpenChange={setEditSheetOpen}
          product={product}
          inventory={inventoryItem}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete this product? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
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

export default FixedPriceDetails;