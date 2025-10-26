import { useState } from 'react';
import { useUserProducts, useDeleteProduct } from '../hooks/useProducts';
import { useInventoryItem } from '../hooks/useInventory';
import { EditProductSheet } from '../components/EditProductSheet';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Package, Pencil, Trash2, Plus, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export const MyListingsPage = () => {
  const { data: products = [], isLoading, error } = useUserProducts();

  console.log("products:", products);
  const deleteProduct = useDeleteProduct();

  
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingInventory, setEditingInventory] = useState(null);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  const handleEdit = (product, inventoryData) => {
    setEditingProduct(product);
    setEditingInventory(inventoryData);
    setIsEditSheetOpen(true);
  };

  const handleDeleteClick = (product) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (productToDelete) {
      try {
        await deleteProduct.mutateAsync(productToDelete.productId);
        setDeleteDialogOpen(false);
        setProductToDelete(null);
      } catch (error) {
        console.error('Failed to delete product:', error);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Loading your listings...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-destructive">
          <CardContent className="pt-6 text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
            <div>
              <h3 className="font-semibold text-lg">Error Loading Listings</h3>
              <p className="text-sm text-muted-foreground mt-2">{error.message}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-6 max-w-md">
            <Package className="h-24 w-24 text-muted-foreground mx-auto opacity-50" />
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">No Listings Yet</h2>
              <p className="text-muted-foreground">
                Start selling by creating your first product listing
              </p>
            </div>
            <Button asChild size="lg">
              <Link to="/create-item">
                <Plus className="mr-2 h-5 w-5" />
                Create Listing
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">My Listings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your products and inventory
          </p>
        </div>
        <Button asChild>
          <Link to="/create-item">
            <Plus className="mr-2 h-4 w-4" />
            New Listing
          </Link>
        </Button>
      </div>

      {/* Products Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                    <TableHead className="w-[100px]">Image</TableHead>
                    <TableHead className="w-[200px]">Title</TableHead>
                    <TableHead className="w-[120px]">Price</TableHead>
                    <TableHead className="w-[120px]">Stock</TableHead>
                    <TableHead className="w-[120px]">Status</TableHead>
                 <TableHead className="w-[100px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <ProductRow
                  key={product.productId}
                  product={product}
                  onEdit={handleEdit}
                  onDelete={handleDeleteClick}
                />
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Sheet */}
      <EditProductSheet
        product={editingProduct}
        inventory={editingInventory}
        open={isEditSheetOpen}
        onOpenChange={setIsEditSheetOpen}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{productToDelete?.title}"? This action cannot be undone.
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

const ProductRow = ({key, product, onEdit, onDelete }) => {
  const { data: inventory } = useInventoryItem(product.productId);
  const stock = inventory?.totalQuantity - inventory?.reservedQuantity || 0;

  return (
    <TableRow>
      <TableCell>
        {product.images?.[0] ? (
          <img
            src={product.images[0].imageUri}
            alt={product.title}
            className="w-16 h-16 object-cover rounded"
          />
        ) : (
          <div className="w-16 h-16 bg-muted rounded flex items-center justify-center">
            <Package className="h-6 w-6 text-muted-foreground" />
          </div>
        )}
      </TableCell>
      <TableCell className="text-left">
        {product.title}
      </TableCell>
      <TableCell className="text-left">${Number(product.price).toFixed(2)}</TableCell>
      <TableCell className="text-left">
        <Badge variant={stock > 0 ? 'secondary' : 'destructive'}>
          {stock} in stock
        </Badge>
      </TableCell>
      <TableCell className="text-left">
        <Badge variant={stock > 0 ? 'Secondary' : 'destructive'}>
          {product.status}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(product, inventory)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(product)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};