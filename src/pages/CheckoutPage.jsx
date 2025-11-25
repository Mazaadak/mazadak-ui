import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCartItems } from '../hooks/useCart';
import { useAddresses } from '../hooks/useAddress';
import { useCheckout, useOrder, useCheckoutStatus, useCancelCheckout } from '../hooks/useOrders';
import { useCreatePaymentIntent } from '../hooks/usePayments';
import { useProduct } from '../hooks/useProducts';
import { ordersAPI } from '../api/orders';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../hooks/queryKeys';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Separator } from '../components/ui/separator';
import { v4 as uuidv4 } from 'uuid';
import { Badge } from '../components/ui/badge';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Label } from '../components/ui/label';
import { ArrowLeft, Package, MapPin, CreditCard, Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { AddressManagementModal } from '../components/AddressManagementModal';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { toast } from 'sonner';

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// Format status to proper case
const formatStatus = (status) => {
  if (!status) return '';
  return status.charAt(0) + status.slice(1).toLowerCase();
};

// Component to display order item with product image from product service
const OrderItemDisplay = ({ item, isOrderItem }) => {
  const { data: product } = useProduct(isOrderItem ? item.productId : null, {
    enabled: isOrderItem
  });
  
  const title = isOrderItem ? item.productName : item.title;
  const image = isOrderItem ? product?.images?.[0]?.imageUri : item.primaryImage;
  const quantity = isOrderItem ? item.quantity : item.quantity;
  const price = isOrderItem ? Number(item.subtotal) : Number(item.price ?? 0);
  const subtotal = isOrderItem ? price : (isNaN(price) ? 0 : price * quantity);
  
  return (
    <div className="flex gap-3">
      {image ? (
        <div className="relative group">
          <img 
            src={image} 
            alt={title} 
            className="w-16 h-16 object-cover rounded-lg border shadow-sm transition-transform group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 rounded-lg transition-colors" />
        </div>
      ) : (
        <div className="w-16 h-16 bg-muted rounded-lg border flex items-center justify-center">
          <Package className="h-6 w-6 text-muted-foreground" />
        </div>
      )}
      <div className="flex-1 min-w-0 text-left">
        <p className="text-sm font-medium truncate hover:text-primary transition-colors">{title}</p>
        <p className="text-xs text-muted-foreground">Qty: {quantity}</p>
        <p className="text-sm font-semibold text-primary">${subtotal.toFixed(2)}</p>
      </div>
    </div>
  );
};

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

export const CheckoutPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [currentStep, setCurrentStep] = useState('address'); // 'address' | 'payment' | 'processing'
  const [clientSecret, setClientSecret] = useState(null);
  const [error, setError] = useState(null);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [workflowFailed, setWorkflowFailed] = useState(false); // Track workflow failure separately

  const { data: cartItems = [], isLoading: isLoadingCart } = useCartItems();
  const { data: addresses = [], isLoading: isLoadingAddresses, refetch: refetchAddresses } = useAddresses();
  const { data: order, isLoading: isLoadingOrder } = useOrder(orderId, { enabled: !!orderId });
  const checkout = useCheckout();
  const createPaymentIntent = useCreatePaymentIntent();
  const cancelCheckout = useCancelCheckout();
  
  // Poll for checkout status continuously when we have an orderId
  const { data: checkoutStatus } = useCheckoutStatus(orderId, {
    enabled: !!orderId,
    refetchInterval: 2000 // Poll every 2 seconds
  });

  // Determine current step based on order state (for resuming checkout)
  useEffect(() => {
    console.log('========== STEP DETERMINATION EFFECT ==========');
    console.log('orderId:', orderId);
    console.log('order exists:', !!order);
    
    if (!orderId || !order) {
      console.log('Skipping: no orderId or order');
      return;
    }

    console.log('Determining step for order:', order);
    console.log('Order status:', order.status);
    console.log('Order has clientSecret:', !!order.clientSecret);
    console.log('Order paymentStatus:', order.paymentStatus);
    console.log('Order shippingAddress:', order.shippingAddress);

    // If order is completed, confirmed, failed, or cancelled, don't override - let the main render logic handle it
    if (['COMPLETED', 'CONFIRMED', 'FAILED', 'CANCELLED'].includes(order.status)) {
      console.log('!!! ORDER IN TERMINAL STATE - SHOULD SHOW SUCCESS/FAILURE SCREEN !!!');
      console.log('Terminal status:', order.status);
      console.log('Current step before return:', currentStep);
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
    // If order has address but no clientSecret yet, show address step and they can proceed
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
    console.log('========================================');
  }, [orderId, order, addresses]);

  // Handle checkout status changes - continuously monitor workflow status
  useEffect(() => {
    console.log('========== CHECKOUT STATUS EFFECT ==========');
    console.log('checkoutStatus:', checkoutStatus);
    console.log('orderId:', orderId);
    console.log('currentStep:', currentStep);
    
    if (!checkoutStatus || !orderId) {
      console.log('Skipping: no checkoutStatus or orderId');
      return;
    }
    
    console.log('Checkout status updated:', checkoutStatus);
    console.log('checkoutStatus.status:', checkoutStatus.status);
    
    // If workflow failed, mark as failed immediately
    if (checkoutStatus.status === 'FAILED') {
      console.log('!!! WORKFLOW FAILED - SHOWING FAILURE IMMEDIATELY !!!');
      setWorkflowFailed(true);
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.order(orderId) });
      console.log('Invalidated queries for orderId:', orderId);
      // Re-enable cart after failure - poll until active
      const pollCartStatus = async () => {
        for (let i = 0; i < 10; i++) {
          await new Promise(resolve => setTimeout(resolve, 500));
          await queryClient.invalidateQueries({ queryKey: queryKeys.cart.isActive });
          await queryClient.refetchQueries({ queryKey: queryKeys.cart.isActive });
        }
      };
      pollCartStatus();
    }
    // If workflow completed, refetch order to show success
    else if (checkoutStatus.status === 'COMPLETED') {
      console.log('!!! WORKFLOW COMPLETED - REFETCHING ORDER !!!');
      setWorkflowFailed(false);
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.order(orderId) });
      console.log('Invalidated queries for orderId:', orderId);
      // Re-enable cart after completion - poll until active
      const pollCartStatus = async () => {
        for (let i = 0; i < 10; i++) {
          await new Promise(resolve => setTimeout(resolve, 500));
          await queryClient.invalidateQueries({ queryKey: queryKeys.cart.isActive });
          await queryClient.refetchQueries({ queryKey: queryKeys.cart.isActive });
        }
      };
      pollCartStatus();
    }
    else {
      console.log('Workflow status not terminal:', checkoutStatus.status);
      // Reset workflowFailed if status is not FAILED
      if (workflowFailed) {
        setWorkflowFailed(false);
      }
    }
    console.log('========================================');
  }, [checkoutStatus, orderId, queryClient]);

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      const price = Number(item.price ?? 0);
      return total + (isNaN(price) ? 0 : price * item.quantity);
    }, 0);
  };

  const handleProceedToPayment = async () => {
    // If we have an order with payment intent, just go to payment step
    if (order?.clientSecret) {
      setClientSecret(order.clientSecret);
      setCurrentStep('payment');
      return;
    }

    if (!selectedAddressId) {
      setError('Please select a shipping address');
      return;
    }

    const selectedAddress = addresses.find(addr => addr.addressId?.toString() === selectedAddressId?.toString());

    if (!selectedAddress) {
      setError('Invalid address selected');
      return;
    }

    setError(null);
    
    // Generate UUID for idempotency key
    const idempotencyKey = uuidv4();

    try {
      // Start checkout workflow
      const checkoutResponse = await checkout.mutateAsync({
        userId: user.userId,
        address: {
          street: selectedAddress.street,
          city: selectedAddress.city,
          state: selectedAddress.state,
          postalCode: selectedAddress.zipCode,
          country: selectedAddress.country
        },
        idempotencyKey
      });

      console.log('Checkout started:', checkoutResponse);
      
      // Invalidate cart active status after checkout workflow starts
      // Add a small delay to ensure backend has processed the cart deactivation
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: queryKeys.cart.isActive });
      }, 500);
      
      // Poll for the order to be created by the workflow
      let attempts = 0;
      const maxAttempts = 30;
      
      const pollForOrder = async () => {
        try {
          const ordersResponse = await ordersAPI.getOrders(
            { buyerId: user.userId, status: 'PENDING', type: 'FIXED_PRICE' },
            0,
            1,
            'createdAt,DESC'
          );
          
          if (ordersResponse.content && ordersResponse.content.length > 0) {
            const order = ordersResponse.content[0];
            console.log('Found order:', order);
            
            // Create payment intent for this order
            const items = order.orderItems?.map(item => ({
              sellerId: item.sellerId || order.sellerId,
              amount: Math.round(Number(item.subtotal))
            })) || [];
            
            const paymentRequest = {
              orderId: order.id,
              currency: 'usd',
              type: 'FIXED_PRICE',
              items: items
            };
            
            try {
              const paymentResponse = await createPaymentIntent.mutateAsync(paymentRequest);
              console.log('Payment intent created:', paymentResponse);
              
              // Update the order in cache with the clientSecret
              queryClient.setQueryData(queryKeys.orders.order(order.id), (oldData) => ({
                ...oldData,
                ...order,
                clientSecret: paymentResponse.clientSecret
              }));
              
              // Navigate to the order-specific URL
              navigate(`/checkout/${order.id}`, { replace: true });
            } catch (paymentError) {
              console.error('Payment intent creation failed:', paymentError);
              const errorMessage = paymentError.response?.data?.detail || 
                                   paymentError.response?.data?.message || 
                                   'Failed to create payment intent. Please try again.';
              toast.error(errorMessage);
              setError(errorMessage);
              // Stop polling on payment intent error
              return;
            }
          } else if (attempts < maxAttempts) {
            attempts++;
            setTimeout(pollForOrder, 1000);
          } else {
            const errorMessage = 'Failed to create order. Please try again.';
            toast.error(errorMessage);
            setError(errorMessage);
          }
        } catch (err) {
          console.error('Error polling for order:', err);
          if (attempts < maxAttempts) {
            attempts++;
            setTimeout(pollForOrder, 1000);
          } else {
            const errorMessage = 'Failed to create order. Please try again.';
            toast.error(errorMessage);
            setError(errorMessage);
          }
        }
      };
      
      setTimeout(pollForOrder, 1000);

    } catch (err) {
      console.error('Checkout error:', err);
      const errorMessage = err.response?.data?.detail || 
                          err.response?.data?.message || 
                          'Failed to start checkout';
      toast.error(errorMessage);
      setError(errorMessage);
    }
  };

  const handlePaymentSuccess = () => {
    // Payment succeeded, show processing state
    setCurrentStep('processing');
  };

  const handlePaymentError = (errorMessage) => {
    setError(errorMessage);
  };

  const handleCancelCheckout = async () => {
    if (!orderId) {
      navigate('/cart');
      return;
    }

    try {
      await cancelCheckout.mutateAsync(orderId);
      // Re-enable cart after cancellation - poll until active
      const pollCartStatus = async () => {
        for (let i = 0; i < 10; i++) {
          await new Promise(resolve => setTimeout(resolve, 500));
          await queryClient.invalidateQueries({ queryKey: queryKeys.cart.isActive });
          await queryClient.refetchQueries({ queryKey: queryKeys.cart.isActive });
        }
      };
      pollCartStatus();
      navigate('/cart');
    } catch (err) {
      console.error('Cancel checkout error:', err);
      setError('Failed to cancel checkout. Please try again.');
    }
  };

  if (isLoadingCart || isLoadingAddresses || isLoadingOrder) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <div className="animate-ping absolute inset-0 rounded-full h-12 w-12 border border-primary/50 mx-auto"></div>
          </div>
          <p className="text-muted-foreground animate-pulse">Loading checkout...</p>
        </div>
      </div>
    );
  }

  // If we have orderId but no order data, show error
  if (orderId && !order) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-6 max-w-md">
          <AlertCircle className="h-24 w-24 text-destructive mx-auto opacity-50" />
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Order Not Found</h2>
            <p className="text-muted-foreground">The order you're looking for doesn't exist or you don't have access to it.</p>
          </div>
          <Button asChild size="lg">
            <Link to="/cart">Back to Cart</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Show order completion status
  if (order && (order.status === 'COMPLETED' || order.status === 'CONFIRMED')) {
    console.log('========== RENDERING SUCCESS SCREEN ==========');
    console.log('Order status:', order.status);
    console.log('Order ID:', order.id);
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
            <h2 className="text-2xl font-bold text-green-600">Order Complete!</h2>
            <p className="text-muted-foreground">Your order has been successfully placed.</p>
          </div>
          <div className="space-y-2 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
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
              <span className="font-semibold text-lg text-green-600">${Number(order.totalAmount || 0).toFixed(2)}</span>
            </div>
          </div>
          <div className="flex gap-3">
            <Button asChild size="lg" variant="outline" className="flex-1 hover:scale-105 transition-transform">
              <Link to="/">Continue Shopping</Link>
            </Button>
            <Button asChild size="lg" className="flex-1 hover:scale-105 transition-transform">
              <Link to="/my-orders">View Orders</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show order failure status (either from order status OR workflow failure)
  if ((order && (order.status === 'FAILED' || order.status === 'CANCELLED')) || workflowFailed) {
    console.log('========== RENDERING FAILURE SCREEN ==========');
    console.log('Order status:', order?.status);
    console.log('Workflow failed:', workflowFailed);
    console.log('Order ID:', order?.id);
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
            <h2 className="text-2xl font-bold text-destructive">Order {formatStatus(order?.status || 'FAILED')}</h2>
            <p className="text-muted-foreground">
              {(order?.status === 'FAILED' || workflowFailed)
                ? 'There was an issue processing your order. Please try again.'
                : 'This order has been cancelled.'}
            </p>
          </div>
          <div className="space-y-2 p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Order ID:</span>
              <span className="font-mono font-semibold">{order?.id || orderId}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Status:</span>
              <Badge variant="destructive">{formatStatus(order?.status || 'FAILED')}</Badge>
            </div>
          </div>
          <Button asChild size="lg" className="w-full hover:scale-105 transition-transform">
            <Link to="/cart">Back to Cart</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Only check cart if we don't have an orderId (initial checkout)
  if (!orderId && cartItems.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-6 max-w-md">
          <Package className="h-24 w-24 text-muted-foreground mx-auto opacity-50" />
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Your cart is empty</h2>
            <p className="text-muted-foreground">Add items to your cart before checking out</p>
          </div>
          <Button asChild size="lg">
            <Link to="/">Start Shopping</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <Button variant="ghost" asChild className="mb-4">
          <Link to="/cart">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Cart
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Checkout</h1>
        <p className="text-muted-foreground mt-2">Complete your purchase</p>
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

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Checkout Flow */}
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1: Address Selection */}
          {currentStep === 'address' && (
            <Card className="shadow-md animate-in fade-in slide-in-from-bottom-4 duration-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Shipping Address
                </CardTitle>
                <CardDescription>Select where you want your items delivered</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                {addresses.length === 0 ? (
                  <div className="text-center py-8 space-y-4">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
                      <MapPin className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground">You haven't added any addresses yet</p>
                    <Button onClick={() => setIsAddressModalOpen(true)} size="lg">
                      Add Address
                    </Button>
                  </div>
                ) : (
                  <RadioGroup 
                    value={selectedAddressId?.toString()} 
                    onValueChange={(value) => {
                      console.log('RadioGroup onValueChange called with:', value);
                      setSelectedAddressId(value);
                    }}
                    className="space-y-3"
                  >
                    {addresses.map((address) => (
                      <label 
                        key={address.addressId} 
                        htmlFor={`address-${address.addressId}`}
                        onClick={() => console.log('Label clicked for address:', address.addressId)}
                        className={`flex items-start gap-3 rounded-lg border-2 p-4 cursor-pointer transition-all hover:scale-[1.01] ${
                          selectedAddressId?.toString() === address.addressId?.toString()
                            ? 'border-primary bg-primary/5 shadow-md'
                            : 'border-border hover:border-primary/50 hover:bg-accent/50 hover:shadow-sm'
                        }`}
                      >
                        <RadioGroupItem 
                          value={address.addressId?.toString()} 
                          id={`address-${address.addressId}`}
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="font-semibold text-base hover:text-primary transition-colors">{address.street}</div>
                          <div className="text-sm text-muted-foreground">
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
                    onClick={handleProceedToPayment} 
                    disabled={!selectedAddressId || checkout.isPending || createPaymentIntent.isPending}
                    className="w-full hover:scale-[1.02] transition-transform"
                    size="lg"
                  >
                    {(checkout.isPending || createPaymentIntent.isPending) ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {checkout.isPending ? 'Starting Checkout...' : 'Creating Payment...'}
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
            <Card className="shadow-md animate-in fade-in slide-in-from-bottom-4 duration-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Payment Information
                </CardTitle>
                <CardDescription>Enter your payment details securely</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
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
            <Card className="shadow-md">
              <CardContent className="pt-6">
                <div className="text-center space-y-4 py-8">
                  <div className="relative inline-block">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Processing your order</h3>
                    <p className="text-sm text-muted-foreground mt-2">
                      Please wait while we finalize your purchase...
                    </p>
                  </div>
                  {checkoutStatus && (
                    <>
                      <Badge variant="secondary" className="animate-pulse">{checkoutStatus.status}</Badge>
                      {console.log('Rendering processing step with status:', checkoutStatus.status)}
                      {console.log('Order status:', order?.status)}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              {/* Items */}
              <div className="space-y-3">
                {(order?.orderItems || cartItems).map((item) => {
                  const isOrderItem = !!item.subtotal;
                  const itemId = isOrderItem ? item.id : item.productId;
                  
                  return (
                    <OrderItemDisplay key={itemId} item={item} isOrderItem={isOrderItem} />
                  );
                })}
              </div>

              <Separator />

              {/* Pricing */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">${(order?.totalAmount || calculateTotal()).toFixed(2)}</span>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-primary">${(order?.totalAmount || calculateTotal()).toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

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
