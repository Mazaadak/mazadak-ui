import "./App.css";
import { Button } from "@/components/ui/button";
import { Routes, Route, createBrowserRouter, createRoutesFromElements, RouterProvider, BrowserRouter } from "react-router-dom";
import { MainLayout } from "./layouts/MainLayout";
import { HomePage } from "./pages/HomePage";
import { Navbar } from "./components/Navbar";
import { AuthProvider } from "./contexts/AuthContext";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage.jsx";
import { VerifyPage } from "./pages/VerifyPage.jsx";
import { ThemeProvider } from "./components/providers/ThemeProvider.jsx";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage.jsx";
import { ResetPasswordPage } from "./pages/ResetPasswordPage.jsx";

function App() {
  return (
    <BrowserRouter>
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
          </Route>
        </Routes>
        </ThemeProvider>
      </AuthProvider>    
    </BrowserRouter>
  )
}

export default App;
