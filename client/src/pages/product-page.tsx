import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Star, Plus, Minus, ShoppingCart, Heart } from "lucide-react";
import MainLayout from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProductPage() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);

  // Fetch product details
  const {
    data: product,
    isLoading,
    isError,
  } = useQuery({
    queryKey: [`/api/products/${id}`],
  });

  // Fetch product reviews
  const { data: reviews } = useQuery({
    queryKey: [`/api/products/${id}/reviews`],
    enabled: !!id,
  });

  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: async () => {
      if (!user) {
        throw new Error("Please sign in to add items to cart");
      }
      return apiRequest("POST", "/api/cart/items", {
        product_id: parseInt(id as string),
        quantity,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Added to cart",
        description: `${product.name} has been added to your cart.`,
      });
    },
    onError: (error: Error) => {
      if (error.message.includes("sign in")) {
        navigate("/auth");
      }
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
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

  if (isError) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Product Not Found
            </h2>
            <p className="text-gray-600 mb-8">
              The product you are looking for does not exist or has been removed.
            </p>
            <Button onClick={() => navigate("/")}>Back to Home</Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Calculate average rating
  const averageRating =
    reviews && reviews.length > 0
      ? (
          reviews.reduce(
            (acc: number, review: any) => acc + review.rating,
            0
          ) / reviews.length
        ).toFixed(1)
      : "0.0";

  // Format reviews by rating (5 star, 4 star, etc.)
  const reviewsByRating = Array.from({ length: 5 }, (_, i) => {
    const rating = 5 - i;
    const count = reviews?.filter((r: any) => r.rating === rating).length || 0;
    const percentage = reviews?.length
      ? Math.round((count / reviews.length) * 100)
      : 0;
    return { rating, count, percentage };
  });

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex flex-col md:flex-row gap-8">
            <div className="md:w-1/2">
              <Skeleton className="w-full aspect-square rounded-lg" />
            </div>
            <div className="md:w-1/2 space-y-4">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-6 w-1/4" />
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-40 w-full" />
              <div className="space-y-2">
                <Skeleton className="h-8 w-36" />
                <div className="flex space-x-4">
                  <Skeleton className="h-12 w-32" />
                  <Skeleton className="h-12 w-32" />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-col md:flex-row gap-8">
              {/* Product Image */}
              <div className="md:w-1/2">
                <div className="rounded-lg overflow-hidden bg-white shadow-md">
                  <img
                    src={
                      product?.image_url ||
                      `https://source.unsplash.com/featured/600x600?${encodeURIComponent(
                        product?.name?.split(" ")[0] || "product"
                      )}`
                    }
                    alt={product?.name}
                    className="w-full h-auto object-cover"
                  />
                </div>
              </div>

              {/* Product Details */}
              <div className="md:w-1/2">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                  {product?.name}
                </h1>

                {/* Ratings */}
                <div className="flex items-center mb-4">
                  <div className="flex text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-5 w-5 ${
                          i < Math.floor(parseFloat(averageRating))
                            ? "fill-current"
                            : i < Math.ceil(parseFloat(averageRating))
                            ? "fill-current text-amber-400/50"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="ml-2 text-gray-600">
                    {averageRating} ({reviews?.length || 0} reviews)
                  </span>
                </div>

                {/* Price */}
                <div className="mb-6">
                  <span className="text-3xl font-bold text-gray-800">
                    ${product?.price?.toFixed(2)}
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

                {/* Description */}
                <p className="text-gray-600 mb-8">{product?.description}</p>

                {/* Seller Information */}
                <div className="mb-6">
                  <p className="text-sm text-gray-500">
                    Sold by:{" "}
                    <span className="text-primary">
                      {product?.seller?.shop_name || "ShopEase Marketplace"}
                    </span>
                  </p>
                </div>

                {/* Quantity Selector */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity:
                  </label>
                  <div className="flex items-center space-x-3">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={decrementQuantity}
                      disabled={quantity <= 1}
                      className="h-10 w-10"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-10 text-center font-medium">
                      {quantity}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={incrementQuantity}
                      disabled={!product || quantity >= product.stock}
                      className="h-10 w-10"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-4">
                  <Button
                    size="lg"
                    className="flex-1"
                    onClick={handleAddToCart}
                    disabled={
                      !product ||
                      product.stock === 0 ||
                      addToCartMutation.isPending
                    }
                  >
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    {addToCartMutation.isPending
                      ? "Adding..."
                      : "Add to Cart"}
                  </Button>
                  <Button size="lg" variant="outline" className="flex-1">
                    <Heart className="mr-2 h-5 w-5" />
                    Add to Wishlist
                  </Button>
                </div>
              </div>
            </div>

            {/* Tabs for Details and Reviews */}
            <div className="mt-12">
              <Tabs defaultValue="reviews">
                <TabsList className="w-full md:w-auto">
                  <TabsTrigger value="details">Product Details</TabsTrigger>
                  <TabsTrigger value="reviews">
                    Reviews ({reviews?.length || 0})
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="details" className="mt-6">
                  <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h3 className="text-lg font-semibold mb-4">
                      Product Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-gray-800">
                          Specifications:
                        </h4>
                        <ul className="mt-2 space-y-1 text-gray-600">
                          <li>Category: {product?.categories?.[0]?.category_name || "Uncategorized"}</li>
                          <li>Added: {new Date(product?.added_date).toLocaleDateString()}</li>
                          <li>Status: {product?.status}</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800">
                          Shipping Information:
                        </h4>
                        <ul className="mt-2 space-y-1 text-gray-600">
                          <li>Free shipping on orders over $35</li>
                          <li>Standard delivery: 3-5 business days</li>
                          <li>Express delivery: 1-2 business days</li>
                        </ul>
                      </div>
                    </div>

                    <div className="mt-4">
                      <h4 className="font-medium text-gray-800">Returns:</h4>
                      <p className="mt-2 text-gray-600">
                        30-day return policy. Items must be in original
                        condition with tags attached.
                      </p>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="reviews" className="mt-6">
                  <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h3 className="text-lg font-semibold mb-4">
                      Customer Reviews
                    </h3>

                    <div className="flex flex-col md:flex-row gap-8">
                      {/* Rating Summary */}
                      <div className="md:w-1/3">
                        <div className="flex items-center mb-4">
                          <span className="text-5xl font-bold text-gray-800 mr-2">
                            {averageRating}
                          </span>
                          <div className="flex flex-col">
                            <div className="flex text-amber-400 mb-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < Math.floor(parseFloat(averageRating))
                                      ? "fill-current"
                                      : i < Math.ceil(parseFloat(averageRating))
                                      ? "fill-current text-amber-400/50"
                                      : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-sm text-gray-500">
                              Based on {reviews?.length || 0} reviews
                            </span>
                          </div>
                        </div>

                        {/* Rating Breakdown */}
                        <div className="space-y-2">
                          {reviewsByRating.map((item) => (
                            <div key={item.rating} className="flex items-center">
                              <span className="text-sm text-gray-600 w-8">
                                {item.rating} ★
                              </span>
                              <div className="flex-1 h-2 mx-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-amber-400"
                                  style={{ width: `${item.percentage}%` }}
                                ></div>
                              </div>
                              <span className="text-sm text-gray-600 w-8">
                                {item.count}
                              </span>
                            </div>
                          ))}
                        </div>

                        {user?.role === "customer" && (
                          <div className="mt-6">
                            <Button
                              onClick={() => {
                                // Can be expanded to open a review form
                                toast({
                                  title: "Write a Review",
                                  description:
                                    "You can only review products you have purchased.",
                                });
                              }}
                            >
                              Write a Review
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Review List */}
                      <div className="md:w-2/3">
                        {reviews && reviews.length > 0 ? (
                          <div className="space-y-6">
                            {reviews.map((review: any) => (
                              <div
                                key={review.id}
                                className="border-b pb-6 last:border-0"
                              >
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
                                    <h4 className="font-medium ml-2">
                                      {review.customer?.name ||
                                        "Verified Customer"}
                                    </h4>
                                  </div>
                                  <span className="text-sm text-gray-500">
                                    {format(
                                      new Date(review.review_date),
                                      "MMM d, yyyy"
                                    )}
                                  </span>
                                </div>
                                <p className="text-gray-700">
                                  {review.review_text}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <p className="text-gray-500 mb-4">
                              No reviews yet. Be the first to review this product!
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}
