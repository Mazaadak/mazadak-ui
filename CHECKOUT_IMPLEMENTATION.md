# Checkout and Orders Implementation

## Overview
This implementation provides a complete checkout flow for both fixed-price and auction orders in the Mazadak marketplace.

## Features Implemented

### 1. API Clients
- **`src/api/orders.js`** - Orders API client with endpoints for:
  - Getting orders (with filters and pagination)
  - Checkout workflow
  - Address provision for auction checkout
  - Cancel checkout
  - Poll checkout status

- **`src/api/payments.js`** - Payments and onboarding API client with endpoints for:
  - Create payment intent
  - Capture/cancel payment
  - Refund payment
  - Stripe OAuth URL generation
  - Get connected Stripe account

### 2. React Query Hooks
- **`src/hooks/useOrders.js`** - Custom hooks for orders:
  - `useOrder(orderId)` - Fetch single order
  - `useOrders(filters, page, size, sort)` - Fetch orders with filtering
  - `useCheckout()` - Start checkout workflow
  - `useProvideAddress()` - Provide shipping address for auction checkout
  - `useCancelCheckout()` - Cancel an ongoing checkout
  - `useCheckoutStatus(orderId)` - Poll checkout status (auto-stops when completed/failed)

- **`src/hooks/usePayments.js`** - Custom hooks for payments:
  - `useCreatePaymentIntent()` - Create Stripe payment intent
  - `useCapturePayment()` - Capture authorized payment
  - `useCancelPayment()` - Cancel payment
  - `useRefundPayment()` - Refund payment
  - `useGetStripeOAuthUrl()` - Get Stripe onboarding URL
  - `useStripeAccount(sellerId)` - Check if seller has Stripe account

### 3. Pages

#### Fixed-Price Checkout (`src/pages/CheckoutPage.jsx`)
**Flow:**
1. User views cart items and order summary
2. Selects shipping address from saved addresses
3. Clicks "Proceed to Payment"
4. Checkout workflow starts (backend creates order)
5. Payment intent is created
6. User enters payment details via Stripe Elements
7. Payment is authorized (not captured yet)
8. UI polls checkout status
9. On completion, redirects to success page

**Features:**
- Address selection with radio buttons
- Order summary sidebar with item preview
- Stripe Elements integration for secure payment
- Real-time status polling
- Error handling and display

#### Auction Checkout (`src/pages/AuctionCheckoutPage.jsx`)
**Flow:**
1. User receives email with order link after winning auction
2. Opens link to auction checkout page
3. Views auction win notice and order details
4. Selects shipping address
5. Provides address to workflow
6. Payment intent is created
7. Authorizes payment
8. UI polls checkout status
9. On completion, redirects to success page

**Features:**
- Order ownership verification
- Auction winner notification banner
- Cancel checkout option (with confirmation dialog)
- Address selection
- Stripe payment integration
- Status polling

#### Order Success (`src/pages/OrderSuccessPage.jsx`)
- Success confirmation with checkmark
- Order details display
- Order items with images
- Shipping address
- Order and payment status badges
- Navigation to orders list or continue shopping

#### My Orders (`src/pages/MyOrdersPage.jsx`)
- List all user orders with pagination
- Filter by order type (All, Auction, Fixed Price)
- Order cards showing:
  - Order ID and status badges
  - Order date
  - Items preview (first 3 items)
  - Total amount
  - Payment status
- Click to view order details
- Empty states for no orders

### 4. UI Components
- **`src/components/ui/radio-group.jsx`** - Radio button component for address selection

### 5. Routing Updates
Added routes in `src/App.jsx`:
- `/checkout` - Fixed-price checkout
- `/auction-checkout/:orderId` - Auction checkout
- `/order-success/:orderId` - Order success page
- `/my-orders` - User's orders list

Updated navbar to include "My Orders" link in profile dropdown.

## Configuration

### Environment Variables
Create a `.env` file (see `.env.example`):

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
VITE_API_BASE_URL=http://localhost:18090
```

### Dependencies Installed
```json
{
  "@stripe/stripe-js": "^latest",
  "@stripe/react-stripe-js": "^latest",
  "@radix-ui/react-radio-group": "^latest"
}
```

## Usage

### Fixed-Price Checkout Flow
1. User adds items to cart (`/cart`)
2. Clicks "Proceed to Checkout" button
3. Redirected to `/checkout`
4. Selects address and completes payment
5. Redirected to `/order-success/:orderId`

### Auction Checkout Flow
1. User wins auction
2. Backend creates order and sends email with link
3. Link format: `/auction-checkout/:orderId`
4. User completes address and payment
5. Redirected to `/order-success/:orderId`

### Viewing Orders
- Navigate to "My Orders" from profile dropdown
- Filter by order type
- Click on order to view details
- Pagination for large order lists

## Backend Integration

### Required Backend Endpoints
✅ All endpoints documented in the task are integrated:

**Orders Service:**
- `GET /orders/{id}` - Get order by ID
- `GET /orders` - Get orders with filters
- `POST /orders/checkout` - Start checkout (with Idempotency-Key header)
- `POST /orders/checkout/{orderId}/address` - Provide address for auction
- `POST /orders/checkout/{orderId}/cancel` - Cancel checkout
- `GET /orders/checkout/{orderId}/status` - Get checkout workflow status

**Payment Service:**
- `POST /payments/create-payment-intent` - Create payment intent
- `POST /payments/{orderId}/capture` - Capture payment
- `POST /payments/{orderId}/cancel` - Cancel payment
- `POST /payments/refund` - Refund payment
- `POST /payments/stripe-webhook` - Stripe webhook handler

**Onboarding Service:**
- `POST /onboarding/oauth/url` - Get Stripe OAuth URL
- `GET /onboarding/get-account/{sellerId}` - Get Stripe account ID

### Workflow Status Polling
The checkout status endpoint is polled every 2 seconds until:
- Status becomes `COMPLETED` → Redirect to success page
- Status becomes `FAILED` → Show error and reset to address step

## Stripe Integration

### Payment Flow
1. **Authorization Phase** (in checkout):
   - Create payment intent with `capture_method: manual`
   - User authorizes payment
   - Funds are held but not captured
   
2. **Capture Phase** (after workflow completion):
   - Backend captures payment via webhook
   - Order is finalized
   - User receives confirmation

3. **Cancellation** (if needed):
   - Cancel payment intent releases held funds
   - No charge to customer

### Stripe Elements
Payment form uses Stripe Elements for PCI compliance:
- Secure card input
- Real-time validation
- Built-in error handling
- Customizable styling

## Security Considerations

1. **Authentication**: All routes protected by `ProtectedLayout`
2. **Authorization**: Backend validates `X-User-Id` header (set by gateway)
3. **Idempotency**: Checkout uses idempotency keys to prevent duplicate orders
4. **Order Ownership**: Auction checkout verifies buyer ID matches authenticated user
5. **PCI Compliance**: Card details never touch your server (handled by Stripe)

## Error Handling

- Network errors displayed in error cards
- Validation errors shown inline
- Payment errors from Stripe displayed to user
- Workflow failures trigger retry or cancellation options
- Empty states for cart/orders/addresses

## Future Enhancements

### Potential Additions:
1. **Stripe Account Connection UI**
   - Add seller onboarding flow
   - Check Stripe account status before allowing sales
   - Display connection status in settings

2. **Order Details Page**
   - Detailed view for single order
   - Track shipment
   - Contact seller
   - Leave review

3. **Order Management (Seller Side)**
   - View incoming orders
   - Mark as shipped
   - Handle returns/refunds

4. **Multiple Addresses**
   - Add new address during checkout
   - Edit addresses inline
   - Set default address

5. **Payment Methods**
   - Save cards for future use
   - Multiple payment methods
   - Apple Pay / Google Pay

6. **Notifications**
   - Real-time order updates
   - Email notifications
   - Push notifications

7. **Analytics**
   - Order history charts
   - Spending analysis
   - Order statistics

## Testing Checklist

### Fixed-Price Checkout
- [ ] Add items to cart
- [ ] View cart with correct totals
- [ ] Proceed to checkout
- [ ] Select address
- [ ] Complete payment with test card
- [ ] Verify workflow polling
- [ ] Check success page
- [ ] Verify order appears in "My Orders"

### Auction Checkout
- [ ] Win an auction (or create test order)
- [ ] Access auction checkout via direct link
- [ ] Verify order ownership check
- [ ] Select address
- [ ] Complete payment
- [ ] Test cancel checkout
- [ ] Verify success page
- [ ] Check order in "My Orders"

### Stripe Test Cards
```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
Auth Required: 4000 0027 6000 3184
```

## Notes

- Orders are created by the backend workflow, not directly by the UI
- Payment is authorized but not captured until workflow completes
- Checkout status polling automatically stops when completed/failed
- All monetary amounts are in cents on the backend (converted in UI)
- Idempotency keys prevent duplicate checkouts on retry

## Support

For issues or questions:
1. Check browser console for errors
2. Verify environment variables are set
3. Ensure backend services are running
4. Check network tab for failed requests
5. Review Stripe dashboard for payment issues
