import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from './ui/sheet';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { useUpdateProduct, useCategories } from '../hooks/useProducts';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';

export const EditProductSheet = ({ product, open, onOpenChange }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    categoryId: '',
  });

  const updateProduct = useUpdateProduct();
  const { data: categoriesData } = useCategories();

  // Update form when product changes and sheet opens
  useEffect(() => {
    if (product && open) {
      setFormData({
        title: product.title || '',
        description: product.description || '',
        price: product.price || '',
        categoryId: product.category?.categoryId || '',
      });
    }
  }, [product, open]);

  // Reset form when sheet closes
  useEffect(() => {
    if (!open) {
      setFormData({
        title: '',
        description: '',
        price: '',
        categoryId: '',
      });
    }
  }, [open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCategoryChange = (value) => {
    setFormData(prev => ({
      ...prev,
      categoryId: parseInt(value)
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
          categoryId: formData.categoryId
        }
      });

      toast.success('Product updated successfully');
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to update product:', error);
      toast.error(error.response?.data?.message || 'Failed to update product');
    }
  };

  const isLoading = updateProduct.isPending;
  const categories = categoriesData || [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Edit Product</SheetTitle>
          <SheetDescription>
            Update product details
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

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="categoryId">Category</Label>
            <Select
              value={formData.categoryId?.toString()}
              onValueChange={handleCategoryChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem
                    key={category.categoryId}
                    value={category.categoryId.toString()}
                  >
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Error Messages */}
          {updateProduct.isError && (
            <p className="text-sm text-destructive">
              Failed to update product. Please try again.
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