import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import MainLayout from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Trash2, Plus, Minus, AlertTriangle } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function CartPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [itemToRemove, setItemToRemove] = useState<number | null>(null);
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [totals, setTotals] = useState({
    subtotal: 0,
    shipping: 0,
    tax: 0,
    total: 0,
  });

  // Fetch cart data
  const { data: cart, isLoading } = useQuery({
    queryKey: ["/api/cart"],
  });

  // Update quantity mutation
  const updateQuantityMutation = useMutation({
    mutationFn: async ({
      itemId,
      quantity,
    }: {
      itemId: number;
      quantity: number;
    }) => {
      return await apiRequest("PUT", `/api/cart/items/${itemId}`, { quantity });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Remove item mutation
  const removeItemMutation = useMutation({
    mutationFn: async (itemId: number) => {
      return await apiRequest("DELETE", `/api/cart/items/${itemId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Item removed",
        description: "Item has been removed from your cart.",
      });
      setIsRemoveDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle quantity change
  const handleQuantityChange = (itemId: number, newQuantity: number) => {
    if (newQuantity > 0) {
      updateQuantityMutation.mutate({ itemId, quantity: newQuantity });
    }
  };

  // Handle remove item
  const handleRemoveItem = (itemId: number) => {
    setItemToRemove(itemId);
    setIsRemoveDialogOpen(true);
  };

  const confirmRemoveItem = () => {
    if (itemToRemove !== null) {
      removeItemMutation.mutate(itemToRemove);
    }
  };

  // Apply coupon code
  const applyCoupon = () => {
    if (couponCode.trim()) {
      // In a real application, this would call an API to validate the coupon
      toast({
        title: "Coupon Applied",
        description: "Your coupon code has been applied successfully.",
      });
    } else {
      toast({
        title: "Invalid Coupon",
        description: "Please enter a valid coupon code.",
        variant: "destructive",
      });
    }
  };

  // Calculate totals
  useEffect(() => {
    if (cart?.items) {
      const subtotal = cart.items.reduce(
        (acc: number, item: any) => acc + item.product.price * item.quantity,
        0
      );
      const shipping = subtotal > 35 ? 0 : 9.99;
      const tax = subtotal * 0.06; // 6% tax
      const total = subtotal + shipping + tax;
      setTotals({ subtotal, shipping, tax, total });
    }
  }, [cart]);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold mb-6">Your Shopping Cart</h1>
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="lg:w-2/3">
              <Skeleton className="h-80 w-full rounded-lg" />
            </div>
            <div className="lg:w-1/3">
              <Skeleton className="h-80 w-full rounded-lg" />
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Your Shopping Cart</h1>

        {cart?.items?.length > 0 ? (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Cart Items */}
            <div className="lg:w-2/3">
              <Card>
                <CardContent className="p-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">Product</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="text-center">Quantity</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cart.items.map((item: any) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div className="w-20 h-20 rounded overflow-hidden">
                              <img
                                src={
                                  item.product.image_url ||
                                  `https://source.unsplash.com/featured/100x100?${encodeURIComponent(
                                    item.product.name.split(" ")[0]
                                  )}`
                                }
                                alt={item.product.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium text-gray-900">
                                {item.product.name}
                              </p>
                              <p className="text-sm text-gray-500">
                                Sold by: {item.product.seller?.shop_name || "ShopEase"}
                              </p>
                              {item.product.stock < 5 && (
                                <div className="flex items-center text-xs text-amber-600 mt-1">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  <span>Only {item.product.stock} left in stock</span>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            ${item.product.price.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 rounded-full"
                                onClick={() =>
                                  handleQuantityChange(item.id, item.quantity - 1)
                                }
                                disabled={
                                  updateQuantityMutation.isPending || item.quantity <= 1
                                }
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="mx-2 w-8 text-center">
                                {item.quantity}
                              </span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 rounded-full"
                                onClick={() =>
                                  handleQuantityChange(item.id, item.quantity + 1)
                                }
                                disabled={
                                  updateQuantityMutation.isPending ||
                                  item.quantity >= item.product.stock
                                }
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            ${(item.product.price * item.quantity).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveItem(item.id)}
                              disabled={removeItemMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
                <CardFooter className="flex justify-between p-6 pt-0">
                  <Button
                    variant="outline"
                    onClick={() => navigate("/")}
                  >
                    Continue Shopping
                  </Button>
                  <Button
                    variant="default"
                    onClick={() => navigate("/checkout")}
                  >
                    Proceed to Checkout
                  </Button>
                </CardFooter>
              </Card>
            </div>

            {/* Cart Summary */}
            <div className="lg:w-1/3">
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold mb-4">Order Summary</h2>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium">
                        ${totals.subtotal.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shipping</span>
                      <span className="font-medium">
                        {totals.shipping === 0
                          ? "Free"
                          : `$${totals.shipping.toFixed(2)}`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tax (6%)</span>
                      <span className="font-medium">${totals.tax.toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="font-bold">Total</span>
                      <span className="font-bold text-lg">
                        ${totals.total.toFixed(2)}
                      </span>
                    </div>

                    {/* Coupon Code */}
                    <div className="mt-6">
                      <p className="text-sm font-medium mb-2">Have a coupon?</p>
                      <div className="flex space-x-2">
                        <Input
                          placeholder="Enter coupon code"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value)}
                        />
                        <Button onClick={applyCoupon}>Apply</Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col p-6 pt-0">
                  <Button
                    className="w-full mb-2"
                    onClick={() => navigate("/checkout")}
                  >
                    Checkout
                  </Button>
                  {totals.subtotal < 35 && totals.shipping > 0 && (
                    <p className="text-sm text-amber-600 mt-2 text-center">
                      Add ${(35 - totals.subtotal).toFixed(2)} more to qualify for free shipping
                    </p>
                  )}
                </CardFooter>
              </Card>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-10 text-center max-w-xl mx-auto">
            <div className="flex justify-center mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-16 w-16 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Your Cart is Empty
            </h3>
            <p className="text-gray-600 mb-6">
              Looks like you haven't added any products to your cart yet.
            </p>
            <Button onClick={() => navigate("/")}>Start Shopping</Button>
          </div>
        )}

        {/* Remove Item Confirmation Dialog */}
        <AlertDialog
          open={isRemoveDialogOpen}
          onOpenChange={setIsRemoveDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove item from cart?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove this item from your cart?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setIsRemoveDialogOpen(false)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction onClick={confirmRemoveItem}>
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  );
}
