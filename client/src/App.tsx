import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";

import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import ProductPage from "@/pages/product-page";
import CategoryPage from "@/pages/category-page";
import CartPage from "@/pages/cart-page";
import CheckoutPage from "@/pages/checkout-page";
import OrderPage from "@/pages/order-page";
import DashboardPage from "@/pages/dashboard-page";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/products/:id" component={ProductPage} />
      <Route path="/categories/:id" component={CategoryPage} />
      <ProtectedRoute path="/cart" component={CartPage} roles={["customer"]} />
      <ProtectedRoute path="/checkout" component={CheckoutPage} roles={["customer"]} />
      <ProtectedRoute path="/orders" component={OrderPage} />
      <ProtectedRoute path="/orders/:id" component={OrderPage} />
      <ProtectedRoute path="/dashboard" component={DashboardPage} roles={["seller", "admin"]} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
