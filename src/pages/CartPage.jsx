import { useCartItems, useAddToCart, useRemoveFromCart, useUpdateCartItem, useClearCart, useIsCartActive } from '../hooks/useCart';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Separator } from '../components/ui/separator';
import { Minus, Plus, Trash2, ShoppingCartIcon, Package } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { toast } from 'sonner';

export const CartPage = () => {
  const navigate = useNavigate();
  const { data: cartItems = [], isLoading, error } = useCartItems();
  const { data: isCartActive, isLoading: isLoadingCartStatus } = useIsCartActive();
  const addToCart = useAddToCart();
  const removeFromCart = useRemoveFromCart();
  const updateCartItem = useUpdateCartItem();
  const clearCart = useClearCart();

  // Redirect to home if cart is inactive
  useEffect(() => {
    if (!isLoadingCartStatus && isCartActive === false) {
      toast.error('Cart is currently unavailable during checkout');
      navigate('/', { replace: true });
    }
  }, [isCartActive, isLoadingCartStatus, navigate]);

  if (isLoading || isLoadingCartStatus) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <div className="animate-ping absolute inset-0 rounded-full h-12 w-12 border border-primary/50 mx-auto"></div>
          </div>
          <p className="text-muted-foreground animate-pulse">Loading your cart...</p>
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
              <h3 className="font-semibold text-lg">Error Loading Cart</h3>
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

  const handleIncrease = (item) => {
    updateCartItem.mutate({ productId: item.productId, quantity: item.quantity + 1 });
  };

  const handleDecrease = (item) => {
    if (item.quantity > 1) {
      updateCartItem.mutate({ productId: item.productId, quantity: item.quantity - 1 });
    } else {
      removeFromCart.mutate(item.productId);
    }
  };

  const handleRemove = (item) => {
    removeFromCart.mutate(item.productId);
  };

  const handleClear = () => {
    clearCart.mutate();
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      const price = Number(item.price ?? 0);
      return total + (isNaN(price) ? 0 : price * item.quantity);
    }, 0);
  };

  if (cartItems.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-6 max-w-md">
          <ShoppingCartIcon className="h-24 w-24 text-muted-foreground mx-auto opacity-50" />
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Your cart is empty</h2>
            <p className="text-muted-foreground">Looks like you haven't added anything to your cart yet</p>
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <ShoppingCartIcon className="h-8 w-8 text-primary" />
          Shopping Cart
        </h1>
        <p className="text-muted-foreground mt-2">
          {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} in your cart
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {cartItems.map((item) => {
            const price = Number(item.price ?? 0);
            const subtotal = isNaN(price) ? 0 : price * item.quantity;

            return (
              <Card key={String(item.productId)} className="shadow-sm hover:shadow-lg transition-all hover:scale-[1.01]">
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    {/* Product Image */}
                    {item.primaryImage ? (
                      <div className="relative group">
                        <img 
                          src={item.primaryImage} 
                          alt={item.title} 
                          className="w-24 h-24 object-cover rounded-lg border transition-transform group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 rounded-lg transition-colors" />
                      </div>
                    ) : (
                      <div className="w-24 h-24 bg-muted rounded-lg border flex items-center justify-center">
                        <Package className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                      
                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg truncate hover:text-primary transition-colors">{item.title}</h3>
                      {item.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {item.description}
                        </p>
                      )}
                      <p className="text-lg font-bold mt-2 text-primary">
                        ${isNaN(price) ? item.price : price.toFixed(2)}
                      </p>
                    </div>

                    {/* Remove Button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemove(item)}
                      disabled={removeFromCart.isPending}
                      className="shrink-0 hover:scale-110 hover:bg-destructive/10 hover:text-destructive transition-all"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <Separator className="my-4" />

                  {/* Quantity Controls & Subtotal */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDecrease(item)}
                        disabled={updateCartItem.isPending || removeFromCart.isPending}
                        className="h-8 w-8 hover:scale-110 transition-transform"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      
                      <span className="w-12 text-center font-medium">
                        {item.quantity}
                      </span>
                      
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleIncrease(item)}
                        disabled={updateCartItem.isPending}
                        className="h-8 w-8 hover:scale-110 transition-transform"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Subtotal</p>
                      <p className="text-lg font-bold text-primary">
                        ${subtotal.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* Clear Cart Button */}
          <Button 
            variant="outline" 
            onClick={handleClear}
            disabled={clearCart.isPending}
            className="w-full hover:scale-[1.02] hover:bg-destructive/10 hover:text-destructive hover:border-destructive transition-all"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {clearCart.isPending ? 'Clearing...' : 'Clear Cart'}
          </Button>
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
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">${calculateTotal().toFixed(2)}</span>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-primary">${calculateTotal().toFixed(2)}</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full hover:scale-[1.02] transition-transform" size="lg">
                <Link to="/checkout">Proceed to Checkout</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};