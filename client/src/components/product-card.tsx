import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Star, Package, ShoppingCart } from "lucide-react";
import type { Product } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addToCartMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/cart", {
        productId: product.id,
        quantity: 1,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Added to cart",
        description: `${product.name} has been added to your cart.`,
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

  const handleAddToCart = () => {
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to add items to cart.",
        variant: "destructive",
      });
      return;
    }

    if (user.role !== "buyer") {
      toast({
        title: "Access denied",
        description: "Only buyers can add items to cart.",
        variant: "destructive",
      });
      return;
    }

    if (product.stock === 0) {
      toast({
        title: "Out of stock",
        description: "This product is currently out of stock.",
        variant: "destructive",
      });
      return;
    }

    addToCartMutation.mutate();
  };

  const getStockStatus = () => {
    if (product.stock === 0) {
      return <Badge variant="destructive">Out of Stock</Badge>;
    } else if (product.stock < 10) {
      return <Badge variant="outline">Low Stock</Badge>;
    } else {
      return <Badge variant="default">In Stock</Badge>;
    }
  };

  return (
    <Card 
      className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group"
      data-testid={`product-card-${product.id}`}
    >
      <div className="relative">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-48 bg-gray-200 flex items-center justify-center group-hover:bg-gray-300 transition-colors">
            <Package className="w-12 h-12 text-gray-400" />
          </div>
        )}
        
        <div className="absolute top-2 right-2">
          {getStockStatus()}
        </div>
      </div>

      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-1" data-testid={`product-name-${product.id}`}>
            {product.name}
          </h3>
        </div>

        <p className="text-gray-600 text-sm mb-3 line-clamp-2" data-testid={`product-description-${product.id}`}>
          {product.description}
        </p>

        <div className="flex items-center justify-between mb-4">
          <div className="text-2xl font-bold text-primary" data-testid={`product-price-${product.id}`}>
            ${product.price}
          </div>
          <div className="text-sm text-gray-500">
            Stock: {product.stock}
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <Badge variant="secondary" className="text-xs">
            {product.category}
          </Badge>
          
          <div className="flex items-center text-sm text-gray-600">
            <Star className="w-4 h-4 text-yellow-400 mr-1 fill-current" />
            <span>4.8</span>
            <span className="mx-1">·</span>
            <span>142 reviews</span>
          </div>
        </div>

        {user?.role === "buyer" && (
          <Button
            onClick={handleAddToCart}
            disabled={product.stock === 0 || addToCartMutation.isPending}
            className="w-full bg-primary text-white hover:bg-primary-600 transition-colors"
            data-testid={`button-add-to-cart-${product.id}`}
          >
            {addToCartMutation.isPending ? (
              "Adding..."
            ) : product.stock === 0 ? (
              "Out of Stock"
            ) : (
              <>
                <ShoppingCart className="w-4 h-4 mr-2" />
                Add to Cart
              </>
            )}
          </Button>
        )}

        {!user && (
          <Button
            onClick={handleAddToCart}
            variant="outline"
            className="w-full"
            data-testid={`button-add-to-cart-${product.id}`}
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            Sign in to Purchase
          </Button>
        )}

        {user && user.role !== "buyer" && (
          <div className="text-center text-sm text-gray-500 py-2">
            Switch to buyer account to purchase
          </div>
        )}
      </CardContent>
    </Card>
  );
}
