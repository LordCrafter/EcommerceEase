import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import MainLayout from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  CheckCircle2,
  Package, 
  Truck, 
  MapPin, 
  Clock, 
  BadgeCheck,
  Star,
  BarChart4,
  Home,
  User,
  ShoppingCart
} from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";

// Helper function to get status badge variant based on order status
const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case "delivered":
      return "success";
    case "shipped":
      return "default";
    case "processing":
      return "warning";
    case "cancelled":
      return "destructive";
    default:
      return "secondary";
  }
};

export default function OrderPage() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  // Fetch single order if ID is provided
  const {
    data: order,
    isLoading: isLoadingSingleOrder,
    isError: isSingleOrderError,
  } = useQuery({
    queryKey: [id ? `/api/orders/${id}` : null],
    enabled: !!id,
  });

  // Fetch all orders if no ID is provided
  const {
    data: orders,
    isLoading: isLoadingOrders,
    isError: isOrdersError,
  } = useQuery({
    queryKey: [!id ? "/api/orders" : null],
    enabled: !id,
  });

  // Loading states
  const isLoading = id ? isLoadingSingleOrder : isLoadingOrders;
  const isError = id ? isSingleOrderError : isOrdersError;

  // Error handling
  if (isError) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="text-red-500 text-5xl mb-4">
              <AlertIcon className="h-12 w-12 mx-auto" />
            </div>
            <h2 className="text-2xl font-bold mb-2">
              {id ? "Order Not Found" : "Error Loading Orders"}
            </h2>
            <p className="text-gray-600 mb-6">
              {id
                ? "The order you are looking for does not exist or you don't have permission to view it."
                : "There was an error loading your orders. Please try again later."}
            </p>
            <Button onClick={() => navigate("/")}>Back to Home</Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Determine what content to show based on if an ID is provided
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-6">
          <Skeleton className="h-12 w-1/3" />
          <Skeleton className="h-64 w-full" />
        </div>
      );
    }

    if (id) {
      // Single order view
      return renderOrderDetail(order);
    } else {
      // Orders list view
      return renderOrdersList(orders);
    }
  };

  // Render single order detail
  const renderOrderDetail = (order: any) => {
    if (!order) return null;

    const orderDate = new Date(order.order_date);
    const estimatedDelivery = order.shipment?.estimated_delivery
      ? new Date(order.shipment.estimated_delivery)
      : new Date(orderDate.getTime() + 7 * 24 * 60 * 60 * 1000); // Default: 7 days from order date

    return (
      <>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-1">Order Details</h1>
            <p className="text-gray-600">
              Order #{order.order_id} • Placed on{" "}
              {format(new Date(order.order_date), "MMMM d, yyyy")}
            </p>
          </div>
          <Badge
            variant={getStatusBadgeVariant(order.status)}
            className="mt-2 sm:mt-0 w-fit"
          >
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Order Progress */}
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Order Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  {/* Progress line */}
                  <div className="absolute left-6 top-6 h-[calc(100%-32px)] w-0.5 bg-gray-200"></div>

                  {/* Progress steps */}
                  <div className="space-y-8">
                    <div className="flex">
                      <div className={`rounded-full h-12 w-12 flex items-center justify-center text-white ${
                        order.status !== "cancelled" ? "bg-green-500" : "bg-gray-400"
                      }`}>
                        <ShoppingCart className="h-6 w-6" />
                      </div>
                      <div className="ml-4">
                        <h3 className="font-semibold">Order Placed</h3>
                        <p className="text-sm text-gray-600">
                          {format(new Date(order.order_date), "MMMM d, yyyy")}
                        </p>
                      </div>
                    </div>

                    <div className="flex">
                      <div className={`rounded-full h-12 w-12 flex items-center justify-center ${
                        order.payment?.status === "completed" 
                          ? "bg-green-500 text-white" 
                          : "bg-gray-200 text-gray-500"
                      }`}>
                        <BadgeCheck className="h-6 w-6" />
                      </div>
                      <div className="ml-4">
                        <h3 className="font-semibold">Payment Confirmed</h3>
                        <p className="text-sm text-gray-600">
                          {order.payment?.status === "completed"
                            ? format(new Date(order.payment.payment_date), "MMMM d, yyyy")
                            : "Pending confirmation"}
                        </p>
                      </div>
                    </div>

                    <div className="flex">
                      <div className={`rounded-full h-12 w-12 flex items-center justify-center ${
                        order.status === "shipped" || order.status === "delivered" 
                          ? "bg-green-500 text-white" 
                          : "bg-gray-200 text-gray-500"
                      }`}>
                        <Package className="h-6 w-6" />
                      </div>
                      <div className="ml-4">
                        <h3 className="font-semibold">Order Shipped</h3>
                        <p className="text-sm text-gray-600">
                          {order.status === "shipped" || order.status === "delivered"
                            ? order.shipment?.shipment_date 
                              ? format(new Date(order.shipment.shipment_date), "MMMM d, yyyy")
                              : "Your order is on the way"
                            : "Preparing your order"}
                        </p>
                        {order.shipment?.tracking_number && (
                          <p className="text-sm text-primary mt-1">
                            Tracking: {order.shipment.tracking_number}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex">
                      <div className={`rounded-full h-12 w-12 flex items-center justify-center ${
                        order.status === "delivered" 
                          ? "bg-green-500 text-white" 
                          : "bg-gray-200 text-gray-500"
                      }`}>
                        <CheckCircle2 className="h-6 w-6" />
                      </div>
                      <div className="ml-4">
                        <h3 className="font-semibold">Delivered</h3>
                        <p className="text-sm text-gray-600">
                          {order.status === "delivered"
                            ? "Your order has been delivered"
                            : `Estimated delivery by ${format(estimatedDelivery, "MMMM d, yyyy")}`}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-sm text-gray-500 mb-2">SHIPPING ADDRESS</h4>
                  <div className="flex items-start space-x-2">
                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                    <div>
                      <p>{order.contact_name || "Customer"}</p>
                      <p className="text-gray-600">{order.shipping_address}</p>
                      {order.contact_phone && (
                        <p className="text-gray-600">{order.contact_phone}</p>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium text-sm text-gray-500 mb-2">PAYMENT METHOD</h4>
                  <div className="flex items-center space-x-2">
                    <BadgeCheck className="h-4 w-4 text-gray-400" />
                    <p>
                      {order.payment?.method === "credit_card"
                        ? "Credit Card"
                        : order.payment?.method === "paypal"
                        ? "PayPal"
                        : "Bank Transfer"}
                    </p>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium text-sm text-gray-500 mb-2">SHIPPING METHOD</h4>
                  <div className="flex items-center space-x-2">
                    <Truck className="h-4 w-4 text-gray-400" />
                    <p>
                      {order.shipping_method === "express"
                        ? "Express Shipping"
                        : "Standard Shipping"}
                    </p>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium text-sm text-gray-500 mb-2">ORDER TOTAL</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span>${(order.total_price * 0.94).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tax</span>
                      <span>${(order.total_price * 0.06).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-medium mt-2">
                      <span>Total</span>
                      <span>${order.total_price.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Order Items */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Order Items</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-center">Quantity</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  {order.status === "delivered" && user?.role === "customer" && (
                    <TableHead className="text-right">Action</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center">
                        <div className="w-12 h-12 rounded overflow-hidden mr-3">
                          <img
                            src={
                              item.product?.image_url ||
                              `https://source.unsplash.com/featured/50x50?${encodeURIComponent(
                                (item.product?.name || "product").split(" ")[0]
                              )}`
                            }
                            alt={item.product?.name || "Product"}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-medium">{item.product?.name || "Product"}</p>
                          <p className="text-sm text-gray-500">
                            {item.product?.seller?.shop_name || "Shop"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">${item.price.toFixed(2)}</TableCell>
                    <TableCell className="text-center">{item.quantity}</TableCell>
                    <TableCell className="text-right font-medium">
                      ${(item.price * item.quantity).toFixed(2)}
                    </TableCell>
                    {order.status === "delivered" && user?.role === "customer" && (
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8"
                          onClick={() => {
                            setSelectedProduct(item.product);
                            setIsReviewDialogOpen(true);
                          }}
                        >
                          <Star className="h-4 w-4 mr-1" />
                          Review
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => navigate("/orders")}>
            Back to Orders
          </Button>
          <Button onClick={() => window.print()}>Print Receipt</Button>
        </div>
      </>
    );
  };

  // Render list of orders
  const renderOrdersList = (orders: any) => {
    if (!orders || orders.length === 0) {
      return (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center mt-4">
          <div className="text-gray-400 text-5xl mb-4">
            <ShoppingCart className="h-16 w-16 mx-auto" />
          </div>
          <h2 className="text-2xl font-bold mb-2">No Orders Yet</h2>
          <p className="text-gray-600 mb-6">
            You haven't placed any orders yet. Start shopping to see your orders here.
          </p>
          <Button onClick={() => navigate("/")}>Start Shopping</Button>
        </div>
      );
    }

    // Only show relevant tabs for each user role
    const showSellerTabs = user?.role === "seller";
    const showAdminTabs = user?.role === "admin";
    const showCustomerOrders = user?.role === "customer" || showAdminTabs;

    return (
      <>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <h1 className="text-2xl font-bold">Your Orders</h1>
          <Button variant="outline" onClick={() => navigate("/")}>
            Continue Shopping
          </Button>
        </div>

        <Tabs defaultValue={showCustomerOrders ? "all" : "seller"}>
          <TabsList className="mb-4">
            {showCustomerOrders && (
              <TabsTrigger value="all">
                All Orders ({orders.filter((o: any) => !showSellerTabs || o.status !== "cancelled").length})
              </TabsTrigger>
            )}
            {(showSellerTabs || showAdminTabs) && (
              <TabsTrigger value="seller">
                Seller Orders ({orders.filter((o: any) => 
                  o.items?.some((item: any) => 
                    item.product?.seller_id === (user?.seller?.id || 0)
                  )
                ).length})
              </TabsTrigger>
            )}
            {showCustomerOrders && (
              <>
                <TabsTrigger value="processing">
                  Processing ({orders.filter((o: any) => o.status === "processing").length})
                </TabsTrigger>
                <TabsTrigger value="shipped">
                  Shipped ({orders.filter((o: any) => o.status === "shipped").length})
                </TabsTrigger>
                <TabsTrigger value="delivered">
                  Delivered ({orders.filter((o: any) => o.status === "delivered").length})
                </TabsTrigger>
              </>
            )}
          </TabsList>

          {showCustomerOrders && (
            <>
              <TabsContent value="all">
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Order #</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Items</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orders
                          .filter((o: any) => !showSellerTabs || o.status !== "cancelled")
                          .map((order: any) => (
                            <TableRow key={order.id} className="cursor-pointer hover:bg-gray-50">
                              <TableCell
                                className="font-medium"
                                onClick={() => navigate(`/orders/${order.id}`)}
                              >
                                {order.order_id}
                              </TableCell>
                              <TableCell onClick={() => navigate(`/orders/${order.id}`)}>
                                {format(new Date(order.order_date), "MMM d, yyyy")}
                              </TableCell>
                              <TableCell onClick={() => navigate(`/orders/${order.id}`)}>
                                {order.items?.length || 0}
                              </TableCell>
                              <TableCell onClick={() => navigate(`/orders/${order.id}`)}>
                                ${order.total_price.toFixed(2)}
                              </TableCell>
                              <TableCell onClick={() => navigate(`/orders/${order.id}`)}>
                                <Badge variant={getStatusBadgeVariant(order.status)}>
                                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => navigate(`/orders/${order.id}`)}
                                >
                                  View Details
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="processing">
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Order #</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Items</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orders
                          .filter((o: any) => o.status === "processing")
                          .map((order: any) => (
                            <TableRow key={order.id} className="cursor-pointer hover:bg-gray-50">
                              <TableCell
                                className="font-medium"
                                onClick={() => navigate(`/orders/${order.id}`)}
                              >
                                {order.order_id}
                              </TableCell>
                              <TableCell onClick={() => navigate(`/orders/${order.id}`)}>
                                {format(new Date(order.order_date), "MMM d, yyyy")}
                              </TableCell>
                              <TableCell onClick={() => navigate(`/orders/${order.id}`)}>
                                {order.items?.length || 0}
                              </TableCell>
                              <TableCell onClick={() => navigate(`/orders/${order.id}`)}>
                                ${order.total_price.toFixed(2)}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => navigate(`/orders/${order.id}`)}
                                >
                                  View Details
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="shipped">
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Order #</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Items</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Tracking</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orders
                          .filter((o: any) => o.status === "shipped")
                          .map((order: any) => (
                            <TableRow key={order.id} className="cursor-pointer hover:bg-gray-50">
                              <TableCell
                                className="font-medium"
                                onClick={() => navigate(`/orders/${order.id}`)}
                              >
                                {order.order_id}
                              </TableCell>
                              <TableCell onClick={() => navigate(`/orders/${order.id}`)}>
                                {format(new Date(order.order_date), "MMM d, yyyy")}
                              </TableCell>
                              <TableCell onClick={() => navigate(`/orders/${order.id}`)}>
                                {order.items?.length || 0}
                              </TableCell>
                              <TableCell onClick={() => navigate(`/orders/${order.id}`)}>
                                ${order.total_price.toFixed(2)}
                              </TableCell>
                              <TableCell onClick={() => navigate(`/orders/${order.id}`)}>
                                {order.shipment?.tracking_number || "N/A"}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => navigate(`/orders/${order.id}`)}
                                >
                                  View Details
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="delivered">
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Order #</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Items</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orders
                          .filter((o: any) => o.status === "delivered")
                          .map((order: any) => (
                            <TableRow key={order.id} className="cursor-pointer hover:bg-gray-50">
                              <TableCell
                                className="font-medium"
                                onClick={() => navigate(`/orders/${order.id}`)}
                              >
                                {order.order_id}
                              </TableCell>
                              <TableCell onClick={() => navigate(`/orders/${order.id}`)}>
                                {format(new Date(order.order_date), "MMM d, yyyy")}
                              </TableCell>
                              <TableCell onClick={() => navigate(`/orders/${order.id}`)}>
                                {order.items?.length || 0}
                              </TableCell>
                              <TableCell onClick={() => navigate(`/orders/${order.id}`)}>
                                ${order.total_price.toFixed(2)}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end items-center space-x-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => navigate(`/orders/${order.id}`)}
                                  >
                                    View Details
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      // Typically would open a review dialog for all items
                                      toast({
                                        title: "Review Order",
                                        description: "View order details to review individual products.",
                                      });
                                      navigate(`/orders/${order.id}`);
                                    }}
                                  >
                                    <Star className="h-4 w-4 mr-1" />
                                    Review
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
            </>
          )}

          {(showSellerTabs || showAdminTabs) && (
            <TabsContent value="seller">
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order #</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Products</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders
                        .filter((o: any) => 
                          o.items?.some((item: any) => 
                            item.product?.seller_id === (user?.seller?.id || 0)
                          )
                        )
                        .map((order: any) => {
                          // Filter items to only show those from this seller
                          const sellerItems = order.items?.filter(
                            (item: any) => item.product?.seller_id === (user?.seller?.id || 0)
                          );
                          
                          return (
                            <TableRow key={order.id} className="cursor-pointer hover:bg-gray-50">
                              <TableCell
                                className="font-medium"
                                onClick={() => navigate(`/orders/${order.id}`)}
                              >
                                {order.order_id}
                              </TableCell>
                              <TableCell onClick={() => navigate(`/orders/${order.id}`)}>
                                {order.customer?.name || "Customer #" + order.customer_id}
                              </TableCell>
                              <TableCell onClick={() => navigate(`/orders/${order.id}`)}>
                                {format(new Date(order.order_date), "MMM d, yyyy")}
                              </TableCell>
                              <TableCell onClick={() => navigate(`/orders/${order.id}`)}>
                                {sellerItems?.length || 0}
                              </TableCell>
                              <TableCell onClick={() => navigate(`/orders/${order.id}`)}>
                                <Badge variant={getStatusBadgeVariant(order.status)}>
                                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => navigate(`/orders/${order.id}`)}
                                >
                                  View Details
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </>
    );
  };

  // Review dialog for products
  const renderReviewDialog = () => (
    <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Write a Review</DialogTitle>
          <DialogDescription>
            Share your experience with this product
          </DialogDescription>
        </DialogHeader>
        
        {selectedProduct && (
          <div className="mb-4 flex items-center">
            <div className="w-16 h-16 rounded overflow-hidden mr-3">
              <img
                src={
                  selectedProduct.image_url ||
                  `https://source.unsplash.com/featured/100x100?${encodeURIComponent(
                    selectedProduct.name.split(" ")[0]
                  )}`
                }
                alt={selectedProduct.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h3 className="font-medium">{selectedProduct.name}</h3>
              <p className="text-sm text-gray-500">
                {selectedProduct.seller?.shop_name || "Shop"}
              </p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Rating</label>
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map((rating) => (
                <Star
                  key={rating}
                  className="h-8 w-8 cursor-pointer text-gray-300 hover:text-amber-400"
                />
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Your Review</label>
            <textarea
              className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Share your thoughts about this product..."
            ></textarea>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsReviewDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => {
            toast({
              title: "Review Submitted",
              description: "Thank you for your feedback!",
            });
            setIsReviewDialogOpen(false);
          }}>
            Submit Review
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        {renderContent()}
        {renderReviewDialog()}
      </div>
    </MainLayout>
  );
}

// Alert icon component for error states
function AlertIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}
