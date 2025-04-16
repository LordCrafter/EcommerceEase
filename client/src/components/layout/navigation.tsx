import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Search, ShoppingCart, User, Menu, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";

export default function Navigation() {
  const [, navigate] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Fetch categories for the navigation
  const { data: categories } = useQuery({
    queryKey: ["/api/categories"],
  });

  // Fetch cart items count
  const { data: cart } = useQuery({
    queryKey: ["/api/cart"],
    enabled: !!user && user.role === "customer",
  });

  const cartItemsCount = cart?.items?.length || 0;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Close mobile menu when navigating
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [useLocation()[0]]);

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <span className="text-primary text-2xl font-bold">
                Shop<span className="text-green-500">Ease</span>
              </span>
            </Link>
          </div>

          {/* Desktop Search Bar */}
          <div className="hidden md:flex flex-1 mx-8">
            <form onSubmit={handleSearch} className="w-full max-w-xl relative">
              <Input
                type="text"
                placeholder="Search for products, brands and categories..."
                className="pl-10 pr-4"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
            </form>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-6">
            {user ? (
              <>
                {user.role === "customer" && (
                  <Link href="/cart">
                    <Button variant="ghost" className="relative">
                      <ShoppingCart className="h-5 w-5" />
                      {cartItemsCount > 0 && (
                        <Badge className="absolute -top-2 -right-2 px-1.5 py-0.5 text-xs rounded-full">
                          {cartItemsCount}
                        </Badge>
                      )}
                    </Button>
                  </Link>
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center space-x-1">
                      <span>{user.name || user.username}</span>
                      <User className="h-4 w-4 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {user.role === "customer" && (
                      <>
                        <DropdownMenuItem asChild>
                          <Link href="/orders">My Orders</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/profile">Profile</Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    {(user.role === "seller" || user.role === "admin") && (
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard">Dashboard</Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Link href="/auth">
                <Button variant="default">Sign In</Button>
              </Link>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-4">
            {user && user.role === "customer" && (
              <Link href="/cart">
                <Button variant="ghost" className="relative">
                  <ShoppingCart className="h-5 w-5" />
                  {cartItemsCount > 0 && (
                    <Badge className="absolute -top-2 -right-2 px-1.5 py-0.5 text-xs rounded-full">
                      {cartItemsCount}
                    </Badge>
                  )}
                </Button>
              </Link>
            )}
            
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <div className="flex flex-col h-full">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-semibold">Menu</h2>
                    <SheetClose asChild>
                      <Button variant="ghost" size="icon">
                        <X className="h-5 w-5" />
                      </Button>
                    </SheetClose>
                  </div>

                  {/* Mobile Search */}
                  <form onSubmit={handleSearch} className="mb-6">
                    <div className="relative">
                      <Input
                        type="text"
                        placeholder="Search..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                        <Search className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                  </form>

                  <div className="flex flex-col space-y-4">
                    {user ? (
                      <>
                        <div className="px-2 py-4 border-b">
                          <p className="text-sm text-gray-500">Signed in as</p>
                          <p className="font-medium">{user.name || user.username}</p>
                        </div>
                        
                        {(user.role === "seller" || user.role === "admin") && (
                          <Link href="/dashboard">
                            <SheetClose asChild>
                              <Button variant="ghost" className="w-full justify-start">
                                Dashboard
                              </Button>
                            </SheetClose>
                          </Link>
                        )}
                        
                        {user.role === "customer" && (
                          <>
                            <Link href="/orders">
                              <SheetClose asChild>
                                <Button variant="ghost" className="w-full justify-start">
                                  My Orders
                                </Button>
                              </SheetClose>
                            </Link>
                            <Link href="/profile">
                              <SheetClose asChild>
                                <Button variant="ghost" className="w-full justify-start">
                                  Profile
                                </Button>
                              </SheetClose>
                            </Link>
                          </>
                        )}
                        
                        <SheetClose asChild>
                          <Button 
                            variant="ghost" 
                            className="w-full justify-start text-red-500"
                            onClick={handleLogout}
                          >
                            Logout
                          </Button>
                        </SheetClose>
                      </>
                    ) : (
                      <Link href="/auth">
                        <SheetClose asChild>
                          <Button className="w-full">Sign In</Button>
                        </SheetClose>
                      </Link>
                    )}
                    
                    <div className="border-t pt-4 mt-4">
                      <h3 className="font-medium mb-2">Categories</h3>
                      {categories?.map((category: any) => (
                        <Link
                          key={category.id}
                          href={`/categories/${category.id}`}
                        >
                          <SheetClose asChild>
                            <Button variant="ghost" className="w-full justify-start text-sm">
                              {category.category_name}
                            </Button>
                          </SheetClose>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* Categories Navigation Bar */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center py-3 overflow-x-auto scrollbar-hide">
            {categories?.map((category: any) => (
              <Link
                key={category.id}
                href={`/categories/${category.id}`}
                className="whitespace-nowrap px-4 py-2 mr-2 text-sm font-medium text-gray-700 hover:text-primary hover:bg-gray-100 rounded-md"
              >
                {category.category_name}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Search (shows on small screens) */}
      <div className="md:hidden px-4 py-2 bg-white border-t">
        <form onSubmit={handleSearch}>
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <Input
              type="text"
              className="w-full pl-10 pr-4"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </form>
      </div>
    </header>
  );
}
