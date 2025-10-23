import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Star, Package } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useProducts } from '@/hooks/useProducts';
import { useAuth } from '../../contexts/AuthContext';

const ProductModal = ({ open, onClose, onSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProductId, setSelectedProductId] = useState(null);
  const { user } = useAuth();
  const { data, isLoading } = useProducts({ sellerId: user.userId, status: 'INACTIVE' });

  const filteredProducts = data?.content.filter(product =>
    product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const calculateAverageRating = (ratings) => {
    if (ratings.length === 0) return 0;
    return ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
  };

  const handleSelect = () => {
    if (selectedProductId) onSelect(selectedProductId);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col bg-background text-foreground">
        <DialogHeader>
          <DialogTitle>Select a Product</DialogTitle>
        </DialogHeader>

        {/* Search Input */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Product List */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
          </div>
        ) : (
          <ScrollArea className="h-96 rounded-md">
            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
              {filteredProducts?.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No products found</p>
                </div>
              ) : (
                filteredProducts?.map((product) => {
                  const avgRating = calculateAverageRating(product.ratings);
                  const primaryImage = product.images.find(img => img.isPrimary) || product.images[0];
                  const isSelected = selectedProductId === product.productId;

                  return (
                    <div
                      key={product.productId}
                      onClick={() =>
                        setSelectedProductId(product.productId === selectedProductId ? null : product.productId)
                      }
                      className={`flex gap-4 p-4 border rounded-lg cursor-pointer transition-all select-none
                        ${isSelected
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 dark:border-blue-400 shadow-md'
                          : 'border-border hover:border-muted hover:shadow-sm'
                        }`}
                    >
                      {/* Product Image */}
                      <div className="flex-shrink-0">
                        {primaryImage ? (
                          <img
                            src={primaryImage.imageUri}
                            alt={product.title}
                            className="w-24 h-24 object-cover rounded-md"
                          />
                        ) : (
                          <div className="w-24 h-24 bg-muted rounded-md flex items-center justify-center">
                            <Package className="w-8 h-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="font-semibold text-lg truncate">{product.title}</h3>

                          {/* Status Badge */}
                          <Badge
                            className={`text-xs font-medium border-none 
                              ${product.status === 'INACTIVE'
                                ? 'bg-gray-500/20 text-gray-600 dark:bg-gray-400/20 dark:text-gray-300'
                                : 'bg-blue-100 text-blue-700 dark:bg-blue-400/20 dark:text-blue-300'
                              }`}
                          >
                            {product.status}
                          </Badge>
                        </div>

                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                          {product.description}
                        </p>

                        {/* Price, Rating, Category */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <span className="text-lg font-bold">
                              ${product.price.toFixed(2)}
                            </span>

                            {product.ratings.length > 0 && (
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                <span className="text-sm font-medium">{avgRating.toFixed(1)}</span>
                                <span className="text-xs text-muted-foreground">
                                  ({product.ratings.length})
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Category Badge */}
                          <Badge
                            variant="outline"
                            className="text-xs border-border text-muted-foreground dark:border-gray-600 dark:text-gray-300"
                          >
                            {product.category.name}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        )}

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-4 border-t mt-4 border-border">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSelect} disabled={!selectedProductId}>
            Select Product
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductModal;
