import { useParams, Link } from 'react-router-dom';
import { useOrder } from '../hooks/useOrders';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Separator } from '../components/ui/separator';
import { Badge } from '../components/ui/badge';
import { CheckCircle2, Package, MapPin, Loader2 } from 'lucide-react';

export const OrderSuccessPage = () => {
  const { orderId } = useParams();
  const { data: order, isLoading } = useOrder(orderId);

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
            <Link to="/">Go Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Success Header */}
      <div className="text-center mb-8 space-y-4">
        <div className="flex justify-center">
          <div className="rounded-full bg-green-100 dark:bg-green-900/20 p-6">
            <CheckCircle2 className="h-16 w-16 text-green-600 dark:text-green-400" />
          </div>
        </div>
        <div>
          <h1 className="text-3xl font-bold">Order Successful!</h1>
          <p className="text-muted-foreground mt-2">
            Thank you for your purchase. Your order has been confirmed.
          </p>
        </div>
        <Badge variant="outline" className="text-base px-4 py-2">
          Order #{orderId}
        </Badge>
      </div>

      {/* Order Details */}
      <div className="space-y-6">
        {/* Order Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Items */}
            <div className="space-y-4">
              {order.orderItems?.map((item) => (
                <div key={item.id} className="flex gap-4">
                  {item.productImageUrl ? (
                    <img 
                      src={item.productImageUrl} 
                      alt={item.productName} 
                      className="w-20 h-20 object-cover rounded border"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-muted rounded border flex items-center justify-center">
                      <Package className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-medium">{item.productName}</p>
                    <div className="flex items-center gap-4 mt-1">
                      <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                      <p className="text-sm font-semibold">${Number(item.unitPrice).toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Separator />

            {/* Totals */}
            <div className="space-y-2">
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>${Number(order.totalAmount).toFixed(2)}</span>
              </div>
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
              <div className="text-sm">
                <p>{order.shippingAddress.street}</p>
                <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</p>
                <p>{order.shippingAddress.country}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Order Status */}
        <Card>
          <CardHeader>
            <CardTitle>Order Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Order Status</span>
              <Badge>{order.status}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Payment Status</span>
              <Badge>{order.paymentStatus}</Badge>
            </div>
            {order.type && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Order Type</span>
                <Badge variant="outline">{order.type}</Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4 justify-center pt-4">
          <Button asChild variant="outline" size="lg">
            <Link to="/my-orders">View All Orders</Link>
          </Button>
          <Button asChild size="lg">
            <Link to="/">Continue Shopping</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};
