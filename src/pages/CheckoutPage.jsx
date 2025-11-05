import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCartItems } from '../hooks/useCart';
import { useAddresses } from '../hooks/useAddress';
import { useCheckout } from '../hooks/useOrders';
import { useCreatePaymentIntent } from '../hooks/usePayments';
import { ordersAPI } from '../api/orders';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Separator } from '../components/ui/separator';
import { v4 as uuidv4 } from 'uuid';
import { Badge } from '../components/ui/badge';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Label } from '../components/ui/label';
import { ArrowLeft, Package, MapPin, CreditCard, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

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
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [currentStep, setCurrentStep] = useState('address'); // 'address' | 'payment' | 'processing'
  const [workflowInfo, setWorkflowInfo] = useState(null);
  const [orderId, setOrderId] = useState(null);
  const [clientSecret, setClientSecret] = useState(null);
  const [error, setError] = useState(null);

  const { data: cartItems = [], isLoading: isLoadingCart } = useCartItems();
  const { data: addresses = [], isLoading: isLoadingAddresses } = useAddresses();
  const checkout = useCheckout();
  const createPaymentIntent = useCreatePaymentIntent();
  
  console.log('CheckoutPage - selectedAddressId:', selectedAddressId);
  console.log('CheckoutPage - addresses:', addresses);
  
  // Note: We don't poll for checkout status in fixed-price checkout
  // The payment confirmation from Stripe is sufficient
  // Status polling is only used in auction checkout where orderId comes from URL

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      const price = Number(item.price ?? 0);
      return total + (isNaN(price) ? 0 : price * item.quantity);
    }, 0);
  };

  const handleProceedToPayment = async () => {
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
      setWorkflowInfo(checkoutResponse);
      
      // Poll for the order to be created by the workflow
      // We'll check every second for up to 30 seconds
      let attempts = 0;
      const maxAttempts = 30;
      
      const pollForOrder = async () => {
        try {
          // Get the most recent pending order for this user
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
            // Map order items to cart items format expected by backend
            const items = order.orderItems?.map(item => ({
              sellerId: item.sellerId || order.sellerId,
              amount: Math.round(Number(item.subtotal) * 100) // Convert dollars to cents
            })) || [];
            
            const paymentRequest = {
              orderId: order.id,
              currency: 'usd',
              type: 'FIXED_PRICE',
              items: items
            };
            console.log('Creating payment intent with request:', paymentRequest);
            
            const paymentResponse = await createPaymentIntent.mutateAsync(paymentRequest);

            console.log('Payment intent created:', paymentResponse);
            setClientSecret(paymentResponse.clientSecret);
            setOrderId(order.id);
            setCurrentStep('payment');
          } else if (attempts < maxAttempts) {
            attempts++;
            setTimeout(pollForOrder, 1000);
          } else {
            setError('Failed to create order. Please try again.');
            setCurrentStep('address');
          }
        } catch (err) {
          console.error('Error polling for order:', err);
          if (attempts < maxAttempts) {
            attempts++;
            setTimeout(pollForOrder, 1000);
          } else {
            setError('Failed to create order. Please try again.');
            setCurrentStep('address');
          }
        }
      };
      
      // Start polling after a brief delay
      setTimeout(pollForOrder, 1000);

    } catch (err) {
      console.error('Checkout error:', err);
      setError(err.response?.data?.message || 'Failed to start checkout');
    }
  };

  const handlePaymentSuccess = () => {
    // Payment succeeded, navigate directly to success page
    navigate(`/order-success/${orderId}`);
  };

  const handlePaymentError = (errorMessage) => {
    setError(errorMessage);
  };

  if (isLoadingCart || isLoadingAddresses) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
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
                    <Button asChild>
                      <Link to="/address">Add Address</Link>
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
                {cartItems.map((item) => {
                  const price = Number(item.price ?? 0);
                  const subtotal = isNaN(price) ? 0 : price * item.quantity;

                  return (
                    <div key={item.productId} className="flex gap-3">
                      {item.primaryImage ? (
                        <img 
                          src={item.primaryImage} 
                          alt={item.title} 
                          className="w-16 h-16 object-cover rounded border"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-muted rounded border flex items-center justify-center">
                          <Package className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.title}</p>
                        <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
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
                  <span className="font-medium">${calculateTotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-medium">Calculated at checkout</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax</span>
                  <span className="font-medium">Calculated at checkout</span>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>${calculateTotal().toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
