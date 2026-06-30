"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShoppingCart, Store, ShieldCheck, Truck, Star } from "lucide-react";
import { getUser } from "@/lib/auth";
import { toast } from "sonner";
import api from "@/lib/api";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrl: string | null;
  storeId: string;
  store: {
    name: string;
  };
}

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | undefined>(undefined);

  useEffect(() => {
    const user = getUser();
    setRole(user?.activeRole);
    fetchProduct();
  }, [params.id]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/products/${params.id}`);
      setProduct(res.data);
    } catch (err: any) {
      toast.error("Failed to load product details.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (val: number) => {
    if (!product) return;
    const newQty = Math.max(1, Math.min(product.stock, val));
    setQuantity(newQty);
  };

  const handleAddToCart = async () => {
    if (!product) return;
    if (!role) {
      toast.error("Please login to purchase products.");
      router.push("/auth/login");
      return;
    }
    if (role !== "BUYER") {
      toast.error(`Your active role is ${role}. Only BUYERs can add products to cart.`);
      return;
    }

    try {
      await api.post("/buyer/cart/items", {
        productId: product.id,
        quantity,
      });
      toast.success(`Added ${quantity} unit(s) of "${product.name}" to cart!`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to add product to cart.");
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center bg-slate-950">
        <div className="w-10 h-10 border-t-2 border-teal-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-slate-400 flex-grow">
        Product not found or has been disabled.
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6 flex-grow w-full">
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="text-slate-400 hover:text-white hover:bg-white/5"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to catalog
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Left Side: Product Image */}
        <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-slate-900 border border-white/5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.imageUrl || "https://images.unsplash.com/photo-1544724480-22c66839c994?w=800"}
            alt={product.name}
            className="w-full h-full object-cover opacity-90"
          />
        </div>

        {/* Right Side: Product Metadata */}
        <div className="space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div
              onClick={() => router.push(`/stores/${product.storeId}`)}
              className="flex items-center text-teal-400 hover:text-teal-300 cursor-pointer text-sm font-semibold space-x-1.5 w-fit"
            >
              <Store className="h-4 w-4" />
              <span>{product.store.name}</span>
            </div>

            <h1 className="text-3xl md:text-4xl font-extrabold text-white leading-tight">
              {product.name}
            </h1>

            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1 bg-amber-500/10 px-2.5 py-1 rounded text-sm text-amber-400 font-bold border border-amber-500/20">
                <Star className="h-4 w-4 fill-amber-400" />
                <span>4.5</span>
              </div>
              <span className="text-slate-500 text-sm">Verified Merchant Goods</span>
            </div>

            <div className="text-3xl font-extrabold text-white pt-2">
              {formatPrice(product.price)}
            </div>

            <p className="text-slate-300 text-sm leading-relaxed pt-2">
              {product.description || "No description provided for this product."}
            </p>
          </div>

          <div className="space-y-6 border-t border-white/5 pt-6">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Total Stock Available</span>
              <span className="font-semibold text-slate-200">{product.stock} units</span>
            </div>

            {/* Quantity Selector */}
            <div className="flex items-center space-x-4">
              <span className="text-sm text-slate-400">Quantity</span>
              <div className="flex items-center border border-white/10 rounded bg-slate-900">
                <button
                  onClick={() => handleQuantityChange(quantity - 1)}
                  className="px-3 py-1.5 hover:bg-white/5 text-slate-300 focus:outline-none"
                >
                  -
                </button>
                <span className="px-4 py-1.5 text-white text-sm font-semibold">{quantity}</span>
                <button
                  onClick={() => handleQuantityChange(quantity + 1)}
                  className="px-3 py-1.5 hover:bg-white/5 text-slate-300 focus:outline-none"
                >
                  +
                </button>
              </div>
            </div>

            {/* Add to Cart button */}
            <Button
              onClick={handleAddToCart}
              disabled={product.stock <= 0}
              className="w-full bg-teal-500 hover:bg-teal-600 text-slate-950 font-extrabold py-6 text-md rounded-xl disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed"
            >
              <ShoppingCart className="mr-2 h-5 w-5" /> Add to Cart
            </Button>

            {/* Support Info */}
            <div className="grid grid-cols-2 gap-4 text-xs text-slate-500 pt-2 border-t border-white/5">
              <div className="flex items-center space-x-1.5">
                <ShieldCheck className="h-4 w-4 text-blue-400" />
                <span>100% Secure Checkout</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <Truck className="h-4 w-4 text-indigo-400" />
                <span>On-demand sea delivery</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
