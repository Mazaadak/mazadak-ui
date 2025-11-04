import { useParams, Link, useNavigate } from 'react-router-dom';
import { useOrder } from '../hooks/useOrders';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Separator } from '../components/ui/separator';
import { Badge } from '../components/ui/badge';
import { ArrowLeft, Package, MapPin, CreditCard, Calendar, Loader2, XCircle } from 'lucide-react';

const getStatusVariant = (status) => {
  const variants = {
    'PENDING': 'secondary',
    'CONFIRMED': 'default',
    'SHIPPED': 'default',
    'DELIVERED': 'default',
    'CANCELLED': 'destructive',
    'FAILED': 'destructive'
  };
  return variants[status] || 'outline';
};

const getPaymentStatusVariant = (status) => {
  const variants = {
    'PENDING': 'secondary',
    'AUTHORIZED': 'default',
    'CAPTURED': 'default',
    'FAILED': 'destructive',
    'CANCELLED': 'destructive'
  };
  return variants[status] || 'outline';
};

export const OrderDetailPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: order, isLoading, error } = useOrder(orderId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-6 max-w-md">
          <XCircle className="h-24 w-24 text-destructive mx-auto" />
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Error Loading Order</h2>
            <p className="text-muted-foreground">{error.message}</p>
          </div>
          <Button asChild size="lg">
            <Link to="/my-orders">Back to Orders</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-6 max-w-md">
          <Package className="h-24 w-24 text-muted-foreground mx-auto opacity-50" />
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Order Not Found</h2>
            <p className="text-muted-foreground">We couldn't find the order you're looking for</p>
          </div>
          <Button asChild size="lg">
            <Link to="/my-orders">Back to Orders</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Verify user owns this order
  if (order.buyerId !== user?.userId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-6 max-w-md">
          <XCircle className="h-24 w-24 text-destructive mx-auto" />
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Access Denied</h2>
            <p className="text-muted-foreground">You don't have permission to view this order</p>
          </div>
          <Button asChild size="lg">
            <Link to="/my-orders">Back to Orders</Link>
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
          <Link to="/my-orders">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Orders
          </Link>
        </Button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">Order Details</h1>
            <p className="text-muted-foreground mt-2">Order #{orderId}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={getStatusVariant(order.status)} className="text-base px-3 py-1">
              {order.status}
            </Badge>
            <Badge variant="outline" className="text-base px-3 py-1">
              {order.type}
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.orderItems?.map((item, index) => (
                  <div key={item.id}>
                    {index > 0 && <Separator className="my-4" />}
                    <div className="flex gap-4">
                      {item.productImageUrl ? (
                        <img 
                          src={item.productImageUrl} 
                          alt={item.productName} 
                          className="w-24 h-24 object-cover rounded border"
                        />
                      ) : (
                        <div className="w-24 h-24 bg-muted rounded border flex items-center justify-center">
                          <Package className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{item.productName}</h3>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-sm text-muted-foreground">
                            Quantity: {item.quantity}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            Unit Price: ${Number(item.unitPrice).toFixed(2)}
                          </span>
                        </div>
                        <p className="text-lg font-semibold mt-2">
                          Subtotal: ${(Number(item.unitPrice) * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Shipping Address */}
          {order.shippingAddress && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm space-y-1">
                  <p className="font-medium">{order.shippingAddress.street}</p>
                  <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</p>
                  <p>{order.shippingAddress.country}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Payment Status</span>
                <Badge variant={getPaymentStatusVariant(order.paymentStatus)}>
                  {order.paymentStatus}
                </Badge>
              </div>
              {order.paymentIntentId && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Payment ID</span>
                  <span className="text-sm font-mono">{order.paymentIntentId}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Order Summary */}
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">${Number(order.totalAmount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-medium">Included</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax</span>
                  <span className="font-medium">Included</span>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>${Number(order.totalAmount).toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Order Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Order Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {order.createdAt && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Order Placed</span>
                  <span className="font-medium">
                    {new Date(order.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              )}
              {order.updatedAt && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Last Updated</span>
                  <span className="font-medium">
                    {new Date(order.updatedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Additional Info */}
          {order.type === 'AUCTION' && order.auctionId && (
            <Card>
              <CardHeader>
                <CardTitle>Auction Details</CardTitle>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="w-full">
                  <Link to={`/auctions/${order.auctionId}`}>
                    View Auction
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
