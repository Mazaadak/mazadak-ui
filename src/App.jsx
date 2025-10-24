import "./App.css";
import { Routes, Route, createBrowserRouter, createRoutesFromElements, RouterProvider, BrowserRouter } from "react-router-dom";
import { MainLayout } from "./layouts/MainLayout";
import { HomePage } from "./pages/HomePage";
import { AuthProvider } from "./contexts/AuthContext";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage.jsx";
import { VerifyPage } from "./pages/VerifyPage.jsx";
import { ThemeProvider } from "./components/providers/ThemeProvider.jsx";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage.jsx";
import { ProtectedLayout } from "./layouts/ProtectedLayout.jsx";
import { ResetPasswordPage } from "./pages/ResetPasswordPage.jsx";
import { Query, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AuctionsPage from "./pages/AuctionsPage.jsx";
import { CreateItemPage } from "./pages/CreateItemPage.jsx";
import { CartPage } from "./pages/CartPage.jsx";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
    }
  }
});

function App() {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ThemeProvider>
            <Routes>
              <Route element={<MainLayout/>}>
                <Route path="/" element={<HomePage/>} />
                <Route path="/login" element={<LoginPage/>} />
                <Route path="/register" element={<RegisterPage/>} />
                <Route path="/verify" element={<VerifyPage/>} />
                <Route path="/forgot-password" element={<ForgotPasswordPage/>} />
                <Route path="/reset-password" element={<ResetPasswordPage/>} />
                <Route path="/auctions" element={<AuctionsPage/>} />
                <Route path="/cart" element={<CartPage/>} />
              </Route>
              <Route element={<ProtectedLayout/>}>
                <Route path="/create-item" element={<CreateItemPage/>} />
              </Route>
            </Routes>
          </ThemeProvider>
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  )
}

export default App;
