"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, ShoppingCart, Store, ShieldCheck, Truck, Star } from "lucide-react";
import { getUser } from "@/lib/auth";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrl: string;
  storeName: string;
  rating: number;
}

const DUMMY_PRODUCTS: Product[] = [
  {
    id: "prod-1",
    name: "Eco Marine Outboard Motor 15HP",
    description: "Ultra-quiet, fuel-efficient 4-stroke outboard motor designed for coastal waters and fishing boats. Built with corrosion-resistant alloys, dual water intakes, and advanced CDI ignition system for reliable starting in any marine condition.",
    price: 18500000,
    stock: 5,
    imageUrl: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&auto=format&fit=crop&q=80",
    storeName: "Toko Bahari Jaya",
    rating: 4.8,
  },
  {
    id: "prod-2",
    name: "Deepsea Sonar Fishfinder",
    description: "High-definition dual-frequency fishfinder with built-in GPS and maps for deep water navigation. Features high-intensity Chirp sonar technology, customizable depth alarms, and heat-map tracking to trace marine life structures easily.",
    price: 4200000,
    stock: 12,
    imageUrl: "https://images.unsplash.com/photo-1544724480-22c66839c994?w=800&auto=format&fit=crop&q=80",
    storeName: "Samudra Marine Spec",
    rating: 4.6,
  },
  {
    id: "prod-3",
    name: "Galvanized Delta Anchor 10kg",
    description: "Heavy-duty hot-dipped galvanized delta anchor with high holding power in sand, weed, and mud. Crafted with a low center of gravity and self-launching design for rapid deployment and immediate set.",
    price: 1350000,
    stock: 8,
    imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80",
    storeName: "Toko Bahari Jaya",
    rating: 4.5,
  },
  {
    id: "prod-4",
    name: "Professional Neoprene Diving Suit",
    description: "5mm super-stretch neoprene wetsuit featuring reinforced knee pads and anatomical thermal lining. Double-blind stitched seams and liquid-tape seals offer premium insulation and high flexibility for prolonged deepwater diving.",
    price: 2750000,
    stock: 15,
    imageUrl: "https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?w=800&auto=format&fit=crop&q=80",
    storeName: "Samudra Marine Spec",
    rating: 4.9,
  },
  {
    id: "prod-5",
    name: "Marine Waterproof VHF Radio",
    description: "Floating 6W handheld marine VHF radio with active noise cancellation and weather alerts. Features IPX8 waterproofing, high-capacity lithium-ion battery, and a glowing seal for night recovery.",
    price: 1950000,
    stock: 20,
    imageUrl: "https://images.unsplash.com/photo-1615461066841-60a63788b201?w=800&auto=format&fit=crop&q=80",
    storeName: "Samudra Marine Spec",
    rating: 4.7,
  },
  {
    id: "prod-6",
    name: "Carbon Fiber Deepsea Fishing Rod",
    description: "Heavy-action 2-piece overhead fishing rod built from premium carbon matrix for maximum torque. Features Fuji guides, ergonomic EVA grips, and heavy-duty reel seats designed to battle major oceanic game.",
    price: 3400000,
    stock: 3,
    imageUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&auto=format&fit=crop&q=80",
    storeName: "Toko Bahari Jaya",
    rating: 4.4,
  },
];

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [role, setRole] = useState<string | undefined>(undefined);

  useEffect(() => {
    const user = getUser();
    setRole(user?.activeRole);

    const found = DUMMY_PRODUCTS.find((p) => p.id === params.id);
    if (found) {
      setProduct(found);
    }
  }, [params.id]);

  const handleQuantityChange = (val: number) => {
    if (!product) return;
    const newQty = Math.max(1, Math.min(product.stock, val));
    setQuantity(newQty);
  };

  const handleAddToCart = () => {
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

    toast.success(`[Level 1 Mock] Added ${quantity} unit(s) of "${product.name}" to cart!`);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-slate-400">
        Product not found.
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
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
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover opacity-90"
          />
        </div>

        {/* Right Side: Product Metadata */}
        <div className="space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center text-teal-400 text-sm font-semibold space-x-1.5">
              <Store className="h-4 w-4" />
              <span>{product.storeName}</span>
            </div>

            <h1 className="text-3xl md:text-4xl font-extrabold text-white leading-tight">
              {product.name}
            </h1>

            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1 bg-amber-500/10 px-2.5 py-1 rounded text-sm text-amber-400 font-bold border border-amber-500/20">
                <Star className="h-4 w-4 fill-amber-400" />
                <span>{product.rating}</span>
              </div>
              <span className="text-slate-500 text-sm">Seller Store Partner</span>
            </div>

            <div className="text-3xl font-extrabold text-white pt-2">
              {formatPrice(product.price)}
            </div>

            <p className="text-slate-300 text-sm leading-relaxed pt-2">
              {product.description}
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
              className="w-full bg-teal-500 hover:bg-teal-600 text-slate-950 font-extrabold py-6 text-md rounded-xl"
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
