"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, ShoppingCart, Eye, Store, Star } from "lucide-react";
import { getUser } from "@/lib/auth";
import { toast } from "sonner";
import api from "@/lib/api";

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
    description: "Ultra-quiet, fuel-efficient 4-stroke outboard motor designed for coastal waters and fishing boats.",
    price: 18500000,
    stock: 5,
    imageUrl: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=500&auto=format&fit=crop&q=60",
    storeName: "Toko Bahari Jaya",
    rating: 4.8,
  },
  {
    id: "prod-2",
    name: "Deepsea Sonar Fishfinder",
    description: "High-definition dual-frequency fishfinder with built-in GPS and maps for deep water navigation.",
    price: 4200000,
    stock: 12,
    imageUrl: "https://images.unsplash.com/photo-1544724480-22c66839c994?w=500&auto=format&fit=crop&q=60",
    storeName: "Samudra Marine Spec",
    rating: 4.6,
  },
  {
    id: "prod-3",
    name: "Galvanized Delta Anchor 10kg",
    description: "Heavy-duty hot-dipped galvanized delta anchor with high holding power in sand, weed, and mud.",
    price: 1350000,
    stock: 8,
    imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&auto=format&fit=crop&q=60",
    storeName: "Toko Bahari Jaya",
    rating: 4.5,
  },
  {
    id: "prod-4",
    name: "Professional Neoprene Diving Suit",
    description: "5mm super-stretch neoprene wetsuit featuring reinforced knee pads and anatomical thermal lining.",
    price: 2750000,
    stock: 15,
    imageUrl: "https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?w=500&auto=format&fit=crop&q=60",
    storeName: "Samudra Marine Spec",
    rating: 4.9,
  },
  {
    id: "prod-5",
    name: "Marine Waterproof VHF Radio",
    description: "Floating 6W handheld marine VHF radio with active noise cancellation and weather alerts.",
    price: 1950000,
    stock: 20,
    imageUrl: "https://images.unsplash.com/photo-1615461066841-60a63788b201?w=500&auto=format&fit=crop&q=60",
    storeName: "Samudra Marine Spec",
    rating: 4.7,
  },
  {
    id: "prod-6",
    name: "Carbon Fiber Deepsea Fishing Rod",
    description: "Heavy-action 2-piece overhead fishing rod built from premium carbon matrix for maximum torque.",
    price: 3400000,
    stock: 3,
    imageUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=500&auto=format&fit=crop&q=60",
    storeName: "Toko Bahari Jaya",
    rating: 4.4,
  },
];

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>(DUMMY_PRODUCTS);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<string | undefined>(undefined);

  useEffect(() => {
    const user = getUser();
    setRole(user?.activeRole);
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearch(query);
    if (!query.trim()) {
      setProducts(DUMMY_PRODUCTS);
    } else {
      const filtered = DUMMY_PRODUCTS.filter(
        (p) =>
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          p.description.toLowerCase().includes(query.toLowerCase()) ||
          p.storeName.toLowerCase().includes(query.toLowerCase())
      );
      setProducts(filtered);
    }
  };

  const handleAddToCart = async (productId: string, productName: string) => {
    if (!role) {
      toast.error("Please login to add items to your cart.");
      router.push("/auth/login");
      return;
    }
    if (role !== "BUYER") {
      toast.error(`Your active role is ${role}. Only BUYERs can purchase products.`);
      return;
    }

    // In Level 3 we'll call POST /api/buyer/cart/items
    toast.success(`[Level 1 Mock] Added "${productName}" to cart!`);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Market Catalog</h1>
          <p className="text-slate-400">Discover premium goods, electronics, and accessories.</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Search products or stores..."
            value={search}
            onChange={handleSearch}
            className="pl-9 bg-slate-900 border-white/10 text-white focus:border-teal-500"
          />
        </div>
      </div>

      {/* Product Grid */}
      {products.length === 0 ? (
        <div className="text-center py-20 text-slate-500 border border-white/5 rounded-xl border-dashed">
          No products matched your search.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product) => (
            <Card
              key={product.id}
              className="bg-slate-900/40 border-white/5 hover:border-teal-500/20 transition-all duration-300 flex flex-col justify-between hover:-translate-y-1 group"
            >
              <div className="relative aspect-video w-full overflow-hidden rounded-t-xl bg-slate-950">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-100"
                />
                <div className="absolute top-2 right-2 bg-slate-950/80 px-2 py-0.5 rounded text-xs text-amber-400 font-semibold border border-white/5 flex items-center space-x-1">
                  <Star className="h-3 w-3 fill-amber-400" />
                  <span>{product.rating}</span>
                </div>
              </div>

              <CardHeader className="space-y-1.5 p-5">
                <div className="flex items-center text-teal-400 text-xs font-semibold space-x-1.5 mb-1">
                  <Store className="h-3.5 w-3.5" />
                  <span>{product.storeName}</span>
                </div>
                <CardTitle className="text-lg text-white font-bold leading-snug line-clamp-1">
                  {product.name}
                </CardTitle>
                <CardDescription className="text-slate-400 text-sm line-clamp-2 leading-relaxed">
                  {product.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="px-5 pt-0 pb-4">
                <div className="text-xl font-extrabold text-white">
                  {formatPrice(product.price)}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Stock: <span className="font-semibold text-slate-300">{product.stock} units</span>
                </div>
              </CardContent>

              <CardFooter className="p-5 border-t border-white/5 flex gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 border-white/10 hover:bg-white/5 hover:text-white"
                  onClick={() => router.push(`/products/${product.id}`)}
                >
                  <Eye className="mr-1.5 h-4 w-4" /> Detail
                </Button>
                <Button
                  size="sm"
                  className="flex-1 bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold"
                  onClick={() => handleAddToCart(product.id, product.name)}
                >
                  <ShoppingCart className="mr-1.5 h-4 w-4" /> Add
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
