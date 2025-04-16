import { useQuery } from "@tanstack/react-query";
import MainLayout from "@/components/layout/main-layout";
import HeroSection from "@/components/home/hero-section";
import ProductCard from "@/components/products/product-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  // Fetch featured products
  const { data: products, isLoading: isLoadingProducts } = useQuery({
    queryKey: ["/api/products"],
    queryFn: async () => {
      const res = await fetch("/api/products?status=active");
      if (!res.ok) throw new Error("Failed to fetch products");
      return res.json();
    },
  });

  // Fetch categories
  const { data: categories, isLoading: isLoadingCategories } = useQuery({
    queryKey: ["/api/categories"],
  });

  // Featured products (just take first 4 active products)
  const featuredProducts = products?.filter((p: any) => p.status === "active").slice(0, 4) || [];

  // Popular categories (all categories for now)
  const popularCategories = categories || [];

  return (
    <MainLayout>
      <HeroSection />

      {/* Popular Categories Section */}
      <section className="container mx-auto px-4 py-8 mb-10">
        <h2 className="text-2xl font-bold mb-6">Shop by Category</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {isLoadingCategories
            ? Array(4)
                .fill(0)
                .map((_, index) => (
                  <div key={index} className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <Skeleton className="w-full h-40 rounded-t-md" />
                    <div className="p-4 flex justify-center">
                      <Skeleton className="w-1/2 h-6 rounded-md" />
                    </div>
                  </div>
                ))
            : popularCategories.slice(0, 4).map((category: any) => (
                <Link
                  key={category.id}
                  href={`/categories/${category.id}`}
                  className="block group"
                >
                  <div className="bg-white rounded-lg shadow-sm overflow-hidden group-hover:shadow-md transition-shadow duration-300 h-full">
                    <div className="h-40 bg-gray-100 flex items-center justify-center relative overflow-hidden">
                      {/* Show a gradient background with category name for the image */}
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-indigo-600 opacity-75" />
                      <div className="relative z-10 text-white text-xl font-bold">{category.category_name}</div>
                    </div>
                    <div className="p-4 text-center">
                      <h3 className="font-medium text-gray-800 group-hover:text-primary transition">
                        {category.category_name}
                      </h3>
                    </div>
                  </div>
                </Link>
              ))}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Quality Products</h3>
              <p className="text-gray-600">
                We ensure all our products meet the highest quality standards.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Fast Delivery</h3>
              <p className="text-gray-600">
                Get your orders delivered quickly and efficiently to your doorstep.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-purple-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Secure Payments</h3>
              <p className="text-gray-600">
                Your payment information is always safe and protected with us.
              </p>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
