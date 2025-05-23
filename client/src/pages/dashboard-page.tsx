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
        <p className="text-gray-600 mb-4">
          You don't have permission to access this page.
        </p>
        <div className="max-w-md text-center bg-blue-50 p-4 rounded-lg border border-blue-200 text-sm">
          <p className="font-medium text-blue-700 mb-2">Account Information</p>
          <p className="mb-2">Your current role: <span className="font-bold">{user?.role || 'Not logged in'}</span></p>
          <p className="mb-4">The dashboard is only accessible to users with <span className="font-bold">seller</span> or <span className="font-bold">admin</span> roles.</p>
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Return to Home
          </button>
        </div>
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
