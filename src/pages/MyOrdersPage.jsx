import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useOrders } from '../hooks/useOrders';
import { useProduct } from '../hooks/useProducts';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Separator } from '../components/ui/separator';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Package, Loader2, AlertCircle, ShoppingCart, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

// Component to display order item with product image
const OrderItemDisplay = ({ item }) => {
  const { data: product, isLoading: isProductLoading } = useProduct(item.productId);

  return (
    <div className="flex gap-3">
      <div className="relative w-16 h-16 rounded-lg border overflow-hidden bg-muted flex-shrink-0 group">
        {isProductLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <img 
              src={product?.images?.[0]?.imageUri || '/placeholder.png'} 
              alt={item.productName} 
              className="w-full h-full object-cover transition-transform group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
          </>
        )}
      </div>
      <div className="flex-1 min-w-0 text-left">
        <p className="text-sm font-medium truncate hover:text-primary transition-colors">{item.productName}</p>
        <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
        <p className="text-sm font-semibold text-primary">${Number(item.unitPrice).toFixed(2)}</p>
      </div>
    </div>
  );
};

const formatStatus = (status) => {
  if (!status) return '';
  return status.charAt(0) + status.slice(1).toLowerCase();
};

const getStatusVariant = (status) => {
  const variants = {
    'PENDING': 'secondary',
    'CONFIRMED': 'default',
    'COMPLETED': 'default',
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
    'REFUNDED': 'destructive'
  };
  return variants[status] || 'outline';
};

// Check if order needs checkout completion
const needsCheckout = (order) => {
  return order.status === 'PENDING' && 
         (order.paymentStatus === 'PENDING' || order.paymentStatus === 'AUTHORIZED');
};

export const MyOrdersPage = () => {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState('purchases'); // 'purchases' | 'sales'
  const [orderTypeFilter, setOrderTypeFilter] = useState('all'); // 'all' | 'AUCTION' | 'FIXED_PRICE'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | status value
  const [page, setPage] = useState(0);
  const pageSize = 10;

  // Build filters based on selections
  const filters = {
    ...(viewMode === 'purchases' && { buyerId: user?.userId }),
    ...(viewMode === 'sales' && { sellerIds: [user?.userId] }),
    ...(orderTypeFilter !== 'all' && { type: orderTypeFilter }),
    ...(statusFilter !== 'all' && { status: statusFilter }),
  };

  const { data: ordersData, isLoading, error } = useOrders(filters, page, pageSize, 'createdAt,DESC');

  const orders = ordersData?.content || [];
  const totalPages = ordersData?.totalPages || 0;

  // Reset page when filters change
  const handleFilterChange = (filterType, value) => {
    setPage(0);
    if (filterType === 'viewMode') setViewMode(value);
    if (filterType === 'orderType') setOrderTypeFilter(value);
    if (filterType === 'status') setStatusFilter(value);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <div className="animate-ping absolute inset-0 rounded-full h-12 w-12 border border-primary/50 mx-auto"></div>
          </div>
          <p className="text-muted-foreground animate-pulse">Loading orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
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
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-left">My Orders</h1>
        <p className="text-muted-foreground mt-2 text-left">
          Track and manage your orders
        </p>
      </div>

      {/* View Mode Toggle & Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {/* View Mode Toggle */}
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'purchases' ? 'default' : 'outline'}
            onClick={() => handleFilterChange('viewMode', 'purchases')}
            className="flex-1 sm:flex-initial"
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            My Purchases
          </Button>
          <Button
            variant={viewMode === 'sales' ? 'default' : 'outline'}
            onClick={() => handleFilterChange('viewMode', 'sales')}
            className="flex-1 sm:flex-initial"
          >
            <Package className="mr-2 h-4 w-4" />
            My Sales
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-1">
          <Select value={orderTypeFilter} onValueChange={(value) => handleFilterChange('orderType', value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Order Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="FIXED_PRICE">Fixed Price</SelectItem>
              <SelectItem value="AUCTION">Auction</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={(value) => handleFilterChange('status', value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="CONFIRMED">Confirmed</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
              <SelectItem value="FAILED">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      {/* Orders List */}
      <div className="space-y-4">
        {orders.length === 0 ? (
          <div className="flex items-center justify-center min-h-[40vh]">
            <div className="text-center space-y-6 max-w-md">
              <Package className="h-24 w-24 text-muted-foreground mx-auto opacity-50" />
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">No Orders Found</h2>
                <p className="text-muted-foreground">
                  {viewMode === 'purchases' 
                    ? "You haven't placed any orders yet" 
                    : "You haven't made any sales yet"}
                </p>
              </div>
              <Button asChild size="lg">
                <Link to="/">{viewMode === 'purchases' ? 'Start Shopping' : 'Create Listing'}</Link>
              </Button>
            </div>
          </div>
        ) : (
          <>
            {orders.map((order) => {
              const incompleteCheckout = needsCheckout(order);
              
              return (
                <Card key={order.id} className="hover:shadow-lg transition-all hover:scale-[1.01]">
                  <CardContent className="p-6">
                    <div className="flex flex-col gap-4">
                      {/* Order Header */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-lg truncate">
                              Order #{order.id.slice(0, 8)}
                            </h3>
                            <Badge variant={getStatusVariant(order.status)} className="hover:scale-105 transition-transform">
                              {formatStatus(order.status)}
                            </Badge>
                            <Badge variant="outline" className="hover:scale-105 transition-transform">{order.type === 'FIXED_PRICE' ? 'Fixed Price' : 'Auction'}</Badge>
                            {incompleteCheckout && (
                              <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-100 animate-pulse">
                                <AlertCircle className="mr-1 h-3 w-3" />
                                Checkout Incomplete
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground text-left">
                            {new Date(order.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        {incompleteCheckout && viewMode === 'purchases' && (
                          <Button asChild size="sm" variant="default" className="hover:scale-105 transition-transform">
                            <Link to={order.type === 'AUCTION' ? `/auction-checkout/${order.id}` : `/checkout/${order.id}`}>
                              Continue Checkout
                            </Link>
                          </Button>
                        )}
                      </div>

                      <Separator />

                      {/* Order Items */}
                      <div className="space-y-3">
                        {order.orderItems?.slice(0, 2).map((item) => (
                          <OrderItemDisplay key={item.id} item={item} />
                        ))}
                        {order.orderItems && order.orderItems.length > 2 && (
                          <p className="text-sm text-muted-foreground text-center py-2 px-3 bg-muted/50 rounded-lg">
                            +{order.orderItems.length - 2} more item(s)
                          </p>
                        )}
                      </div>

                      <Separator />

                      {/* Order Footer */}
                      <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-4 flex-wrap">
                          <div className="text-sm">
                            <span className="text-muted-foreground">Payment: </span>
                            <Badge variant={getPaymentStatusVariant(order.paymentStatus)} className="hover:scale-105 transition-transform">
                              {formatStatus(order.paymentStatus)}
                            </Badge>
                          </div>
                          {order.shippingAddress && (
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              Ships to: {order.shippingAddress.city}, {order.shippingAddress.state}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Total</p>
                          <p className="text-xl font-bold text-primary">${Number(order.totalAmount).toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

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
      </div>
    </div>
  );
};
