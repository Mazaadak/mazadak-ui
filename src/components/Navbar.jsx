import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "./ui/button";
import { ModeToggle } from "./ModeToggle";
import { ChevronDown, ShoppingCart, Plus, Package, Store, Sparkles } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export const Navbar = () => {
  const { isAuthenticated, logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  // Handler to navigate with clean state (no URL params)
  const navigateClean = (path) => {
    navigate(path, { replace: false });
  };

  // Check if route is active
  const isActive = (path) => {
    if (path === '/listings') {
      return location.pathname === '/' || location.pathname === '/listings';
    }
    return location.pathname === path;
  };

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left section - Brand & Navigation */}
          <div className="flex items-center gap-6">
            <Link to="/" className="text-xl font-bold">
              mazadak
            </Link>
            
            {/* Navigation links - available to ALL users */}
            <div className="hidden md:flex items-center gap-2">
              <Button 
                variant={isActive('/listings') || isActive('/') ? "default" : "ghost"} 
                size="sm" 
                onClick={() => navigateClean('/listings')}
                className="relative group transition-all duration-200 hover:scale-105"
              >
                <Store className="h-4 w-4 mr-2" />
                <span className="font-medium">Listings</span>
              </Button>
            </div>
          </div>

          {/* Right section - Auth buttons & user menu */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
            <div className="flex items-center gap-2">
              {/* User-specific navigation buttons */}
              <div className="hidden sm:flex items-center gap-2">
                <Button 
                  variant={isActive('/cart') ? "default" : "ghost"} 
                  size="sm" 
                  className="hidden md:flex relative group hover:scale-105 transition-all duration-200" 
                  onClick={() => navigateClean('/cart')}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  <span>Cart</span>
                </Button>
                <Button 
                  variant={isActive('/my-listings') ? "default" : "ghost"} 
                  size="sm" 
                  className="hidden sm:flex relative group hover:scale-105 transition-all duration-200" 
                  onClick={() => navigateClean('/my-listings')}
                >
                  <Package className="h-4 w-4 mr-2" />
                  <span>My Listings</span>
                </Button>
                <Button 
                  size="sm" 
                  className="hidden sm:flex relative group shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105" 
                  onClick={() => navigateClean('/create-item')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="font-semibold">Sell Item</span>
                </Button>
              </div>
              
              {/* Profile and logout */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2 hover:scale-105 transition-all duration-200">
                    <Avatar className="h-7 w-7 border-2 border-primary/20">
                      <AvatarImage src={user?.personalPhoto} alt={user?.name} />
                      <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-xs font-semibold">
                        {user?.name?.substring(0, 2).toUpperCase() || user?.username?.substring(0, 2).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden md:inline font-medium">{user?.name || user?.username || 'Profile'}</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => navigate('/settings')} className="cursor-pointer">
                    <span className="font-medium">Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/my-orders')} className="cursor-pointer">
                    <span className="font-medium">My Orders</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
                    <span className="font-medium">Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button variant="ghost" size="sm" className="hover:scale-105 transition-all duration-200">
                  <span className="font-medium">Login</span>
                </Button>
              </Link>
              <Link to="/register">
                <Button size="sm" className="shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 bg-gradient-to-r from-primary to-primary/80">
                  <span className="font-semibold">Sign Up</span>
                </Button>
              </Link>
            </div>
          )}
            <ModeToggle />
          </div>
        </div>
      </div>
    </nav>
  );
};