import "./App.css";
import { Routes, Route, createBrowserRouter, createRoutesFromElements, RouterProvider, BrowserRouter } from "react-router-dom";
import { MainLayout } from "./layouts/MainLayout";
import { AuthProvider } from "./contexts/AuthContext";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage.jsx";
import { VerifyPage } from "./pages/VerifyPage.jsx";
import { ThemeProvider } from "./components/providers/ThemeProvider.jsx";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage.jsx";
import { ProtectedLayout } from "./layouts/ProtectedLayout.jsx";
import { ResetPasswordPage } from "./pages/ResetPasswordPage.jsx";
import { Query, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CreateItemPage } from "./pages/CreateItemPage.jsx";
import { CartPage } from "./pages/CartPage.jsx";
import ListingsPage from "./pages/ListingsPage.jsx";
import FixedPriceDetails from "./pages/FixedPriceDetails.jsx";
import AuctionDetails from "./pages/AuctionDetails.jsx";
import { MyListingsPage } from "./pages/MyListings.jsx";
import { SettingsPage } from "./pages/SettingsPage.jsx";
import { AddressPage } from "./pages/AddressPage.jsx";
import { Toaster } from "sonner";
import { useTheme } from "./components/providers/ThemeProvider.jsx"; 
import WatchlistPage from "./pages/WatchlistPage.jsx";
import { CheckoutPage } from "./pages/CheckoutPage.jsx";
import { AuctionCheckoutPage } from "./pages/AuctionCheckoutPage.jsx";
import { OrderSuccessPage } from "./pages/OrderSuccessPage.jsx";
import { MyOrdersPage } from "./pages/MyOrdersPage.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import ErrorTestPage from "./pages/ErrorTestPage.jsx";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors (client errors)
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        // Retry up to 2 times for server errors
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false, // Don't retry mutations
    },
  },
});

function ToasterWithTheme() {
  const { theme } = useTheme();
  
  return (
    <Toaster
      theme={theme}
      richColors
      closeButton
      position="bottom-right"
      duration={4000}
    />
  );
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <ThemeProvider>
              <ToasterWithTheme />
              <Routes>
              <Route element={<MainLayout />}>
                <Route path="/" element={<ListingsPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/verify" element={<VerifyPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/listings" element={<ListingsPage />} />
                <Route path="/error-test" element={<ErrorTestPage />} />
              </Route>
              <Route element={<ProtectedLayout />}>
                <Route path="/create-item" element={<CreateItemPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/address" element={<AddressPage />} />
                <Route path="/my-listings" element={<MyListingsPage />} />
                <Route path="/cart" element={<CartPage />} />
                {/* <Route path="/watchlist" element={<WatchlistPage />} /> */}
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/checkout/:orderId" element={<CheckoutPage />} />
                <Route path="/auction-checkout/:orderId" element={<AuctionCheckoutPage />} />
                <Route path="/order-success/:orderId" element={<OrderSuccessPage />} />
                <Route path="/my-orders" element={<MyOrdersPage />} />
                <Route path="/fixed-price/:productId" element={<FixedPriceDetails />} />
                <Route path="/auctions/:auctionId" element={<AuctionDetails />} />
              </Route>
              </Routes>
            </ThemeProvider>
          </AuthProvider>
        </QueryClientProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;