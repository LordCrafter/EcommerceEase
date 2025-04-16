import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function HeroSection() {
  return (
    <section className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-10">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-8 md:mb-0">
            <h1 className="text-4xl font-bold mb-4">Summer Collections</h1>
            <p className="text-lg mb-6">
              Discover our new arrivals with up to 40% off
            </p>
            <Link href="/categories/1">
              <Button className="bg-white text-primary font-semibold hover:bg-gray-100 transition">
                Shop Now
              </Button>
            </Link>
          </div>
          <div className="md:w-1/2 flex justify-center">
            <div className="relative w-full max-w-md h-64 bg-gradient-to-tr from-blue-600 to-indigo-700 rounded-lg shadow-lg overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-5xl font-bold mb-2">40% OFF</div>
                  <div className="text-xl">Limited Time Offer</div>
                </div>
              </div>
              <div className="absolute bottom-4 right-4">
                <svg className="w-24 h-24 text-white opacity-20" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.5 12.572l-7.5 7.428l-7.5 -7.428m0 -5.143l7.5 7.428l7.5 -7.428" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
