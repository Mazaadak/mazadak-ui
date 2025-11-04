import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useOrders } from '../hooks/useOrders';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Separator } from '../components/ui/separator';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Package, ShoppingBag, Loader2, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

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

export const MyOrdersPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [page, setPage] = useState(0);
  const pageSize = 10;

  // Build filters based on active tab
  const filters = {
    buyerId: user?.userId,
    ...(activeTab === 'auction' && { type: 'AUCTION' }),
    ...(activeTab === 'fixed-price' && { type: 'FIXED_PRICE' }),
  };

  const { data: ordersData, isLoading, error } = useOrders(filters, page, pageSize, 'createdAt,DESC');

  const orders = ordersData?.content || [];
  const totalPages = ordersData?.totalPages || 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading your orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <Package className="h-12 w-12 text-destructive mx-auto" />
            <div>
              <h3 className="font-semibold text-lg">Error Loading Orders</h3>
              <p className="text-sm text-muted-foreground mt-2">{error.message}</p>
            </div>
            <Button asChild>
              <Link to="/">Return Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <ShoppingBag className="h-8 w-8" />
          My Orders
        </h1>
        <p className="text-muted-foreground mt-2">
          View and track your orders
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => { setActiveTab(value); setPage(0); }} className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">All Orders</TabsTrigger>
          <TabsTrigger value="auction">Auction Orders</TabsTrigger>
          <TabsTrigger value="fixed-price">Fixed Price Orders</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {orders.length === 0 ? (
            <div className="flex items-center justify-center min-h-[40vh]">
              <div className="text-center space-y-6 max-w-md">
                <Package className="h-24 w-24 text-muted-foreground mx-auto opacity-50" />
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold">No Orders Yet</h2>
                  <p className="text-muted-foreground">
                    {activeTab === 'all' 
                      ? "You haven't placed any orders yet" 
                      : `You haven't placed any ${activeTab === 'auction' ? 'auction' : 'fixed price'} orders yet`}
                  </p>
                </div>
                <Button asChild size="lg">
                  <Link to="/">Start Shopping</Link>
                </Button>
              </div>
            </div>
          ) : (
            <>
              {orders.map((order) => (
                <Card key={order.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col gap-4">
                      {/* Order Header */}
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg">Order #{order.id}</h3>
                            <Badge variant={getStatusVariant(order.status)}>
                              {order.status}
                            </Badge>
                            <Badge variant="outline">{order.type}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {new Date(order.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                        <Button asChild variant="ghost" size="sm">
                          <Link to={`/orders/${order.id}`}>
                            View Details
                            <ChevronRight className="ml-1 h-4 w-4" />
                          </Link>
                        </Button>
                      </div>

                      <Separator />

                      {/* Order Items */}
                      <div className="space-y-3">
                        {order.orderItems?.slice(0, 3).map((item) => (
                          <div key={item.id} className="flex gap-3">
                            {item.productImageUrl ? (
                              <img 
                                src={item.productImageUrl} 
                                alt={item.productName} 
                                className="w-16 h-16 object-cover rounded border"
                              />
                            ) : (
                              <div className="w-16 h-16 bg-muted rounded border flex items-center justify-center">
                                <Package className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{item.productName}</p>
                              <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                            </div>
                            <p className="text-sm font-semibold">${Number(item.unitPrice).toFixed(2)}</p>
                          </div>
                        ))}
                        {order.orderItems && order.orderItems.length > 3 && (
                          <p className="text-sm text-muted-foreground text-center">
                            +{order.orderItems.length - 3} more item(s)
                          </p>
                        )}
                      </div>

                      <Separator />

                      {/* Order Footer */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="text-sm">
                            <span className="text-muted-foreground">Payment: </span>
                            <Badge variant={getPaymentStatusVariant(order.paymentStatus)}>
                              {order.paymentStatus}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Total</p>
                          <p className="text-xl font-bold">${Number(order.totalAmount).toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    disabled={page === 0}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {page + 1} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
