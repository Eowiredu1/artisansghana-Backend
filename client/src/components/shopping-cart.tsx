import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Trash2, Plus, Minus, ShoppingCart as CartIcon, CreditCard } from "lucide-react";
import type { CartItem, Product } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

interface ShoppingCartProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CartItemWithProduct extends CartItem {
  product: Product;
}

const checkoutSchema = z.object({
  shippingAddress: z.string().min(1, "Shipping address is required"),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

export default function ShoppingCart({ isOpen, onClose }: ShoppingCartProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCheckout, setShowCheckout] = useState(false);

  const { data: cartItems, isLoading } = useQuery<CartItemWithProduct[]>({
    queryKey: ["/api/cart"],
    enabled: isOpen && !!user,
    select: async (items: CartItem[]) => {
      // Fetch product details for each cart item
      const itemsWithProducts = await Promise.all(
        items.map(async (item) => {
          const response = await fetch(`/api/products/${item.productId}`, {
            credentials: "include",
          });
          const product = await response.json();
          return { ...item, product };
        })
      );
      return itemsWithProducts;
    },
  });

  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      shippingAddress: "",
    },
  });

  const updateQuantityMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      if (quantity <= 0) {
        await apiRequest("DELETE", `/api/cart/${id}`);
      } else {
        await apiRequest("PUT", `/api/cart/${id}`, { quantity });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const removeItemMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/cart/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Item removed",
        description: "Item has been removed from your cart.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const checkoutMutation = useMutation({
    mutationFn: async (data: CheckoutFormData) => {
      const items = cartItems?.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
      })) || [];

      await apiRequest("POST", "/api/orders", {
        shippingAddress: data.shippingAddress,
        items,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      setShowCheckout(false);
      onClose();
      toast({
        title: "Order placed successfully!",
        description: "Your order has been submitted and is being processed.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Checkout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateQuantity = (id: string, currentQuantity: number, change: number) => {
    const newQuantity = currentQuantity + change;
    updateQuantityMutation.mutate({ id, quantity: newQuantity });
  };

  const removeItem = (id: string) => {
    removeItemMutation.mutate(id);
  };

  const handleCheckout = (data: CheckoutFormData) => {
    checkoutMutation.mutate(data);
  };

  const subtotal = cartItems?.reduce(
    (sum, item) => sum + parseFloat(item.product.price) * item.quantity,
    0
  ) || 0;

  const tax = subtotal * 0.08; // 8% tax
  const shipping = subtotal > 100 ? 0 : 15; // Free shipping over $100
  const total = subtotal + tax + shipping;

  if (!user || user.role !== "buyer") {
    return null;
  }

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="right" className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <CartIcon className="w-5 h-5" />
              Shopping Cart
            </SheetTitle>
          </SheetHeader>

          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-auto py-6">
              {isLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
                      <Skeleton className="w-16 h-16 rounded" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                        <Skeleton className="h-4 w-1/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : !cartItems || cartItems.length === 0 ? (
                <div className="text-center py-12">
                  <CartIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">Your cart is empty</p>
                  <Button onClick={onClose}>Continue Shopping</Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center space-x-4 p-4 border rounded-lg"
                      data-testid={`cart-item-${item.id}`}
                    >
                      {item.product.imageUrl ? (
                        <img
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                          <CartIcon className="w-6 h-6 text-gray-400" />
                        </div>
                      )}

                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{item.product.name}</h4>
                        <p className="text-sm text-gray-600 line-clamp-1">{item.product.description}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-lg font-bold text-primary">
                            ${item.product.price}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            {item.product.category}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex flex-col items-end space-y-2">
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(item.id, item.quantity, -1)}
                            disabled={updateQuantityMutation.isPending}
                            data-testid={`button-decrease-${item.id}`}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          
                          <span className="text-sm font-medium w-8 text-center" data-testid={`quantity-${item.id}`}>
                            {item.quantity}
                          </span>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(item.id, item.quantity, 1)}
                            disabled={updateQuantityMutation.isPending || item.quantity >= item.product.stock}
                            data-testid={`button-increase-${item.id}`}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeItem(item.id)}
                          disabled={removeItemMutation.isPending}
                          className="text-red-600 hover:text-red-700"
                          data-testid={`button-remove-${item.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cartItems && cartItems.length > 0 && (
              <div className="border-t pt-4">
                {/* Order Summary */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span data-testid="cart-subtotal">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tax</span>
                    <span data-testid="cart-tax">${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Shipping</span>
                    <span data-testid="cart-shipping">
                      {shipping === 0 ? "FREE" : `$${shipping.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between font-semibold">
                      <span>Total</span>
                      <span data-testid="cart-total">${total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => setShowCheckout(true)}
                  className="w-full"
                  data-testid="button-checkout"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Proceed to Checkout
                </Button>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Checkout Dialog */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Checkout</DialogTitle>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(handleCheckout)} className="space-y-4">
            <div>
              <Label htmlFor="shipping-address">Shipping Address</Label>
              <Textarea
                id="shipping-address"
                {...form.register("shippingAddress")}
                placeholder="Enter your complete shipping address..."
                data-testid="input-shipping-address"
              />
              {form.formState.errors.shippingAddress && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.shippingAddress.message}
                </p>
              )}
            </div>

            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? "FREE" : `$${shipping.toFixed(2)}`}</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Notice */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Demo Mode:</strong> This is a demonstration checkout. No real payment will be processed.
              </p>
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCheckout(false)}
                data-testid="button-cancel-checkout"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={checkoutMutation.isPending}
                data-testid="button-place-order"
              >
                {checkoutMutation.isPending ? "Processing..." : "Place Order"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
