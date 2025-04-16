import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { Star, X, Truck, Package, Shield } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";

type ProductDetailModalProps = {
  productId: number;
  isOpen: boolean;
  onClose: () => void;
};

export default function ProductDetailModal({
  productId,
  isOpen,
  onClose,
}: ProductDetailModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);

  // Fetch product details
  const { data: product, isLoading } = useQuery({
    queryKey: [`/api/products/${productId}`],
    enabled: isOpen,
  });

  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: async () => {
      if (!user) {
        throw new Error("Please sign in to add items to cart");
      }
      return apiRequest("POST", "/api/cart/items", {
        product_id: productId,
        quantity: quantity
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Added to cart",
        description: `${product.name} has been added to your cart.`,
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleAddToCart = () => {
    addToCartMutation.mutate();
  };

  const incrementQuantity = () => {
    if (product && quantity < product.stock) {
      setQuantity(quantity + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  // Mock image URLs
  const fallbackImageUrl = product 
    ? `https://source.unsplash.com/featured/600x400?${encodeURIComponent(product.name.split(' ')[0])}`
    : "";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto p-0">
        {isLoading ? (
          <div className="p-6 text-center">Loading product details...</div>
        ) : (
          <>
            <DialogHeader className="p-6 border-b">
              <div className="flex justify-between items-start">
                <DialogTitle className="text-2xl font-bold">{product?.name}</DialogTitle>
                <DialogClose className="text-gray-500 hover:text-gray-700">
                  <X className="h-5 w-5" />
                </DialogClose>
              </div>
            </DialogHeader>

            <div className="p-6">
              <div className="flex flex-col md:flex-row">
                <div className="md:w-1/2 mb-6 md:mb-0">
                  <img
                    src={product?.image_url || fallbackImageUrl}
                    alt={product?.name}
                    className="w-full h-auto rounded-lg"
                  />
                </div>

                <div className="md:w-1/2 md:pl-8">
                  <div className="flex items-center mb-4">
                    <div className="flex text-amber-400">
                      <Star className="h-4 w-4 fill-current" />
                      <Star className="h-4 w-4 fill-current" />
                      <Star className="h-4 w-4 fill-current" />
                      <Star className="h-4 w-4 fill-current" />
                      <Star className="h-4 w-4 fill-current stroke-current" />
                    </div>
                    <span className="text-gray-600 ml-2">
                      4.5 ({product?.reviews?.length || 0} reviews)
                    </span>
                  </div>

                  <div className="mb-4">
                    <span className="text-2xl font-bold text-gray-800">
                      ${product?.price.toFixed(2)}
                    </span>
                    {product?.stock < 10 && product?.stock > 0 && (
                      <Badge variant="outline" className="ml-2 text-yellow-700 border-yellow-300 bg-yellow-50">
                        Only {product.stock} left
                      </Badge>
                    )}
                    {product?.stock === 0 && (
                      <Badge variant="destructive" className="ml-2">
                        Out of Stock
                      </Badge>
                    )}
                  </div>

                  <p className="text-gray-600 mb-6">{product?.description}</p>

                  <div className="mb-6">
                    <h3 className="font-semibold mb-2">Quantity:</h3>
                    <div className="flex items-center">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={decrementQuantity}
                        disabled={quantity <= 1}
                        className="h-9 w-9"
                      >
                        -
                      </Button>
                      <span className="w-16 text-center">{quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={incrementQuantity}
                        disabled={!product || quantity >= product.stock}
                        className="h-9 w-9"
                      >
                        +
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <Button
                      className="w-full"
                      onClick={handleAddToCart}
                      disabled={!product || product.stock === 0 || addToCartMutation.isPending}
                    >
                      Add to Cart
                    </Button>
                    <Button variant="outline" className="w-full">
                      Add to Wishlist
                    </Button>
                  </div>

                  <div className="border-t pt-6">
                    <div className="flex items-center text-gray-600 mb-2">
                      <Truck className="h-4 w-4 mr-2" />
                      <span>Free shipping on orders over $35</span>
                    </div>
                    <div className="flex items-center text-gray-600 mb-2">
                      <Package className="h-4 w-4 mr-2" />
                      <span>30-day returns</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Shield className="h-4 w-4 mr-2" />
                      <span>2-year warranty included</span>
                    </div>
                  </div>

                  <div className="mt-6">
                    <p className="text-gray-500 text-sm">
                      Sold by:{" "}
                      <Link
                        href={`/sellers/${product?.seller_id}`}
                        className="text-primary hover:underline"
                      >
                        {product?.seller?.shop_name || "ShopEase Marketplace"}
                      </Link>
                    </p>
                  </div>
                </div>
              </div>

              {/* Reviews Section */}
              {product?.reviews && product.reviews.length > 0 && (
                <div className="mt-10 border-t pt-6">
                  <h3 className="text-xl font-bold mb-4">Customer Reviews</h3>

                  <div className="mb-6">
                    {product.reviews.map((review: any) => (
                      <div key={review.id} className="border-b pb-4 mb-4">
                        <div className="flex justify-between mb-2">
                          <div className="flex items-center">
                            <div className="flex text-amber-400">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < review.rating
                                      ? "fill-current"
                                      : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="ml-2 font-medium">
                              {review.review_text?.split(" ").slice(0, 5).join(" ")}...
                            </span>
                          </div>
                          <span className="text-gray-500 text-sm">
                            {format(
                              new Date(review.review_date),
                              "MMMM d, yyyy"
                            )}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-2">{review.review_text}</p>
                        <span className="text-gray-500 text-sm">
                          By {review.customer?.name || "Verified Buyer"}
                        </span>
                      </div>
                    ))}
                  </div>

                  {product.reviews.length > 3 && (
                    <Button variant="link" className="text-primary p-0">
                      See all {product.reviews.length} reviews
                    </Button>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
