import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Star, ShoppingCart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import ProductDetailModal from "./product-detail-modal";

type Product = {
  id: number;
  product_id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  image_url?: string;
  status: string;
  seller_id: number;
  categories: any[];
  seller?: {
    shop_name: string;
  };
};

type ProductCardProps = {
  product: Product;
  showDetailButton?: boolean;
};

export default function ProductCard({ product, showDetailButton = true }: ProductCardProps) {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Mock image URLs for products without images
  const fallbackImageUrl = `https://source.unsplash.com/featured/400x300?${encodeURIComponent(product.name.split(' ')[0])}`;
  
  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: async () => {
      if (!user) {
        throw new Error("Please sign in to add items to cart");
      }
      return apiRequest("POST", "/api/cart/items", {
        product_id: product.id,
        quantity: 1
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
    }
  });

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCartMutation.mutate();
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button")) {
      return; // Don't open modal if button was clicked
    }
    
    if (showDetailButton) {
      setIsModalOpen(true);
    } else {
      navigate(`/products/${product.id}`);
    }
  };

  return (
    <>
      <Card 
        className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300 cursor-pointer"
        onClick={handleCardClick}
      >
        <div className="relative">
          <img
            src={product.image_url || fallbackImageUrl}
            alt={product.name}
            className="w-full h-48 object-cover"
          />
          {product.stock < 10 && product.stock > 0 && (
            <div className="absolute top-2 right-2">
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">
                Low Stock
              </Badge>
            </div>
          )}
          {product.stock === 0 && (
            <div className="absolute top-2 right-2">
              <Badge variant="destructive">Out of Stock</Badge>
            </div>
          )}
        </div>

        <CardContent className="p-4">
          <h3 className="text-lg font-medium text-gray-800 mb-1">{product.name}</h3>
          <p className="text-gray-500 text-sm mb-2">
            Sold by: {product.seller?.shop_name || "ShopEase Marketplace"}
          </p>

          <div className="flex items-center mb-2">
            <div className="flex text-amber-400">
              <Star className="h-4 w-4 fill-current" />
              <Star className="h-4 w-4 fill-current" />
              <Star className="h-4 w-4 fill-current" />
              <Star className="h-4 w-4 fill-current" />
              <Star className="h-4 w-4 fill-current stroke-current" />
            </div>
            <span className="text-gray-600 text-sm ml-1">4.5 (128)</span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-lg font-bold text-gray-800">${product.price.toFixed(2)}</span>
            </div>
            <Button
              size="icon"
              className="bg-primary text-white rounded-full hover:bg-blue-600 transition"
              onClick={handleAddToCart}
              disabled={product.stock === 0 || addToCartMutation.isPending}
            >
              <ShoppingCart className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {isModalOpen && (
        <ProductDetailModal 
          productId={product.id} 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)} 
        />
      )}
    </>
  );
}
