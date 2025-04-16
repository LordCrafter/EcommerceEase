import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Users,
  Store,
  Package,
  ShoppingCart,
  Tag,
  Settings,
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Filter,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

export function AdminDashboard() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [page, setPage] = useState(1);
  const [isDeleteUserDialogOpen, setIsDeleteUserDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<number | null>(null);
  const [isDeleteSellerDialogOpen, setIsDeleteSellerDialogOpen] = useState(false);
  const [sellerToDelete, setSellerToDelete] = useState<number | null>(null);
  const [isProductActionDialogOpen, setIsProductActionDialogOpen] = useState(false);
  const [productAction, setProductAction] = useState<{ id: number; action: string } | null>(null);

  // Fetch users
  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["/api/users"],
  });

  // Fetch sellers
  const { data: sellers, isLoading: isLoadingSellers } = useQuery({
    queryKey: ["/api/sellers"],
  });

  // Fetch products
  const { data: products, isLoading: isLoadingProducts } = useQuery({
    queryKey: ["/api/products"],
  });

  // Fetch orders
  const { data: orders, isLoading: isLoadingOrders } = useQuery({
    queryKey: ["/api/orders"],
  });

  // Fetch categories
  const { data: categories, isLoading: isLoadingCategories } = useQuery({
    queryKey: ["/api/categories"],
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      return await apiRequest("DELETE", `/api/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsDeleteUserDialogOpen(false);
      setUserToDelete(null);
      toast({
        title: "User deleted",
        description: "User has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting user",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete seller mutation
  const deleteSellerMutation = useMutation({
    mutationFn: async (sellerId: number) => {
      return await apiRequest("DELETE", `/api/sellers/${sellerId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sellers"] });
      setIsDeleteSellerDialogOpen(false);
      setSellerToDelete(null);
      toast({
        title: "Seller deleted",
        description: "Seller has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting seller",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Approve/reject/delist product mutation
  const productActionMutation = useMutation({
    mutationFn: async ({ id, action }: { id: number; action: string }) => {
      const status = action === "approve" ? "active" : action === "reject" ? "rejected" : "delisted";
      return await apiRequest("PUT", `/api/products/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setIsProductActionDialogOpen(false);
      setProductAction(null);
      toast({
        title: "Product updated",
        description: "Product status has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating product",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDeleteUser = (userId: number) => {
    setUserToDelete(userId);
    setIsDeleteUserDialogOpen(true);
  };

  const confirmDeleteUser = () => {
    if (userToDelete !== null) {
      deleteUserMutation.mutate(userToDelete);
    }
  };

  const handleDeleteSeller = (sellerId: number) => {
    setSellerToDelete(sellerId);
    setIsDeleteSellerDialogOpen(true);
  };

  const confirmDeleteSeller = () => {
    if (sellerToDelete !== null) {
      deleteSellerMutation.mutate(sellerToDelete);
    }
  };

  const handleProductAction = (id: number, action: string) => {
    setProductAction({ id, action });
    setIsProductActionDialogOpen(true);
  };

  const confirmProductAction = () => {
    if (productAction !== null) {
      productActionMutation.mutate(productAction);
    }
  };

  // Calculate stats
  const totalUsers = users?.length || 0;
  const totalSellers = sellers?.length || 0;
  const totalProducts = products?.length || 0;
  const totalOrders = orders?.length || 0;

  // Filter products by status
  const pendingApprovalProducts = products?.filter((p: any) => p.status === "pending") || [];
  const listedProducts = products?.filter((p: any) => p.status === "active") || [];
  const delistedProducts = products?.filter((p: any) => p.status === "delisted" || p.status === "rejected") || [];

  // Filter users by role
  const customerUsers = users?.filter((u: any) => u.role === "customer") || [];
  const sellerUsers = users?.filter((u: any) => u.role === "seller") || [];
  const adminUsers = users?.filter((u: any) => u.role === "admin") || [];

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
      </div>

      <Tabs defaultValue="dashboard" onValueChange={setActiveTab} value={activeTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="sellers">Sellers</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalUsers}</div>
                <p className="text-xs text-muted-foreground">
                  {customerUsers.length} customers, {sellerUsers.length} sellers
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Sellers</CardTitle>
                <Store className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalSellers}</div>
                <p className="text-xs text-muted-foreground">
                  +12.8% from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Products</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalProducts}</div>
                <p className="text-xs text-muted-foreground">
                  {pendingApprovalProducts.length} pending approval
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Orders</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalOrders}</div>
                <p className="text-xs text-muted-foreground">
                  {orders?.filter((o: any) => o.status === "processing").length} processing
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Sign-ups</CardTitle>
                <CardDescription>
                  Recent user registrations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Joined</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoadingUsers ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center">
                            Loading users...
                          </TableCell>
                        </TableRow>
                      ) : users && users.length > 0 ? (
                        users
                          .sort((a: any, b: any) => new Date(b.registration_date).getTime() - new Date(a.registration_date).getTime())
                          .slice(0, 5)
                          .map((user: any) => (
                            <TableRow key={user.id}>
                              <TableCell className="font-medium">
                                {user.name || user.username}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    user.role === "admin"
                                      ? "destructive"
                                      : user.role === "seller"
                                      ? "secondary"
                                      : "default"
                                  }
                                >
                                  {user.role}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {new Date(user.registration_date).toLocaleDateString()}
                              </TableCell>
                            </TableRow>
                          ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center">
                            No users found.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pending Approvals</CardTitle>
                <CardDescription>
                  Products pending approval
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Seller</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoadingProducts ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center">
                            Loading products...
                          </TableCell>
                        </TableRow>
                      ) : pendingApprovalProducts.length > 0 ? (
                        pendingApprovalProducts.map((product: any) => (
                          <TableRow key={product.id}>
                            <TableCell className="font-medium">
                              {product.name}
                            </TableCell>
                            <TableCell>
                              {product.seller?.shop_name || "Unknown Seller"}
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-green-500 border-green-500 hover:bg-green-50"
                                  onClick={() => handleProductAction(product.id, "approve")}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-500 border-red-500 hover:bg-red-50"
                                  onClick={() => handleProductAction(product.id, "reject")}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center">
                            No products pending approval.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  Manage all users on the platform
                </CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex justify-end">
                <div className="flex w-full max-w-sm items-center space-x-2">
                  <Input placeholder="Search users..." />
                  <Button type="submit">Search</Button>
                </div>
              </div>
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40px]">
                        <Checkbox />
                      </TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingUsers ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center">
                          Loading users...
                        </TableCell>
                      </TableRow>
                    ) : users && users.length > 0 ? (
                      users.map((user: any) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <Checkbox />
                          </TableCell>
                          <TableCell className="font-medium">
                            <div className="flex items-center">
                              <div className="relative h-10 w-10 mr-4">
                                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                  <span className="font-medium text-gray-600">
                                    {(user.name || user.username).charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              </div>
                              <div>
                                <div className="font-medium">{user.name || user.username}</div>
                                <div className="text-sm text-gray-500">ID: {user.id}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                user.role === "admin"
                                  ? "destructive"
                                  : user.role === "seller"
                                  ? "secondary"
                                  : "default"
                              }
                            >
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="success">Active</Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(user.registration_date).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button variant="ghost" size="icon">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteUser(user.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center">
                          No users found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
              <div className="mt-4">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious href="#" />
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationLink href="#" isActive>
                        1
                      </PaginationLink>
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationLink href="#">2</PaginationLink>
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationLink href="#">3</PaginationLink>
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationNext href="#" />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sellers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Seller Management</CardTitle>
              <CardDescription>
                Manage all sellers on the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Seller</TableHead>
                      <TableHead>Shop Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Products</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingSellers ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center">
                          Loading sellers...
                        </TableCell>
                      </TableRow>
                    ) : sellers && sellers.length > 0 ? (
                      sellers.map((seller: any) => (
                        <TableRow key={seller.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center">
                              <div className="relative h-10 w-10 mr-4">
                                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                  <span className="font-medium text-gray-600">
                                    {seller.user?.name?.charAt(0).toUpperCase() || 'S'}
                                  </span>
                                </div>
                              </div>
                              <div>
                                <div className="font-medium">{seller.user?.name || seller.user?.username}</div>
                                <div className="text-sm text-gray-500">ID: {seller.seller_id}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{seller.shop_name}</TableCell>
                          <TableCell>{seller.user?.email}</TableCell>
                          <TableCell>
                            <Badge variant="success">Active</Badge>
                          </TableCell>
                          <TableCell>
                            {products?.filter((p: any) => p.seller_id === seller.id).length || 0}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button variant="ghost" size="icon">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteSeller(seller.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center">
                          No sellers found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Product Management</CardTitle>
                <CardDescription>
                  Manage all products on the platform
                </CardDescription>
              </div>
              <div className="flex space-x-2">
                <Button variant="success" size="sm">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve All
                </Button>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all">
                <TabsList className="mb-4">
                  <TabsTrigger value="all">All Products ({totalProducts})</TabsTrigger>
                  <TabsTrigger value="pending">Pending ({pendingApprovalProducts.length})</TabsTrigger>
                  <TabsTrigger value="listed">Listed ({listedProducts.length})</TabsTrigger>
                  <TabsTrigger value="delisted">Delisted ({delistedProducts.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="all">
                  <ScrollArea className="h-[400px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[40px]">
                            <Checkbox />
                          </TableHead>
                          <TableHead>Product</TableHead>
                          <TableHead>Seller</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoadingProducts ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center">
                              Loading products...
                            </TableCell>
                          </TableRow>
                        ) : products && products.length > 0 ? (
                          products.map((product: any) => (
                            <TableRow key={product.id}>
                              <TableCell>
                                <Checkbox />
                              </TableCell>
                              <TableCell className="font-medium">
                                <div className="flex items-center">
                                  <div className="w-10 h-10 mr-3">
                                    <img
                                      src={product.image_url || `https://source.unsplash.com/featured/40x40?${encodeURIComponent(product.name.split(' ')[0])}`}
                                      alt={product.name}
                                      className="rounded object-cover w-10 h-10"
                                    />
                                  </div>
                                  <div>
                                    <div className="font-medium">{product.name}</div>
                                    <div className="text-sm text-gray-500">ID: {product.product_id}</div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>{product.seller?.shop_name || "Unknown"}</TableCell>
                              <TableCell>
                                {product.categories?.length > 0
                                  ? product.categories[0].category_name
                                  : "Uncategorized"}
                              </TableCell>
                              <TableCell>${product.price.toFixed(2)}</TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    product.status === "active"
                                      ? "success"
                                      : product.status === "pending"
                                      ? "warning"
                                      : "destructive"
                                  }
                                >
                                  {product.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex space-x-2">
                                  {product.status === "pending" && (
                                    <>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-green-500 hover:text-green-700"
                                        onClick={() => handleProductAction(product.id, "approve")}
                                      >
                                        <CheckCircle className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-red-500 hover:text-red-700"
                                        onClick={() => handleProductAction(product.id, "reject")}
                                      >
                                        <XCircle className="h-4 w-4" />
                                      </Button>
                                    </>
                                  )}

                                  {product.status === "active" && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="text-red-500 hover:text-red-700"
                                      onClick={() => handleProductAction(product.id, "delist")}
                                    >
                                      <AlertTriangle className="h-4 w-4" />
                                    </Button>
                                  )}

                                  {(product.status === "delisted" || product.status === "rejected") && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="text-green-500 hover:text-green-700"
                                      onClick={() => handleProductAction(product.id, "approve")}
                                    >
                                      <CheckCircle className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center">
                              No products found.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="pending">
                  <ScrollArea className="h-[400px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[40px]">
                            <Checkbox />
                          </TableHead>
                          <TableHead>Product</TableHead>
                          <TableHead>Seller</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoadingProducts ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center">
                              Loading products...
                            </TableCell>
                          </TableRow>
                        ) : pendingApprovalProducts.length > 0 ? (
                          pendingApprovalProducts.map((product: any) => (
                            <TableRow key={product.id}>
                              <TableCell>
                                <Checkbox />
                              </TableCell>
                              <TableCell className="font-medium">
                                <div className="flex items-center">
                                  <div className="w-10 h-10 mr-3">
                                    <img
                                      src={product.image_url || `https://source.unsplash.com/featured/40x40?${encodeURIComponent(product.name.split(' ')[0])}`}
                                      alt={product.name}
                                      className="rounded object-cover w-10 h-10"
                                    />
                                  </div>
                                  <div>
                                    <div className="font-medium">{product.name}</div>
                                    <div className="text-sm text-gray-500">ID: {product.product_id}</div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>{product.seller?.shop_name || "Unknown"}</TableCell>
                              <TableCell>
                                {product.categories?.length > 0
                                  ? product.categories[0].category_name
                                  : "Uncategorized"}
                              </TableCell>
                              <TableCell>${product.price.toFixed(2)}</TableCell>
                              <TableCell>
                                <div className="flex space-x-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-green-500 hover:text-green-700"
                                    onClick={() => handleProductAction(product.id, "approve")}
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-red-500 hover:text-red-700"
                                    onClick={() => handleProductAction(product.id, "reject")}
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center">
                              No pending products found.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="listed">
                  {/* Similar table structure for listed products */}
                </TabsContent>

                <TabsContent value="delisted">
                  {/* Similar table structure for delisted products */}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Order Management</CardTitle>
              <CardDescription>
                Track and manage all orders
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingOrders ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center">
                          Loading orders...
                        </TableCell>
                      </TableRow>
                    ) : orders && orders.length > 0 ? (
                      orders.map((order: any) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">
                            {order.order_id}
                          </TableCell>
                          <TableCell>
                            {order.customer?.name || order.customer?.username || "Customer #" + order.customer_id}
                          </TableCell>
                          <TableCell>
                            {new Date(order.order_date).toLocaleDateString()}
                          </TableCell>
                          <TableCell>${order.total_price.toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                order.status === "delivered"
                                  ? "success"
                                  : order.status === "shipped"
                                  ? "default"
                                  : order.status === "processing"
                                  ? "warning"
                                  : "destructive"
                              }
                            >
                              {order.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                order.payment?.status === "completed"
                                  ? "success"
                                  : "warning"
                              }
                            >
                              {order.payment?.status || "Unknown"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm">
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center">
                          No orders found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete User Confirmation Dialog */}
      <Dialog open={isDeleteUserDialogOpen} onOpenChange={setIsDeleteUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm User Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteUserDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteUser}
              disabled={deleteUserMutation.isPending}
            >
              {deleteUserMutation.isPending ? "Deleting..." : "Delete User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Seller Confirmation Dialog */}
      <Dialog open={isDeleteSellerDialogOpen} onOpenChange={setIsDeleteSellerDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Seller Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this seller? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteSellerDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteSeller}
              disabled={deleteSellerMutation.isPending}
            >
              {deleteSellerMutation.isPending ? "Deleting..." : "Delete Seller"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Product Action Confirmation Dialog */}
      <Dialog open={isProductActionDialogOpen} onOpenChange={setIsProductActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Confirm Product {productAction?.action === "approve"
                ? "Approval"
                : productAction?.action === "reject"
                ? "Rejection"
                : "Delisting"}
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to {productAction?.action} this product?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsProductActionDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant={productAction?.action === "approve" ? "default" : "destructive"}
              onClick={confirmProductAction}
              disabled={productActionMutation.isPending}
            >
              {productActionMutation.isPending
                ? "Processing..."
                : productAction?.action === "approve"
                ? "Approve"
                : productAction?.action === "reject"
                ? "Reject"
                : "Delist"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminDashboard;
