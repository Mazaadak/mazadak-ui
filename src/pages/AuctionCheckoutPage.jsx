import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useOrder, useProvideAddress, useCheckoutStatus, useCancelCheckout } from '../hooks/useOrders';
import { useAddresses } from '../hooks/useAddress';
import { useCreatePaymentIntent } from '../hooks/usePayments';
import { useAuction } from '../hooks/useAuctions';
import { useProduct } from '../hooks/useProducts';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../hooks/queryKeys';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Separator } from '../components/ui/separator';
import { Badge } from '../components/ui/badge';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Label } from '../components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { ArrowLeft, Package, MapPin, CreditCard, Loader2, XCircle, AlertCircle, CheckCircle2 } from 'lucide-react';
import { AddressManagementModal } from '../components/AddressManagementModal';
import { Link } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const CheckoutForm = ({ clientSecret, orderId, onSuccess, onError, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
      });

      if (error) {
        onError(error.message);
      } else if (paymentIntent && paymentIntent.status === 'requires_capture') {
        onSuccess();
      }
    } catch (err) {
      onError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <div className="space-y-3">
        <Button 
          type="submit" 
          disabled={!stripe || isProcessing} 
          className="w-full hover:scale-[1.02] transition-transform"
          size="lg"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Authorize Payment
            </>
          )}
        </Button>
        
        <Button 
          type="button"
          onClick={onCancel}
          disabled={isProcessing}
          variant="outline"
          className="w-full hover:bg-destructive/10 hover:text-destructive hover:border-destructive transition-colors"
          size="lg"
        >
          <XCircle className="mr-2 h-4 w-4" />
          Cancel Checkout
        </Button>
      </div>
    </form>
  );
};

// Order Item Display Component - fetches product image from product service
const OrderItemDisplay = ({ item }) => {
  const { data: product, isLoading: isProductLoading } = useProduct(item.productId);

  return (
    <div className="flex items-center gap-3">
      <div className="relative h-16 w-16 rounded-lg overflow-hidden bg-gradient-to-br from-muted to-muted/50 flex-shrink-0 group">
        {isProductLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <img
              src={product?.images?.[0]?.imageUri || '/placeholder.png'}
              alt={item.productName}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
          </>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate hover:text-primary transition-colors">{item.productName}</p>
        <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
      </div>
      <p className="font-semibold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">${item.unitPrice.toFixed(2)}</p>
    </div>
  );
};

// Format status to proper case
const formatStatus = (status) => {
  if (!status) return '';
  return status.charAt(0) + status.slice(1).toLowerCase();
};

export const AuctionCheckoutPage = () => {
  const { orderId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [currentStep, setCurrentStep] = useState('address'); // 'address' | 'payment' | 'processing'
  const [clientSecret, setClientSecret] = useState(null);
  const [error, setError] = useState(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);

  const { data: order, isLoading: isLoadingOrder, refetch: refetchOrder } = useOrder(orderId);
  const { data: addresses = [], isLoading: isLoadingAddresses, refetch: refetchAddresses } = useAddresses();
  const { data: auction, isLoading: isLoadingAuction } = useAuction(order?.auctionId, {
    enabled: !!order?.auctionId
  });
  
  // Refetch order on page load
  useEffect(() => {
    if (orderId) {
      console.log('REFETCHING ORDER ON PAGE LOAD');
      refetchOrder();
    }
  }, [orderId]);
  
  // Debug logging
  console.log('===== AUCTION CHECKOUT PAGE STATE =====');
  console.log('orderId:', orderId);
  console.log('user:', user);
  console.log('order:', order);
  console.log('isLoadingOrder:', isLoadingOrder);
  console.log('currentStep:', currentStep);
  console.log('clientSecret state:', clientSecret);
  console.log('order.clientSecret:', order?.clientSecret);
  console.log('=======================================');
  
  const provideAddress = useProvideAddress();
  const createPaymentIntent = useCreatePaymentIntent();
  const cancelCheckout = useCancelCheckout();
  
  // Poll for checkout status when processing
  const { data: checkoutStatus } = useCheckoutStatus(orderId, {
    enabled: !!orderId && currentStep === 'processing',
    refetchInterval: 2000 // Poll every 2 seconds
  });

  // Handle checkout status changes (when polling during processing)
  useEffect(() => {
    if (!checkoutStatus || !orderId) return;
    
    console.log('Checkout status updated:', checkoutStatus);
    
    // If workflow failed, refetch order to get FAILED status
    if (checkoutStatus.status === 'FAILED') {
      console.log('Workflow failed, refetching order');
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.order(orderId) });
    }
    // If workflow completed, refetch order to get COMPLETED/CONFIRMED status
    else if (checkoutStatus.status === 'COMPLETED') {
      console.log('Workflow completed, refetching order');
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.order(orderId) });
    }
  }, [checkoutStatus, orderId, queryClient]);

  // Determine current step based on order state (for resuming checkout)
  useEffect(() => {
    if (!order) return;

    console.log('Determining step for auction order:', order);
    console.log('Order status:', order.status);
    console.log('Order has clientSecret:', !!order.clientSecret);
    console.log('Order paymentStatus:', order.paymentStatus);
    console.log('Order shippingAddress:', order.shippingAddress);

    // If order is completed, confirmed, failed, or cancelled, don't override - let the main render logic handle it
    if (['COMPLETED', 'CONFIRMED', 'FAILED', 'CANCELLED'].includes(order.status)) {
      console.log('Order in terminal state:', order.status);
      return;
    }

    // If payment is authorized, show processing
    if (order.paymentStatus === 'AUTHORIZED') {
      console.log('Setting step to processing');
      setCurrentStep('processing');
    }
    // If we have a clientSecret and payment is still pending, go to payment step
    else if (order.clientSecret && order.paymentStatus === 'PENDING') {
      console.log('Setting step to payment with clientSecret');
      setClientSecret(order.clientSecret);
      setCurrentStep('payment');
    }
    // If order has address but no clientSecret yet, show address step
    else if (order.shippingAddress && !order.clientSecret) {
      console.log('Order has address but no payment intent, staying on address step');
      // Pre-select the address if it matches one in the user's addresses
      const matchingAddress = addresses.find(addr => 
        addr.street === order.shippingAddress.street &&
        addr.city === order.shippingAddress.city
      );
      if (matchingAddress) {
        setSelectedAddressId(matchingAddress.addressId?.toString());
      }
      setCurrentStep('address');
    }
    // Default to address step
    else {
      console.log('Defaulting to address step');
      setCurrentStep('address');
    }
  }, [order, addresses]);

  const handleProvideAddress = async () => {
    if (!selectedAddressId) {
      setError('Please select a shipping address');
      return;
    }

    console.log('Selected Address ID:', selectedAddressId);
    console.log('Available addresses:', addresses);

    const selectedAddress = addresses.find(addr => addr.addressId?.toString() === selectedAddressId?.toString());
    console.log('Found address:', selectedAddress);

    if (!selectedAddress) {
      setError('Invalid address selected');
      return;
    }

    setError(null);

    try {
      await provideAddress.mutateAsync({
        orderId,
        address: {
          street: selectedAddress.street,
          city: selectedAddress.city,
          state: selectedAddress.state,
          postalCode: selectedAddress.zipCode,
          country: selectedAddress.country
        }
      });

      // Create payment intent
      // For auction orders, create items array with the winning bid amount
      let items = [];
      
      console.log('Order data:', order);
      console.log('Order totalAmount:', order.totalAmount);
      console.log('Auction data:', auction);
      
      // Get seller ID from auction
      const sellerId = auction?.sellerId;
      
      // Verify we have a seller ID
      if (!sellerId) {
        setError('Unable to determine seller information. Please contact support.');
        return;
      }
      
      if (order.orderItems && order.orderItems.length > 0) {
        // If orderItems exists, use it
        console.log('Using orderItems:', order.orderItems);
        items = order.orderItems.map(item => ({
          sellerId: item.sellerId || sellerId,
          amount: Math.round(Number(item.subtotal) * 100) // Convert dollars to cents
        }));
      } else {
        // For auction orders without orderItems, use the total amount and seller ID
        // totalAmount is already in cents from the backend
        const amountInCents = Math.round(Number(order.totalAmount));
        console.log('Using totalAmount, amount in cents:', amountInCents);
        console.log('Using sellerId from auction:', sellerId);
        
        items = [{
          sellerId: sellerId,
          amount: amountInCents // Already in cents, no conversion needed
        }];
      }
      
      console.log('Final payment intent items:', JSON.stringify(items, null, 2));

      const response = await createPaymentIntent.mutateAsync({
        orderId,
        currency: 'usd',
        type: 'AUCTION',
        items: items
      });

      // Update the order in cache with the clientSecret
      queryClient.setQueryData(queryKeys.orders.order(orderId), (oldData) => ({
        ...oldData,
        clientSecret: response.clientSecret
      }));

      setClientSecret(response.clientSecret);
      setCurrentStep('payment');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to proceed with checkout');
    }
  };

  const handlePaymentSuccess = () => {
    setCurrentStep('processing');
  };

  const handlePaymentError = (errorMessage) => {
    setError(errorMessage);
  };

  const handleCancelCheckout = async () => {
    try {
      await cancelCheckout.mutateAsync(orderId);
      navigate('/my-orders');
    } catch (err) {
      console.error('Cancel checkout error:', err);
      setError('Failed to cancel checkout. Please try again.');
    }
  };

  if (isLoadingOrder || isLoadingAddresses || isLoadingAuction) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-6 max-w-md">
          <XCircle className="h-24 w-24 text-destructive mx-auto" />
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Order Not Found</h2>
            <p className="text-muted-foreground">The order you're looking for doesn't exist</p>
          </div>
          <Button asChild size="lg">
            <Link to="/">Go Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Check if user is the buyer
  if (order.buyerId !== user?.userId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-6 max-w-md">
          <AlertCircle className="h-24 w-24 text-destructive mx-auto" />
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Access Denied</h2>
            <p className="text-muted-foreground">You don't have permission to view this order</p>
          </div>
          <Button asChild size="lg">
            <Link to="/">Go Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Check if order is already completed or failed
  if (order.status === 'COMPLETED' || order.status === 'CONFIRMED') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-6 max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="relative">
            <CheckCircle2 className="h-24 w-24 text-green-500 mx-auto animate-in zoom-in duration-300" />
            <div className="absolute inset-0 animate-ping">
              <CheckCircle2 className="h-24 w-24 text-green-500/30 mx-auto" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">Order Complete!</h2>
            <p className="text-muted-foreground">Your order has been successfully placed.</p>
          </div>
          <div className="space-y-2 p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Order ID:</span>
              <span className="font-mono font-semibold">{order.id}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Status:</span>
              <Badge variant="default" className="bg-green-500 hover:bg-green-600">{formatStatus(order.status)}</Badge>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total:</span>
              <span className="font-semibold text-lg bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">${Number(order.totalAmount || 0).toFixed(2)}</span>
            </div>
          </div>
          <div className="flex gap-3">
            <Button asChild size="lg" variant="outline" className="flex-1 hover:scale-105 transition-transform">
              <Link to="/">Continue Shopping</Link>
            </Button>
            <Button asChild size="lg" className="flex-1 bg-gradient-to-r from-primary to-primary/80 hover:scale-105 transition-transform">
              <Link to="/my-orders">View Orders</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (order.status === 'FAILED' || order.status === 'CANCELLED') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-6 max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="relative">
            <AlertCircle className="h-24 w-24 text-destructive mx-auto opacity-80 animate-in zoom-in duration-300" />
            <div className="absolute inset-0 animate-pulse">
              <AlertCircle className="h-24 w-24 text-destructive/20 mx-auto" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-destructive to-red-600 bg-clip-text text-transparent">Order {formatStatus(order.status)}</h2>
            <p className="text-muted-foreground">
              {order.status === 'FAILED' 
                ? 'There was an issue processing your order. Please try again.'
                : 'This order has been cancelled.'}
            </p>
          </div>
          <div className="space-y-2 p-4 bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20 rounded-lg border border-red-200 dark:border-red-800">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Order ID:</span>
              <span className="font-mono font-semibold">{order.id}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Status:</span>
              <Badge variant="destructive" className="animate-pulse">{formatStatus(order.status)}</Badge>
            </div>
          </div>
          <Button asChild size="lg" className="w-full hover:scale-105 transition-transform">
            <Link to="/cart">Back to Cart</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Auction Checkout</h1>
        <p className="text-muted-foreground mt-2">Complete your auction purchase</p>
        <Badge variant="outline" className="mt-2">Order #{orderId}</Badge>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="mb-6 border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" />
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Auction Winner Notice */}
      <Card className="mb-6 bg-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-primary/10 rounded-full">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <div className="text-center flex-1">
              <h3 className="font-semibold">Congratulations!</h3>
              <p className="text-sm text-muted-foreground mt-1">
                You won this auction. Please complete your purchase to secure your item.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Checkout Flow */}
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1: Address Selection */}
          {currentStep === 'address' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Shipping Address
                </CardTitle>
                <CardDescription>Select where you want your item delivered</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {addresses.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">You haven't added any addresses yet</p>
                    <Button onClick={() => setIsAddressModalOpen(true)}>
                      Add Address
                    </Button>
                  </div>
                ) : (
                  <RadioGroup value={selectedAddressId?.toString()} onValueChange={(value) => setSelectedAddressId(value)}>
                    {addresses.map((address) => (
                      <label 
                        key={address.addressId} 
                        htmlFor={`address-${address.addressId}`}
                        className={`flex items-start gap-3 rounded-lg border-2 p-4 cursor-pointer transition-all ${
                          selectedAddressId?.toString() === address.addressId?.toString()
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50 hover:bg-accent/50'
                        }`}
                      >
                        <RadioGroupItem 
                          value={address.addressId?.toString()} 
                          id={`address-${address.addressId}`}
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-base">{address.street}</div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {address.city}, {address.state} {address.zipCode || ''}
                          </div>
                          {address.country && <div className="text-sm text-muted-foreground">{address.country}</div>}
                        </div>
                      </label>
                    ))}
                  </RadioGroup>
                )}

                <div className="space-y-3">
                  <Button 
                    onClick={handleProvideAddress} 
                    disabled={!selectedAddressId || !auction || isLoadingAuction || provideAddress.isPending || createPaymentIntent.isPending}
                    className="w-full hover:scale-[1.02] transition-transform"
                    size="lg"
                  >
                    {(provideAddress.isPending || createPaymentIntent.isPending) ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        Proceed to Payment
                        <CreditCard className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    onClick={handleCancelCheckout}
                    disabled={cancelCheckout.isPending}
                    variant="outline"
                    className="w-full hover:bg-destructive/10 hover:text-destructive hover:border-destructive transition-colors"
                    size="lg"
                  >
                    {cancelCheckout.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Cancelling...
                      </>
                    ) : (
                      <>
                        <XCircle className="mr-2 h-4 w-4" />
                        Cancel Checkout
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Payment */}
          {currentStep === 'payment' && clientSecret && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Information
                </CardTitle>
                <CardDescription>Enter your payment details</CardDescription>
              </CardHeader>
              <CardContent>
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <CheckoutForm 
                    clientSecret={clientSecret}
                    orderId={orderId}
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                    onCancel={handleCancelCheckout}
                  />
                </Elements>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Processing */}
          {currentStep === 'processing' && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-4 py-8">
                  <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                  <div>
                    <h3 className="font-semibold text-lg">Processing your order</h3>
                    <p className="text-sm text-muted-foreground mt-2">
                      Please wait while we finalize your purchase...
                    </p>
                  </div>
                  {checkoutStatus && (
                    <Badge variant="secondary">{checkoutStatus.status}</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Items */}
              <div className="space-y-3">
                {order.orderItems?.map((item) => (
                  <OrderItemDisplay key={item.id} item={item} />
                ))}
              </div>

              <Separator />

              {/* Pricing */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">${Number(order.totalAmount).toFixed(2)}</span>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>${Number(order.totalAmount).toFixed(2)}</span>
              </div>

              {/* Order Status */}
              <div className="pt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Order Status</span>
                  <Badge variant="secondary">{formatStatus(order.status)}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-muted-foreground">Payment Status</span>
                  <Badge variant="secondary">{formatStatus(order.paymentStatus)}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Cancel Checkout Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Checkout</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this checkout? This action cannot be undone and you may lose this opportunity to purchase the item.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
              Continue Checkout
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleCancelCheckout}
              disabled={cancelCheckout.isPending}
            >
              {cancelCheckout.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancelling...
                </>
              ) : (
                'Cancel Checkout'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Address Management Modal */}
      <AddressManagementModal 
        open={isAddressModalOpen} 
        onOpenChange={setIsAddressModalOpen}
        onSelectAddress={(address) => {
          setSelectedAddressId(address.addressId?.toString());
          refetchAddresses();
          setIsAddressModalOpen(false);
        }}
      />
    </div>
  );
};
