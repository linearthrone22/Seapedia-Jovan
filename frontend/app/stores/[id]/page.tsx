"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Store, ShoppingCart, Eye, Star, ArrowLeft, ArrowRight, Package } from "lucide-react";
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
}

interface StoreData {
  id: string;
  name: string;
  description: string | null;
}

export default function PublicStorePage() {
  const router = useRouter();
  const params = useParams();
  const [store, setStore] = useState<StoreData | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | undefined>(undefined);

  useEffect(() => {
    const user = getUser();
    setRole(user?.activeRole);
  }, []);

  useEffect(() => {
    fetchStoreData();
  }, [params.id, page]);

  const fetchStoreData = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/stores/${params.id}`, {
        params: { page, limit: 9 },
      });
      setStore(res.data.store);
      setProducts(res.data.products);
      setTotalPages(res.data.pagination.pages);
    } catch (err: any) {
      toast.error("Failed to load storefront catalog.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (productId: string, productName: string) => {
    if (!role) {
      toast.error("Please login to purchase items.");
      router.push("/auth/login");
      return;
    }
    if (role !== "BUYER") {
      toast.error(`Your active role is ${role}. Only BUYERs can add products to cart.`);
      return;
    }

    try {
      await api.post("/buyer/cart/items", { productId, quantity: 1 });
      toast.success(`Added "${productName}" to cart!`);
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

  if (loading && !store) {
    return (
      <div className="flex-grow flex items-center justify-center bg-slate-950">
        <div className="w-10 h-10 border-t-2 border-teal-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-slate-400 flex-grow">
        Store not found.
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 flex-grow w-full">
      {/* Store Banner */}
      <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-400 border border-teal-500/20 shrink-0">
            <Store className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white">{store.name}</h1>
            <p className="text-slate-400 text-sm mt-1 max-w-xl">
              {store.description || "No store description listed."}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push("/products")}
          className="border-white/10 text-slate-300 hover:bg-white/5"
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" /> All Products
        </Button>
      </div>

      {/* Catalog Title */}
      <div className="border-b border-white/5 pb-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Package className="h-5 w-5 text-teal-400" /> Catalog Products
        </h2>
      </div>

      {/* Store Product Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-t-2 border-teal-400 rounded-full animate-spin" />
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 text-slate-500 border border-white/5 border-dashed rounded-xl">
          This merchant hasn&apos;t listed any items yet.
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product) => (
              <Card
                key={product.id}
                className="bg-slate-900/40 border-white/5 hover:border-teal-500/20 transition-all duration-300 flex flex-col justify-between hover:-translate-y-1 group"
              >
                <div className="relative aspect-video w-full overflow-hidden rounded-t-xl bg-slate-950">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={product.imageUrl || "https://images.unsplash.com/photo-1544724480-22c66839c994?w=500"}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-100"
                  />
                  <div className="absolute top-2 right-2 bg-slate-950/80 px-2 py-0.5 rounded text-xs text-amber-400 font-semibold border border-white/5 flex items-center space-x-1">
                    <Star className="h-3 w-3 fill-amber-400" />
                    <span>4.5</span>
                  </div>
                </div>

                <CardHeader className="space-y-1.5 p-5">
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

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-4 pt-6 border-t border-white/5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="border-white/10 text-slate-300 hover:bg-white/5 disabled:opacity-40"
              >
                <ArrowLeft className="mr-1 h-4 w-4" /> Prev
              </Button>
              <span className="text-sm text-slate-400">
                Page <span className="font-semibold text-white">{page}</span> of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="border-white/10 text-slate-300 hover:bg-white/5 disabled:opacity-40"
              >
                Next <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
