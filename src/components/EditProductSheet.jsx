import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from './ui/sheet';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { useUpdateProduct } from '../hooks/useProducts';
import { useUpdateInventoryItem } from '../hooks/useInventory';
import { Loader2, Save } from 'lucide-react';

export const EditProductSheet = ({ product, inventory, open, onOpenChange }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    quantity: '',
    status: 'ACTIVE', // Add status to form data
  });

  const updateProduct = useUpdateProduct();
  const updateInventory = useUpdateInventoryItem();

  useEffect(() => {
    if (product) {
      setFormData({
        title: product.title || '',
        description: product.description || '',
        price: product.price || '',
        quantity: inventory?.totalQuantity - inventory?.reservedQuantity || 0,
        status: product.status || 'ACTIVE', // Set initial status
      });
    }
  }, [product, inventory]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Separate handler for Select component
  const handleStatusChange = (value) => {
    setFormData(prev => ({
      ...prev,
      status: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await updateProduct.mutateAsync({
        productId: product.productId,
        data: {
          title: formData.title,
          description: formData.description,
          price: parseFloat(formData.price),
          status: formData.status, 
          categoryId: product.categoryId
        }
      });

      await updateInventory.mutateAsync({
        productId: product.productId,
        quantity: parseInt(formData.quantity) || 0,
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Failed to update product:', error);
    }
  };

  const isLoading = updateProduct.isPending || updateInventory.isPending;

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'ACTIVE':
        return 'text-green-600';
      case 'INACTIVE':
        return 'text-orange-600';
      case 'DELETED':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Edit Product</SheetTitle>
          <SheetDescription>
            Make changes to your product listing
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          {/* Product Image Preview */}
          {product?.images?.[0] && (
            <div className="aspect-video relative bg-muted rounded-lg overflow-hidden">
              <img 
                src={product.images[0].imageUri} 
                alt={product.title}
                className="object-cover w-full h-full"
              />
            </div>
          )}

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              required
            />
          </div>

          {/* Price */}
          <div className="space-y-2">
            <Label htmlFor="price">Price ($)</Label>
            <Input
              id="price"
              name="price"
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={handleChange}
              required
            />
          </div>

          {/* Status Selector */}
          <div className="space-y-2">
            <Label htmlFor="status">Product Status</Label>
            <Select 
              value={formData.status} 
              onValueChange={handleStatusChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-green-600"></span>
                    Active
                  </div>
                </SelectItem>
                <SelectItem value="INACTIVE">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-orange-600"></span>
                    Inactive
                  </div>
                </SelectItem>
                <SelectItem value="DELETED">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-red-600"></span>
                    Deleted
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {formData.status === 'ACTIVE' && 'Product is visible and available for purchase'}
              {formData.status === 'INACTIVE' && 'Product is hidden from listings but not deleted'}
              {formData.status === 'DELETED' && 'Product is marked as deleted and will not appear'}
            </p>
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity in Stock</Label>
            <Input
              id="quantity"
              name="quantity"
              type="number"
              min="0"
              value={formData.quantity}
              onChange={handleChange}
              required
            />
          </div>

          {/* Error Messages */}
          {updateProduct.isError && (
            <p className="text-sm text-destructive">
              Failed to update product. Please try again.
            </p>
          )}
          {updateInventory.isError && (
            <p className="text-sm text-destructive">
              Failed to update inventory. Please try again.
            </p>
          )}

          {/* Buttons */}
          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
};