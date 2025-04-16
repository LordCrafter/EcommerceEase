import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { X, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";

type ShoppingCartProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function ShoppingCart({ isOpen, onClose }: ShoppingCartProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [total, setTotal] = useState({ subtotal: 0, shipping: 9.99, tax: 0 });

  // Fetch cart items
  const { data: cart, isLoading } = useQuery({
    queryKey: ["/api/cart"],
    enabled: isOpen,
  });

  // Calculate totals whenever cart items change
  useEffect(() => {
    if (cart?.items) {
      const subtotal = cart.items.reduce(
        (acc: number, item: any) => acc + item.product.price * item.quantity,
        0
      );
      const shipping = subtotal > 35 ? 0 : 9.99;
      const tax = subtotal * 0.06; // 6% tax rate
      setTotal({ subtotal, shipping, tax });
    }
  }, [cart]);

  // Update cart item quantity
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

  // Remove item from cart
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
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleQuantityChange = (itemId: number, newQuantity: number) => {
    if (newQuantity > 0) {
      updateQuantityMutation.mutate({ itemId, quantity: newQuantity });
    }
  };

  const handleRemoveItem = (itemId: number) => {
    removeItemMutation.mutate(itemId);
  };

  const handleCheckout = () => {
    onClose();
    navigate("/checkout");
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md">
        <div className="flex flex-col h-full">
          <SheetHeader className="border-b pb-4">
            <SheetTitle>
              Your Cart ({cart?.items?.length || 0} items)
            </SheetTitle>
            <SheetClose className="absolute right-4 top-4">
              <X className="h-4 w-4" />
            </SheetClose>
          </SheetHeader>

          <div className="flex-grow overflow-y-auto py-4">
            {isLoading ? (
              <div className="flex justify-center p-4">
                <p>Loading cart...</p>
              </div>
            ) : cart?.items?.length > 0 ? (
              cart.items.map((item: any) => (
                <div key={item.id} className="flex items-center py-4 border-b">
                  <img
                    src={
                      item.product.image_url ||
                      `https://source.unsplash.com/featured/100x100?${encodeURIComponent(
                        item.product.name.split(" ")[0]
                      )}`
                    }
                    alt={item.product.name}
                    className="w-20 h-20 object-cover rounded"
                  />

                  <div className="ml-4 flex-grow">
                    <h3 className="font-medium">{item.product.name}</h3>
                    <p className="text-gray-500 text-sm">
                      Sold by: {item.product.seller?.shop_name || "ShopEase"}
                    </p>

                    <div className="flex items-center mt-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-5 w-5 rounded"
                        onClick={() =>
                          handleQuantityChange(item.id, item.quantity - 1)
                        }
                        disabled={updateQuantityMutation.isPending}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="mx-2 w-8 text-center">
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-5 w-5 rounded"
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
                  </div>

                  <div className="ml-4 flex flex-col items-end">
                    <span className="font-bold">
                      ${(item.product.price * item.quantity).toFixed(2)}
                    </span>
                    <Button
                      variant="ghost"
                      className="text-red-500 hover:text-red-700 text-sm mt-2 h-auto p-0"
                      onClick={() => handleRemoveItem(item.id)}
                      disabled={removeItemMutation.isPending}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-40">
                <p className="text-gray-500 mb-4">Your cart is empty</p>
                <SheetClose asChild>
                  <Link href="/">
                    <Button>Continue Shopping</Button>
                  </Link>
                </SheetClose>
              </div>
            )}
          </div>

          {cart?.items?.length > 0 && (
            <div className="border-t pt-4">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-bold">${total.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Shipping:</span>
                <span className="font-bold">
                  {total.shipping === 0
                    ? "Free"
                    : `$${total.shipping.toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between mb-4">
                <span className="text-gray-600">Tax:</span>
                <span className="font-bold">${total.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg mb-6">
                <span className="font-semibold">Total:</span>
                <span className="font-bold">
                  ${(total.subtotal + total.shipping + total.tax).toFixed(2)}
                </span>
              </div>

              <Button
                className="w-full mb-2"
                onClick={handleCheckout}
              >
                Proceed to Checkout
              </Button>
              <SheetClose asChild>
                <Button variant="outline" className="w-full">
                  Continue Shopping
                </Button>
              </SheetClose>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
