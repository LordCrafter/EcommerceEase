import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import SellerDashboard from "@/components/dashboard/seller-dashboard";
import AdminDashboard from "@/components/dashboard/admin-dashboard";

export default function DashboardPage() {
  const [, navigate] = useLocation();
  const { user, isLoading } = useAuth();
  const { toast } = useToast();

  // Redirect if user is not an admin or seller
  useEffect(() => {
    if (!isLoading && user) {
      if (user.role !== "admin" && user.role !== "seller") {
        toast({
          title: "Access Denied",
          description: "You don't have permission to access the dashboard.",
          variant: "destructive",
        });
        navigate("/");
      }
    }
  }, [user, isLoading, toast, navigate]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Handle unauthorized access
  if (!user || (user.role !== "admin" && user.role !== "seller")) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <h1 className="text-2xl font-bold text-red-500 mb-4">Access Denied</h1>
        <p className="text-gray-600">
          You don't have permission to access this page.
        </p>
      </div>
    );
  }

  // Render appropriate dashboard based on user role
  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar is included in each dashboard component */}
      
      {/* Main Content */}
      <div className="flex-1">
        {user.role === "seller" && <SellerDashboard />}
        {user.role === "admin" && <AdminDashboard />}
      </div>
    </div>
  );
}
