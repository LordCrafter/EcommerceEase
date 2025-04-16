import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function HeroSection() {
  return (
    <section className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-10">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center text-center">
          <h1 className="text-4xl font-bold mb-4">Welcome to ShopEase</h1>
          <p className="text-lg mb-6">
            Your one-stop shop for all your needs
          </p>
          <Link href="/categories/1">
            <Button className="bg-white text-primary font-semibold hover:bg-gray-100 transition">
              Shop Now
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
