"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Trash, ShoppingBag, ArrowRight, Store, RefreshCw, Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: number;
    stock: number;
    imageUrl: string | null;
  };
}

interface CartData {
  id: string;
  storeId: string | null;
  store: { id: string; name: string } | null;
  items: CartItem[];
  subtotal: number;
}

export default function BuyerCartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    setLoading(true);
    try {
      const res = await api.get("/buyer/cart");
      setCart(res.data);
    } catch (err: any) {
      toast.error("Failed to load shopping cart.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQty = async (itemId: string, currentQty: number, change: number, stock: number) => {
    const newQty = currentQty + change;
    if (newQty < 1) return;
    if (newQty > stock) {
      toast.error(`Only ${stock} units are available in stock.`);
      return;
    }

    try {
      await api.put(`/buyer/cart/items/${itemId}`, { quantity: newQty });
      fetchCart();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to update quantity.");
    }
  };

  const handleDeleteItem = async (itemId: string, productName: string) => {
    try {
      await api.delete(`/buyer/cart/items/${itemId}`);
      toast.success(`Removed "${productName}" from cart.`);
      fetchCart();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to remove item.");
    }
  };

  const handleClearCart = async () => {
    if (!confirm("Are you sure you want to clear your cart?")) return;

    try {
      await api.delete("/buyer/cart");
      toast.success("Cart cleared.");
      fetchCart();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to clear cart.");
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <ProtectedRoute allowedRole="BUYER">
      <DashboardLayout role="BUYER">
        <div className="space-y-8">
          <div className="flex justify-between items-center border-b border-white/5 pb-6">
            <div>
              <h1 className="text-3xl font-extrabold text-white">Shopping Cart</h1>
              <p className="text-slate-400">Review items selected for single-merchant checkout.</p>
            </div>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchCart}
                className="border-white/10 text-slate-300 hover:bg-white/5"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              {cart && cart.items.length > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleClearCart}
                  className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20"
                >
                  Clear Cart
                </Button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-t-2 border-teal-400 rounded-full animate-spin" />
            </div>
          ) : !cart || cart.items.length === 0 ? (
            <Card className="bg-slate-900/40 border-white/5 border-dashed p-16 text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-slate-950/60 flex items-center justify-center text-slate-500 mx-auto border border-white/5">
                <ShoppingBag className="h-8 w-8" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-white">Your Cart is Empty</h2>
                <p className="text-slate-400 text-sm max-w-md mx-auto">
                  Browse products in the SeaPedia catalog to queue items for purchase.
                </p>
              </div>
              <Button
                onClick={() => router.push("/products")}
                className="bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold"
              >
                Go Shop Products
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Items List */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-slate-900/60 border border-white/5 rounded-xl px-4 py-3 text-xs text-teal-400 font-semibold flex items-center gap-2">
                  <Store className="h-4 w-4" />
                  <span>Buying from: <strong className="text-white">{cart.store?.name}</strong></span>
                </div>

                <div className="space-y-4">
                  {cart.items.map((item) => (
                    <Card
                      key={item.id}
                      className="bg-slate-900/40 border-white/5 p-4 flex gap-4 items-center justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded overflow-hidden bg-slate-950 border border-white/5 shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.product.imageUrl || "https://images.unsplash.com/photo-1544724480-22c66839c994?w=150"}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <h4 className="font-bold text-white text-sm line-clamp-1">{item.product.name}</h4>
                          <div className="text-xs text-teal-300 font-semibold mt-1">
                            {formatPrice(item.product.price)}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            Stock: {item.product.stock} units
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        {/* Quantity controls */}
                        <div className="flex items-center border border-white/10 rounded bg-slate-950 text-xs font-semibold">
                          <button
                            onClick={() => handleUpdateQty(item.id, item.quantity, -1, item.product.stock)}
                            className="px-2.5 py-1.5 text-slate-400 hover:text-white"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="px-3 py-1.5 text-white">{item.quantity}</span>
                          <button
                            onClick={() => handleUpdateQty(item.id, item.quantity, 1, item.product.stock)}
                            className="px-2.5 py-1.5 text-slate-400 hover:text-white"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>

                        {/* Delete button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteItem(item.id, item.product.name)}
                          className="text-red-400 hover:bg-red-500/10 hover:text-red-300 shrink-0"
                        >
                          <Trash className="h-4.5 w-4.5" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Checkout Summary Card */}
              <div className="lg:col-span-1">
                <Card className="bg-slate-900/40 border-white/5 p-6 space-y-6">
                  <h3 className="font-bold text-white text-lg border-b border-white/5 pb-4">
                    Order Summary
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between text-slate-400">
                      <span>Subtotal</span>
                      <span className="font-semibold text-slate-200">{formatPrice(cart.subtotal)}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 leading-normal pt-2 border-t border-white/5">
                      PPN (12%) and delivery shipping fees will be computed on the next checkout step.
                    </div>
                  </div>
                  <Button
                    onClick={() => router.push("/buyer/checkout")}
                    className="w-full bg-teal-500 hover:bg-teal-600 text-slate-950 font-extrabold py-6 text-md rounded-xl"
                  >
                    Proceed to Checkout <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Card>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
