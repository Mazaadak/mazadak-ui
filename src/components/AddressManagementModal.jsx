import { useState } from 'react';
import { useAddresses, useAddAddress, useUpdateAddress, useDeleteAddress } from '../hooks/useAddress';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Card, CardContent } from './ui/card';
import { Plus, MapPin, Edit2, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export const AddressManagementModal = ({ open, onOpenChange, onSelectAddress }) => {
  const { data: addresses = [], isLoading } = useAddresses();
  const addAddress = useAddAddress();
  const updateAddress = useUpdateAddress();
  const deleteAddress = useDeleteAddress();
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [formData, setFormData] = useState({
    street: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    try {
      await addAddress.mutateAsync(formData);
      setIsAddDialogOpen(false);
      setFormData({ street: '', city: '', state: '', country: '', postalCode: '' });
      toast.success('Address Added', {
        description: 'Your new address has been added successfully.',
      });
    } catch (error) {
      console.error('Error adding address:', error);
      toast.error('Failed to Add Address', {
        description: 'Please try again.',
      });
    }
  };

  const handleEditAddress = (address) => {
    setEditingAddress(address);
    setFormData({
      street: address.street || '',
      city: address.city || '',
      state: address.state || '',
      country: address.country || '',
      postalCode: address.postalCode || '',
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateAddress = async (e) => {
    e.preventDefault();
    try {
      await updateAddress.mutateAsync({
        addressId: editingAddress.addressId || editingAddress.id,
        address: formData,
      });
      setIsEditDialogOpen(false);
      setEditingAddress(null);
      setFormData({ street: '', city: '', state: '', country: '', postalCode: '' });
      toast.success('Address Updated', {
        description: 'Your address has been updated successfully.',
      });
    } catch (error) {
      console.error('Error updating address:', error);
      toast.error('Failed to Update Address', {
        description: 'Please try again.',
      });
    }
  };

  const handleDeleteAddress = async (addressId) => {
    try {
      const id = typeof addressId === 'string' ? addressId : (addressId?.addressId || addressId?.id);
      await deleteAddress.mutateAsync(id);
      toast.success('Address Deleted', {
        description: 'The address has been removed.',
      });
    } catch (error) {
      console.error('Error deleting address:', error);
      toast.error('Failed to Delete Address', {
        description: 'Please try again.',
      });
    }
  };

  const handleSelectAddress = (address) => {
    if (onSelectAddress) {
      onSelectAddress(address);
      onOpenChange(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <MapPin className="h-6 w-6" />
              Manage Addresses
            </DialogTitle>
            <DialogDescription>
              {onSelectAddress ? 'Select an address or add a new one' : 'Manage your delivery addresses'}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-1">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : addresses.length === 0 ? (
              <div className="text-center py-12 space-y-4">
                <MapPin className="h-12 w-12 text-muted-foreground mx-auto" />
                <div>
                  <h3 className="font-semibold text-lg">No Addresses Yet</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Add your first delivery address to get started
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid gap-4 py-4">
                {addresses.map((address) => (
                  <Card 
                    key={address.addressId || address.id} 
                    className={`transition-all ${onSelectAddress ? 'cursor-pointer hover:border-primary hover:shadow-md' : ''}`}
                    onClick={() => onSelectAddress && handleSelectAddress(address)}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-primary" />
                            <span className="font-semibold">{address.street}</span>
                          </div>
                          <p className="text-sm text-muted-foreground pl-6">
                            {address.city}, {address.state}
                          </p>
                          <p className="text-sm text-muted-foreground pl-6">
                            {address.country} - {address.postalCode}
                          </p>
                        </div>
                        {!onSelectAddress && (
                          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditAddress(address)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteAddress(address.addressId || address.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="flex-row justify-between items-center sm:justify-between border-t pt-4">
            <Button
              variant="outline"
              onClick={() => setIsAddDialogOpen(true)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add New Address
            </Button>
            {!onSelectAddress && (
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Address Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleAddAddress}>
            <DialogHeader>
              <DialogTitle>Add New Address</DialogTitle>
              <DialogDescription>
                Add a new delivery address to your account
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="street">Street Address</Label>
                <Input
                  id="street"
                  name="street"
                  value={formData.street}
                  onChange={handleInputChange}
                  required
                  placeholder="123 Main St"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    required
                    placeholder="City"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State/Province</Label>
                  <Input
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    required
                    placeholder="State"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    required
                    placeholder="Country"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postalCode">Postal Code</Label>
                  <Input
                    id="postalCode"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleInputChange}
                    required
                    placeholder="12345"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={addAddress.isPending}>
                {addAddress.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Add Address'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Address Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleUpdateAddress}>
            <DialogHeader>
              <DialogTitle>Edit Address</DialogTitle>
              <DialogDescription>
                Update your delivery address information
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-street">Street Address</Label>
                <Input
                  id="edit-street"
                  name="street"
                  value={formData.street}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-city">City</Label>
                  <Input
                    id="edit-city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-state">State/Province</Label>
                  <Input
                    id="edit-state"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-country">Country</Label>
                  <Input
                    id="edit-country"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-postalCode">Postal Code</Label>
                  <Input
                    id="edit-postalCode"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateAddress.isPending}>
                {updateAddress.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Address'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};
