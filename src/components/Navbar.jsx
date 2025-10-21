import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "./ui/button";
import { ModeToggle } from "./ModeToggle";
import { ArrowDown, ArrowDown01, ChevronDown, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export const Navbar = () => {
  const { isAuthenticated, logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <nav className="border-b bg-background sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        {/* Left section - Brand & Navigation */}
        <div className="flex items-center gap-8">
          <Link to="/" className="text-xl font-bold flex-shrink-0">
            mazadak
          </Link>
          
          {/* Navigation links - available to ALL users */}
          <div className="hidden md:flex items-center gap-1">
            <Button variant="ghost" size="sm">
              <Link to="/auctions" className="text-sm font-medium hover:text-primary transition-colors">
                Auctions
              </Link>
            </Button>
            <Button variant="ghost" size="sm">
              <Link to="/listings" className="text-sm font-medium hover:text-primary transition-colors">
                Listings
              </Link>
            </Button>
          </div>
        </div>

        {/* Right section - Auth buttons & user menu */}
        <div className="flex items-center gap-3">
          
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              {/* User-specific navigation buttons */}
              <div className="hidden sm:flex items-center gap-1">
                <Link to="/watchlist">
                  <Button variant="ghost" size="sm" className="hidden lg:flex">
                    Watchlist
                  </Button>
                </Link>
                <Link to="/cart">
                  <Button variant="ghost" size="sm" className="hidden md:flex">
                    Cart
                  </Button>
                </Link>
                <Link to="/listings/me">
                  <Button variant="ghost" size="sm" className="hidden sm:flex">
                    My Listings
                  </Button>
                </Link>
                <Link to="/auctions/me">
                  <Button variant="ghost" size="sm" className="hidden sm:flex">
                    My Auctions
                  </Button>
                </Link>
              </div>
              
              {/* Profile and logout */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    Profile
                    <ChevronDown />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>
                    <Link to="/profile" className="flex flex-row align-center">
                      View Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Link to="/settings">
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Link to="/orders">
                      My Orders
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Button onClick={handleLogout} variant="outline" size="sm">
                Logout
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Login
                </Button>
              </Link>
              <Link to="/register">
                <Button size="sm">Sign Up</Button>
              </Link>
            </div>
          )}
          <ModeToggle />
        </div>
      </div>
    </nav>
  );
};