import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import MainLayout from "@/components/layout/main-layout";
import ProductCard from "@/components/products/product-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function CategoryPage() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [sortOption, setSortOption] = useState("newest");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch category details
  const { data: category, isLoading: isLoadingCategory } = useQuery({
    queryKey: [`/api/categories/${id}`],
    enabled: !!id,
  });

  // Fetch products by category
  const {
    data: products,
    isLoading: isLoadingProducts,
    isError,
  } = useQuery({
    queryKey: [`/api/products`, { categoryId: id }],
    queryFn: async () => {
      const res = await fetch(`/api/products?categoryId=${id}&status=active`);
      if (!res.ok) throw new Error("Failed to fetch products");
      return res.json();
    },
    enabled: !!id,
  });

  // Fetch all categories for sidebar
  const { data: categories } = useQuery({
    queryKey: ["/api/categories"],
  });

  // Search handler
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/products?search=${encodeURIComponent(searchQuery)}&categoryId=${id}`);
  };

  // Sort and filter products
  const filteredProducts = products
    ? products
        .filter(
          (product: any) =>
            product.price >= priceRange[0] && product.price <= priceRange[1]
        )
        .sort((a: any, b: any) => {
          switch (sortOption) {
            case "price-low":
              return a.price - b.price;
            case "price-high":
              return b.price - a.price;
            case "oldest":
              return new Date(a.added_date).getTime() - new Date(b.added_date).getTime();
            case "newest":
            default:
              return new Date(b.added_date).getTime() - new Date(a.added_date).getTime();
          }
        })
    : [];

  // Handle price range change
  const handlePriceChange = (value: number[]) => {
    setPriceRange([value[0], value[1]]);
  };

  if (isError) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Category Not Found
            </h2>
            <p className="text-gray-600 mb-8">
              The category you are looking for does not exist or has been removed.
            </p>
            <Button onClick={() => navigate("/")}>Back to Home</Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Category Header */}
        <div className="mb-8">
          {isLoadingCategory ? (
            <Skeleton className="h-10 w-1/3" />
          ) : (
            <h1 className="text-3xl font-bold text-gray-800">
              {category?.category_name || "Products"}
            </h1>
          )}
          <p className="text-gray-600 mt-2">
            Browse our selection of {category?.category_name?.toLowerCase() || "products"}
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar Filters */}
          <div className="w-full md:w-1/4">
            <div className="bg-white rounded-lg shadow-sm p-6">
              {/* Search */}
              <form onSubmit={handleSearch} className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Search</h3>
                <div className="flex gap-2">
                  <Input
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Button type="submit" size="sm">
                    Search
                  </Button>
                </div>
              </form>

              {/* Price Range Filter */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Price Range</h3>
                <Slider
                  defaultValue={[0, 1000]}
                  max={1000}
                  step={10}
                  value={[priceRange[0], priceRange[1]]}
                  onValueChange={handlePriceChange}
                  className="mb-4"
                />
                <div className="flex items-center justify-between text-sm">
                  <span>${priceRange[0]}</span>
                  <span>${priceRange[1]}</span>
                </div>
              </div>

              {/* Categories */}
              <Accordion type="single" collapsible defaultValue="categories">
                <AccordionItem value="categories">
                  <AccordionTrigger className="text-lg font-semibold">
                    Categories
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2">
                      {isLoadingProducts ? (
                        Array(5)
                          .fill(0)
                          .map((_, index) => (
                            <Skeleton key={index} className="h-6 w-full" />
                          ))
                      ) : (
                        categories?.map((cat: any) => (
                          <div key={cat.id} className="flex items-center">
                            <Checkbox
                              id={`category-${cat.id}`}
                              checked={cat.id === parseInt(id as string)}
                              onCheckedChange={() => {
                                navigate(`/categories/${cat.id}`);
                              }}
                              className="mr-2"
                            />
                            <label
                              htmlFor={`category-${cat.id}`}
                              className="text-sm cursor-pointer"
                            >
                              {cat.category_name}
                            </label>
                          </div>
                        ))
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>

          {/* Products Grid */}
          <div className="w-full md:w-3/4">
            {/* Sort Options */}
            <div className="flex justify-between items-center mb-6">
              <p className="text-gray-600">
                {isLoadingProducts
                  ? "Loading products..."
                  : `Showing ${filteredProducts.length} products`}
              </p>
              <div className="flex items-center">
                <span className="mr-2 text-sm">Sort by:</span>
                <Select
                  value={sortOption}
                  onValueChange={(value) => setSortOption(value)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="oldest">Oldest</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Products */}
            {isLoadingProducts ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array(6)
                  .fill(0)
                  .map((_, index) => (
                    <div key={index} className="bg-white rounded-lg shadow-sm p-4">
                      <Skeleton className="w-full h-48 rounded-md mb-4" />
                      <Skeleton className="w-2/3 h-6 rounded-md mb-2" />
                      <Skeleton className="w-1/2 h-4 rounded-md mb-4" />
                      <div className="flex items-center justify-between">
                        <Skeleton className="w-1/3 h-6 rounded-md" />
                        <Skeleton className="w-10 h-10 rounded-full" />
                      </div>
                    </div>
                  ))}
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product: any) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  No Products Found
                </h3>
                <p className="text-gray-600 mb-6">
                  We couldn't find any products matching your criteria.
                </p>
                <Button onClick={() => navigate("/")}>Continue Shopping</Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
