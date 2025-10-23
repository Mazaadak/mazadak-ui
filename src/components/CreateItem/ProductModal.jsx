import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Star, Package } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useProducts } from '@/hooks/useProducts';
import { useAuth } from '../../contexts/AuthContext';
import ProductCard from './ProductCard';

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
                filteredProducts.map(product => (
                  <ProductCard
                    key={product.productId}
                    product={product}
                    onSelect={setSelectedProductId}
                    isSelected={selectedProductId === product.productId}
                  />
                ))
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
