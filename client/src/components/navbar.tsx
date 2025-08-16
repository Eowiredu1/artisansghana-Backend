import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Hammer, Menu, User, LogOut, ShoppingCart, Package, FolderOpen, Settings } from "lucide-react";

export default function Navbar() {
  const { user, logoutMutation } = useAuth();
  const [, navigate] = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const navigationItems = [
    {
      label: "Browse Materials",
      href: "/marketplace",
      icon: ShoppingCart,
      roles: ["buyer", "seller", "client", "admin"],
    },
    {
      label: "Seller Dashboard",
      href: "/seller",
      icon: Package,
      roles: ["seller", "admin"],
    },
    {
      label: "Project Management",
      href: "/projects",
      icon: FolderOpen,
      roles: ["client", "admin"],
    },
    {
      label: "Admin Dashboard",
      href: "/admin",
      icon: Settings,
      roles: ["admin"],
    },
  ];

  const visibleItems = navigationItems.filter(item => 
    !user || item.roles.includes(user.role)
  );

  const getUserInitials = (username: string) => {
    return username.substring(0, 2).toUpperCase();
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <button
              onClick={() => navigate("/")}
              className="flex items-center"
              data-testid="logo-link"
            >
              <Hammer className="text-primary w-8 h-8 mr-2" />
              <span className="text-xl font-bold text-gray-900">Artisans Market</span>
            </button>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {visibleItems.map((item) => (
              <button
                key={item.href}
                onClick={() => navigate(item.href)}
                className="text-gray-700 hover:text-primary px-3 py-2 text-sm font-medium transition-colors"
                data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* User Menu / Auth Buttons */}
          <div className="flex items-center space-x-4">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full" data-testid="user-menu">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-white">
                        {getUserInitials(user.username)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex flex-col space-y-1 p-2">
                    <p className="text-sm font-medium leading-none">{user.username}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    {user.businessName && (
                      <p className="text-xs leading-none text-muted-foreground">{user.businessName}</p>
                    )}
                    <div className="pt-1">
                      <div className="text-xs px-2 py-1 bg-secondary rounded-md inline-block">
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </div>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  {visibleItems.map((item) => (
                    <DropdownMenuItem
                      key={item.href}
                      onClick={() => navigate(item.href)}
                      className="cursor-pointer"
                      data-testid={`dropdown-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      <span>{item.label}</span>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleLogout} 
                    className="cursor-pointer text-red-600"
                    data-testid="button-logout"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden md:flex items-center space-x-4">
                <Button
                  variant="ghost"
                  onClick={() => navigate("/auth")}
                  data-testid="button-signin"
                >
                  Sign In
                </Button>
                <Button
                  onClick={() => navigate("/auth")}
                  data-testid="button-get-started"
                >
                  Get Started
                </Button>
              </div>
            )}

            {/* Mobile menu button */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <div className="flex flex-col space-y-6 mt-8">
                  {/* Logo in mobile menu */}
                  <div className="flex items-center">
                    <Hammer className="text-primary w-6 h-6 mr-2" />
                    <span className="text-lg font-bold text-gray-900">Artisans Market</span>
                  </div>

                  {/* User info in mobile menu */}
                  {user && (
                    <div className="border-b pb-4">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary text-white">
                            {getUserInitials(user.username)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{user.username}</p>
                          <p className="text-xs text-gray-500">{user.role}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Navigation items */}
                  <nav className="flex flex-col space-y-4">
                    {visibleItems.map((item) => (
                      <button
                        key={item.href}
                        onClick={() => {
                          navigate(item.href);
                          setIsOpen(false);
                        }}
                        className="flex items-center space-x-3 text-gray-700 hover:text-primary px-3 py-2 text-sm font-medium transition-colors text-left"
                        data-testid={`mobile-nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        <item.icon className="h-5 w-5" />
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </nav>

                  {/* Auth buttons or logout */}
                  <div className="border-t pt-4">
                    {user ? (
                      <Button
                        variant="outline"
                        onClick={() => {
                          handleLogout();
                          setIsOpen(false);
                        }}
                        className="w-full justify-start text-red-600"
                        data-testid="mobile-logout"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Log out
                      </Button>
                    ) : (
                      <div className="space-y-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            navigate("/auth");
                            setIsOpen(false);
                          }}
                          className="w-full"
                          data-testid="mobile-signin"
                        >
                          Sign In
                        </Button>
                        <Button
                          onClick={() => {
                            navigate("/auth");
                            setIsOpen(false);
                          }}
                          className="w-full"
                          data-testid="mobile-get-started"
                        >
                          Get Started
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
