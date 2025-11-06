import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCartItems } from '../hooks/useCart';
import { useAddresses } from '../hooks/useAddress';
import { useCheckout, useOrder, useCheckoutStatus } from '../hooks/useOrders';
import { useCreatePaymentIntent } from '../hooks/usePayments';
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

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// Format status to proper case
const formatStatus = (status) => {
  if (!status) return '';
  return status.charAt(0) + status.slice(1).toLowerCase();
};

const CheckoutForm = ({ clientSecret, orderId, onSuccess, onError }) => {
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
      <Button 
        type="submit" 
        disabled={!stripe || isProcessing} 
        className="w-full"
        size="lg"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          'Authorize Payment'
        )}
      </Button>
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

  const { data: cartItems = [], isLoading: isLoadingCart } = useCartItems();
  const { data: addresses = [], isLoading: isLoadingAddresses, refetch: refetchAddresses } = useAddresses();
  const { data: order, isLoading: isLoadingOrder } = useOrder(orderId, { enabled: !!orderId });
  const checkout = useCheckout();
  const createPaymentIntent = useCreatePaymentIntent();
  
  // Poll for checkout status when processing
  const { data: checkoutStatus } = useCheckoutStatus(orderId, {
    enabled: !!orderId && currentStep === 'processing',
    refetchInterval: 2000 // Poll every 2 seconds
  });

  // Determine current step based on order state (for resuming checkout)
  useEffect(() => {
    if (!orderId || !order) return;

    console.log('Determining step for order:', order);
    console.log('Order has clientSecret:', !!order.clientSecret);
    console.log('Order paymentStatus:', order.paymentStatus);
    console.log('Order shippingAddress:', order.shippingAddress);

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
  }, [orderId, order, addresses]);

  // Handle checkout status changes (when polling during processing)
  useEffect(() => {
    if (!checkoutStatus || !orderId) return;
    
    console.log('Checkout status updated:', checkoutStatus);
    
    // Refetch the order to get updated status
    queryClient.invalidateQueries({ queryKey: queryKeys.orders.order(orderId) });
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
              amount: Math.round(Number(item.subtotal) * 100)
            })) || [];
            
            const paymentRequest = {
              orderId: order.id,
              currency: 'usd',
              type: 'FIXED_PRICE',
              items: items
            };
            
            const paymentResponse = await createPaymentIntent.mutateAsync(paymentRequest);
            console.log('Payment intent created:', paymentResponse);
            
            // Set clientSecret and go to payment step
            setClientSecret(paymentResponse.clientSecret);
            setCurrentStep('payment');
            
            // Update URL without navigation (for state persistence)
            window.history.replaceState(null, '', `/checkout/${order.id}`);
          } else if (attempts < maxAttempts) {
            attempts++;
            setTimeout(pollForOrder, 1000);
          } else {
            setError('Failed to create order. Please try again.');
          }
        } catch (err) {
          console.error('Error polling for order:', err);
          if (attempts < maxAttempts) {
            attempts++;
            setTimeout(pollForOrder, 1000);
          } else {
            setError('Failed to create order. Please try again.');
          }
        }
      };
      
      setTimeout(pollForOrder, 1000);

    } catch (err) {
      console.error('Checkout error:', err);
      setError(err.response?.data?.message || 'Failed to start checkout');
    }
  };

  const handlePaymentSuccess = () => {
    // Payment succeeded, show processing state
    setCurrentStep('processing');
  };

  const handlePaymentError = (errorMessage) => {
    setError(errorMessage);
  };

  if (isLoadingCart || isLoadingAddresses || isLoadingOrder) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading checkout...</p>
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
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-6 max-w-md">
          <CheckCircle2 className="h-24 w-24 text-green-500 mx-auto" />
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Order Complete!</h2>
            <p className="text-muted-foreground">Your order has been successfully placed.</p>
          </div>
          <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Order ID:</span>
              <span className="font-mono">{order.id}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Status:</span>
              <Badge variant="default">{formatStatus(order.status)}</Badge>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total:</span>
              <span className="font-semibold">${Number(order.totalAmount || 0).toFixed(2)}</span>
            </div>
          </div>
          <div className="flex gap-3">
            <Button asChild size="lg" variant="outline" className="flex-1">
              <Link to="/">Continue Shopping</Link>
            </Button>
            <Button asChild size="lg" className="flex-1">
              <Link to="/orders">View Orders</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show order failure status
  if (order && (order.status === 'FAILED' || order.status === 'CANCELLED')) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-6 max-w-md">
          <AlertCircle className="h-24 w-24 text-destructive mx-auto opacity-50" />
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Order {formatStatus(order.status)}</h2>
            <p className="text-muted-foreground">
              {order.status === 'FAILED' 
                ? 'There was an issue processing your order. Please try again.'
                : 'This order has been cancelled.'}
            </p>
          </div>
          <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Order ID:</span>
              <span className="font-mono">{order.id}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Status:</span>
              <Badge variant="destructive">{formatStatus(order.status)}</Badge>
            </div>
          </div>
          <Button asChild size="lg" className="w-full">
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Shipping Address
                </CardTitle>
                <CardDescription>Select where you want your items delivered</CardDescription>
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
                  <RadioGroup 
                    value={selectedAddressId?.toString()} 
                    onValueChange={(value) => {
                      console.log('RadioGroup onValueChange called with:', value);
                      setSelectedAddressId(value);
                    }}
                  >
                    {addresses.map((address) => (
                      <label 
                        key={address.addressId} 
                        htmlFor={`address-${address.addressId}`}
                        onClick={() => console.log('Label clicked for address:', address.addressId)}
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

                <Button 
                  onClick={handleProceedToPayment} 
                  disabled={!selectedAddressId || checkout.isPending || createPaymentIntent.isPending}
                  className="w-full"
                  size="lg"
                >
                  {(checkout.isPending || createPaymentIntent.isPending) ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {checkout.isPending ? 'Starting Checkout...' : 'Creating Payment...'}
                    </>
                  ) : (
                    'Proceed to Payment'
                  )}
                </Button>
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
                {(order?.orderItems || cartItems).map((item) => {
                  // Handle both order items and cart items
                  const isOrderItem = !!item.subtotal;
                  const price = isOrderItem ? Number(item.subtotal) : Number(item.price ?? 0);
                  const quantity = isOrderItem ? 1 : item.quantity;
                  const subtotal = isOrderItem ? price : (isNaN(price) ? 0 : price * quantity);
                  const title = isOrderItem ? item.productTitle : item.title;
                  const image = isOrderItem ? item.productImage : item.primaryImage;
                  const itemId = isOrderItem ? item.id : item.productId;

                  return (
                    <div key={itemId} className="flex gap-3">
                      {image ? (
                        <img 
                          src={image} 
                          alt={title} 
                          className="w-16 h-16 object-cover rounded border"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-muted rounded border flex items-center justify-center">
                          <Package className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-sm font-medium truncate">{title}</p>
                        {!isOrderItem && <p className="text-xs text-muted-foreground">Qty: {quantity}</p>}
                        <p className="text-sm font-semibold">${subtotal.toFixed(2)}</p>
                      </div>
                    </div>
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
                <span>${(order?.totalAmount || calculateTotal()).toFixed(2)}</span>
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
