import { useProduct } from "../hooks/useProducts";
import { useInventoryItem } from "../hooks/useInventory";
import { useAddToCart } from "../hooks/useCart";
import { useProductRatings } from "../hooks/useRatings";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Separator } from "../components/ui/separator";
import { Badge } from "../components/ui/badge";
import { ShoppingCart, Star, Package, ArrowLeft, Check, AlertCircle, MessageSquare } from "lucide-react";
import { useState } from "react";
import { RatingForm } from "../components/RatingForm";
import { RatingList } from "../components/RatingList";

const ProductDetails = () => {
  const productId = useParams().productId;
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [ratingsPage, setRatingsPage] = useState(0);

  console.log("Product ID:", productId);
  
  const { data: product, isLoading, error } = useProduct(productId);
  const { data: inventoryItem } = useInventoryItem(productId);
  const { data: ratingsData, isLoading: ratingsLoading } = useProductRatings(productId, ratingsPage, 10);
  
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
            <Button onClick={() => navigate('/products')}>
              Browse Products
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

          {/* Add to Cart Button */}
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
                disabled={addToCart.isPending || !stock || stock === 0}
                className="w-full"
                size="lg"
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                {addToCart.isPending
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
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-12">
        <Separator className="mb-8" />
        
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Leave a Review */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Leave a Review
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RatingForm 
                  productId={productId}
                  onSuccess={() => {
                    console.log('Review submitted successfully!');
                  }}
                />
              </CardContent>
            </Card>
          </div>

          {/* Reviews List */}
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">Customer Reviews</h2>
              {ratingsData?.totalElements > 0 && (
                <p className="text-muted-foreground">
                  {ratingsData.totalElements} {ratingsData.totalElements === 1 ? 'review' : 'reviews'}
                </p>
              )}
            </div>

            <RatingList 
              ratings={ratingsData?.content || []}
              isLoading={ratingsLoading}
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
    </div>
  );
};

export default ProductDetails;