import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import MainLayout from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { 
  CreditCard, 
  Truck, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Package
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Shipping information schema
const shippingSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number is too short"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  zipCode: z.string().min(5, "Zip code is required"),
  shippingMethod: z.enum(["standard", "express"]),
  paymentMethod: z.enum(["credit_card", "paypal", "bank_transfer"]),
});

type ShippingFormValues = z.infer<typeof shippingSchema>;

export default function CheckoutPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [totals, setTotals] = useState({
    subtotal: 0,
    shipping: 0,
    tax: 0,
    total: 0,
  });

  // Fetch cart data
  const { data: cart, isLoading } = useQuery({
    queryKey: ["/api/cart"],
    onError: () => {
      toast({
        title: "Error loading cart",
        description: "Please try again later.",
        variant: "destructive",
      });
      navigate("/cart");
    },
  });

  // Order mutation
  const orderMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/orders", data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      const orderData = data.order;
      navigate(`/orders/${orderData.id}`);
      toast({
        title: "Order placed successfully",
        description: `Your order #${orderData.order_id} has been placed.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error placing order",
        description: error.message,
        variant: "destructive",
      });
      setStep(1); // Go back to first step
    },
  });

  // Initialize form with default values
  const form = useForm<ShippingFormValues>({
    resolver: zodResolver(shippingSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      shippingMethod: "standard",
      paymentMethod: "credit_card",
    },
  });

  // Calculate totals
  useEffect(() => {
    if (cart?.items) {
      const subtotal = cart.items.reduce(
        (acc: number, item: any) => acc + item.product.price * item.quantity,
        0
      );
      
      // Shipping cost based on method
      const shippingMethod = form.watch("shippingMethod");
      const shipping = shippingMethod === "express" ? 14.99 : (subtotal > 35 ? 0 : 9.99);
      
      const tax = subtotal * 0.06; // 6% tax
      const total = subtotal + shipping + tax;
      setTotals({ subtotal, shipping, tax, total });
    }
  }, [cart, form.watch("shippingMethod")]);

  // Go to next step
  const nextStep = () => {
    if (step === 1) {
      form.trigger().then((isValid) => {
        if (isValid) {
          setStep(2);
        }
      });
    }
  };

  // Submit order
  const onSubmit = (data: ShippingFormValues) => {
    if (step === 2) {
      const orderData = {
        // Order details coming from the form
        shipping_address: `${data.address}, ${data.city}, ${data.state} ${data.zipCode}`,
        contact_name: data.fullName,
        contact_email: data.email,
        contact_phone: data.phone,
        shipping_method: data.shippingMethod,
        payment_method: data.paymentMethod,
      };
      
      orderMutation.mutate(orderData);
    }
  };

  // Check if cart is empty and redirect if so
  useEffect(() => {
    if (cart && (!cart.items || cart.items.length === 0)) {
      toast({
        title: "Empty Cart",
        description: "Your cart is empty. Add some products first.",
        variant: "destructive",
      });
      navigate("/cart");
    }
  }, [cart, navigate, toast]);

  // Loading state
  if (isLoading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold mb-6">Checkout</h1>
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your cart...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Checkout</h1>

        {/* Checkout Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center">
            <div className={`flex items-center ${step >= 1 ? "text-primary" : "text-gray-400"}`}>
              <div className={`rounded-full h-8 w-8 flex items-center justify-center ${step >= 1 ? "bg-primary text-white" : "bg-gray-200 text-gray-600"}`}>
                1
              </div>
              <span className="ml-2 font-medium">Shipping</span>
            </div>
            <div className={`h-0.5 w-16 mx-2 ${step >= 2 ? "bg-primary" : "bg-gray-200"}`}></div>
            <div className={`flex items-center ${step >= 2 ? "text-primary" : "text-gray-400"}`}>
              <div className={`rounded-full h-8 w-8 flex items-center justify-center ${step >= 2 ? "bg-primary text-white" : "bg-gray-200 text-gray-600"}`}>
                2
              </div>
              <span className="ml-2 font-medium">Review & Pay</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Checkout Form */}
          <div className="lg:w-2/3">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {step === 1 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Shipping Information</CardTitle>
                      <CardDescription>
                        Enter your shipping details to continue
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Contact Information */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Contact Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="fullName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Full Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter your full name" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email Address</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter your email" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone Number</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter your phone number" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Shipping Address */}
                      <div className="space-y-4 pt-4">
                        <h3 className="text-lg font-semibold">Shipping Address</h3>
                        <FormField
                          control={form.control}
                          name="address"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Street Address</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Enter your street address" 
                                  className="resize-none" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <FormField
                            control={form.control}
                            name="city"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>City</FormLabel>
                                <FormControl>
                                  <Input placeholder="City" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="state"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>State</FormLabel>
                                <FormControl>
                                  <Input placeholder="State" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="zipCode"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Zip Code</FormLabel>
                                <FormControl>
                                  <Input placeholder="Zip Code" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      {/* Shipping Method */}
                      <div className="space-y-4 pt-4">
                        <h3 className="text-lg font-semibold">Shipping Method</h3>
                        <FormField
                          control={form.control}
                          name="shippingMethod"
                          render={({ field }) => (
                            <FormItem className="space-y-3">
                              <FormControl>
                                <RadioGroup
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                  className="space-y-3"
                                >
                                  <FormItem className="flex items-center space-x-3 space-y-0">
                                    <FormControl>
                                      <RadioGroupItem value="standard" />
                                    </FormControl>
                                    <div className="flex items-center space-x-2">
                                      <Truck className="h-4 w-4 text-gray-500" />
                                      <div className="flex-1">
                                        <FormLabel className="font-normal">
                                          Standard Shipping
                                        </FormLabel>
                                        <FormDescription>
                                          {totals.subtotal > 35 
                                            ? "Free (3-5 business days)" 
                                            : "$9.99 (3-5 business days)"}
                                        </FormDescription>
                                      </div>
                                    </div>
                                  </FormItem>
                                  <FormItem className="flex items-center space-x-3 space-y-0">
                                    <FormControl>
                                      <RadioGroupItem value="express" />
                                    </FormControl>
                                    <div className="flex items-center space-x-2">
                                      <Clock className="h-4 w-4 text-gray-500" />
                                      <div className="flex-1">
                                        <FormLabel className="font-normal">
                                          Express Shipping
                                        </FormLabel>
                                        <FormDescription>
                                          $14.99 (1-2 business days)
                                        </FormDescription>
                                      </div>
                                    </div>
                                  </FormItem>
                                </RadioGroup>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Payment Method */}
                      <div className="space-y-4 pt-4">
                        <h3 className="text-lg font-semibold">Payment Method</h3>
                        <FormField
                          control={form.control}
                          name="paymentMethod"
                          render={({ field }) => (
                            <FormItem className="space-y-3">
                              <FormControl>
                                <RadioGroup
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                  className="space-y-3"
                                >
                                  <FormItem className="flex items-center space-x-3 space-y-0">
                                    <FormControl>
                                      <RadioGroupItem value="credit_card" />
                                    </FormControl>
                                    <div className="flex items-center space-x-2">
                                      <CreditCard className="h-4 w-4 text-gray-500" />
                                      <div className="flex-1">
                                        <FormLabel className="font-normal">
                                          Credit Card
                                        </FormLabel>
                                        <FormDescription>
                                          Pay with Visa, Mastercard, or American Express
                                        </FormDescription>
                                      </div>
                                    </div>
                                  </FormItem>
                                  <FormItem className="flex items-center space-x-3 space-y-0">
                                    <FormControl>
                                      <RadioGroupItem value="paypal" />
                                    </FormControl>
                                    <div className="flex items-center space-x-2">
                                      <div className="h-4 w-4 text-gray-500">
                                        <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                                          <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.12.775-.357 1.622-.675 2.439-.785 2.027-2.17 3.127-3.516 3.936a8.62 8.62 0 0 1-3.254.95c-.752.082-1.57.122-2.39.122h-.279a1.686 1.686 0 0 0-1.666 1.422l-.023.138-.976 6.18-.004.036a.34.34 0 0 1-.337.298H7.076v-.001Z" />
                                          <path d="M18.089 6.977c-.01.082-.022.164-.034.245-.74 3.827-3.279 5.149-6.536 5.149h-1.653a.795.795 0 0 0-.783.667l-.946 5.957-.269 1.7a.421.421 0 0 0 .417.485h2.924a.699.699 0 0 0 .692-.576l.029-.15.55-3.495.035-.18a.699.699 0 0 1 .692-.575h.435c2.821 0 5.03-1.144 5.678-4.456.27-1.376.13-2.527-.582-3.334-.219-.253-.498-.463-.822-.637Z" />
                                        </svg>
                                      </div>
                                      <div className="flex-1">
                                        <FormLabel className="font-normal">
                                          PayPal
                                        </FormLabel>
                                        <FormDescription>
                                          Pay with your PayPal account
                                        </FormDescription>
                                      </div>
                                    </div>
                                  </FormItem>
                                  <FormItem className="flex items-center space-x-3 space-y-0">
                                    <FormControl>
                                      <RadioGroupItem value="bank_transfer" />
                                    </FormControl>
                                    <div className="flex items-center space-x-2">
                                      <svg
                                        className="h-4 w-4 text-gray-500"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      >
                                        <rect x="3" y="5" width="18" height="14" rx="2" />
                                        <line x1="3" y1="10" x2="21" y2="10" />
                                      </svg>
                                      <div className="flex-1">
                                        <FormLabel className="font-normal">
                                          Bank Transfer
                                        </FormLabel>
                                        <FormDescription>
                                          Pay directly from your bank account
                                        </FormDescription>
                                      </div>
                                    </div>
                                  </FormItem>
                                </RadioGroup>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate("/cart")}
                      >
                        Back to Cart
                      </Button>
                      <Button type="button" onClick={nextStep}>
                        Continue to Review
                      </Button>
                    </CardFooter>
                  </Card>
                )}

                {step === 2 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Review Your Order</CardTitle>
                      <CardDescription>
                        Please review your order details before placing your order
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Order Summary */}
                      <div>
                        <h3 className="text-lg font-semibold mb-3">Order Summary</h3>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Product</TableHead>
                              <TableHead className="text-right">Price</TableHead>
                              <TableHead className="text-center">Qty</TableHead>
                              <TableHead className="text-right">Total</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {cart?.items?.map((item: any) => (
                              <TableRow key={item.id}>
                                <TableCell>
                                  <div className="flex items-center">
                                    <div className="w-12 h-12 rounded overflow-hidden mr-3">
                                      <img
                                        src={
                                          item.product.image_url ||
                                          `https://source.unsplash.com/featured/50x50?${encodeURIComponent(
                                            item.product.name.split(" ")[0]
                                          )}`
                                        }
                                        alt={item.product.name}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                    <div>
                                      <p className="font-medium text-sm">
                                        {item.product.name}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        {item.product.seller?.shop_name || "ShopEase"}
                                      </p>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">
                                  ${item.product.price.toFixed(2)}
                                </TableCell>
                                <TableCell className="text-center">
                                  {item.quantity}
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                  ${(item.product.price * item.quantity).toFixed(2)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>

                      {/* Shipping Address */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h3 className="text-lg font-semibold mb-3">Shipping Address</h3>
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="font-medium">{form.getValues("fullName")}</p>
                            <p>{form.getValues("address")}</p>
                            <p>
                              {form.getValues("city")}, {form.getValues("state")}{" "}
                              {form.getValues("zipCode")}
                            </p>
                            <p>{form.getValues("phone")}</p>
                            <p>{form.getValues("email")}</p>
                          </div>
                        </div>

                        <div>
                          <h3 className="text-lg font-semibold mb-3">Payment & Shipping</h3>
                          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                            <div className="flex items-center">
                              <Package className="h-4 w-4 text-gray-500 mr-2" />
                              <div>
                                <p className="font-medium">
                                  {form.getValues("shippingMethod") === "standard"
                                    ? "Standard Shipping"
                                    : "Express Shipping"}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {form.getValues("shippingMethod") === "standard"
                                    ? "Delivery in 3-5 business days"
                                    : "Delivery in 1-2 business days"}
                                </p>
                              </div>
                            </div>
                            <Separator />
                            <div className="flex items-center">
                              <div className="h-4 w-4 text-gray-500 mr-2">
                                {form.getValues("paymentMethod") === "credit_card" ? (
                                  <CreditCard className="h-4 w-4" />
                                ) : form.getValues("paymentMethod") === "paypal" ? (
                                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                                    <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.12.775-.357 1.622-.675 2.439-.785 2.027-2.17 3.127-3.516 3.936a8.62 8.62 0 0 1-3.254.95c-.752.082-1.57.122-2.39.122h-.279a1.686 1.686 0 0 0-1.666 1.422l-.023.138-.976 6.18-.004.036a.34.34 0 0 1-.337.298H7.076v-.001Z" />
                                    <path d="M18.089 6.977c-.01.082-.022.164-.034.245-.74 3.827-3.279 5.149-6.536 5.149h-1.653a.795.795 0 0 0-.783.667l-.946 5.957-.269 1.7a.421.421 0 0 0 .417.485h2.924a.699.699 0 0 0 .692-.576l.029-.15.55-3.495.035-.18a.699.699 0 0 1 .692-.575h.435c2.821 0 5.03-1.144 5.678-4.456.27-1.376.13-2.527-.582-3.334-.219-.253-.498-.463-.822-.637Z" />
                                  </svg>
                                ) : (
                                  <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="h-4 w-4"
                                  >
                                    <rect x="3" y="5" width="18" height="14" rx="2" />
                                    <line x1="3" y1="10" x2="21" y2="10" />
                                  </svg>
                                )}
                              </div>
                              <div>
                                <p className="font-medium">
                                  {form.getValues("paymentMethod") === "credit_card"
                                    ? "Credit Card"
                                    : form.getValues("paymentMethod") === "paypal"
                                    ? "PayPal"
                                    : "Bank Transfer"}
                                </p>
                                <p className="text-sm text-gray-600">
                                  Payment will be processed securely
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Order Total */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Subtotal</span>
                            <span className="font-medium">
                              ${totals.subtotal.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Shipping</span>
                            <span className="font-medium">
                              {totals.shipping === 0
                                ? "Free"
                                : `$${totals.shipping.toFixed(2)}`}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Tax (6%)</span>
                            <span className="font-medium">${totals.tax.toFixed(2)}</span>
                          </div>
                          <Separator />
                          <div className="flex justify-between text-lg">
                            <span className="font-bold">Total</span>
                            <span className="font-bold">${totals.total.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setStep(1)}
                      >
                        Back
                      </Button>
                      <Button 
                        type="submit"
                        disabled={orderMutation.isPending}
                      >
                        {orderMutation.isPending ? "Processing..." : "Place Order"}
                      </Button>
                    </CardFooter>
                  </Card>
                )}
              </form>
            </Form>
          </div>

          {/* Order Summary Sidebar */}
          {step === 1 && (
            <div className="lg:w-1/3">
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Items summary */}
                  <div className="space-y-2">
                    {cart?.items?.map((item: any) => (
                      <div key={item.id} className="flex justify-between items-center">
                        <div className="flex items-center">
                          <div className="bg-gray-100 w-2 h-2 rounded-full mr-2"></div>
                          <span className="text-sm">
                            {item.quantity} x {item.product.name}
                          </span>
                        </div>
                        <span className="text-sm font-medium">
                          ${(item.product.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  {/* Totals */}
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium">${totals.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shipping</span>
                      <span className="font-medium">
                        {totals.shipping === 0 ? "Free" : `$${totals.shipping.toFixed(2)}`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tax (6%)</span>
                      <span className="font-medium">${totals.tax.toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="font-bold">Total</span>
                      <span className="font-bold">${totals.total.toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <div className="w-full space-y-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      <span>Secure checkout</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <AlertTriangle className="h-4 w-4 text-amber-500 mr-2" />
                      <span>Estimated delivery date shown at checkout</span>
                    </div>
                  </div>
                </CardFooter>
              </Card>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
