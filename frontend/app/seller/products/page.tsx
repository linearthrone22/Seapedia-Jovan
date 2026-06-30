"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Edit, Trash, Package, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrl: string;
}

export default function SellerProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get("/seller/products");
      setProducts(res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to load products.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      await api.delete(`/seller/products/${id}`);
      toast.success(`Deleted "${name}" successfully.`);
      setProducts(products.filter((p) => p.id !== id));
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to delete product.");
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
    <ProtectedRoute allowedRole="SELLER">
      <DashboardLayout role="SELLER">
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-white">Product Catalog</h1>
              <p className="text-slate-400">View and manage your active storefront merchandise listings.</p>
            </div>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchProducts}
                className="border-white/10 text-slate-300 hover:bg-white/5 hover:text-white"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => router.push("/seller/products/new")}
                className="bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold"
              >
                <Plus className="mr-2 h-4 w-4" /> Add Product
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-t-2 border-teal-400 rounded-full animate-spin" />
            </div>
          ) : products.length === 0 ? (
            <Card className="bg-slate-900/40 border-white/5 border-dashed p-16 text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-slate-950/60 flex items-center justify-center text-slate-500 mx-auto border border-white/5">
                <Package className="h-8 w-8" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-white">No Products Found</h2>
                <p className="text-slate-400 text-sm max-w-md mx-auto">
                  You haven&apos;t added any products to your store catalog yet. Click the button below to get started.
                </p>
              </div>
              <Button
                onClick={() => router.push("/seller/products/new")}
                className="bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold"
              >
                <Plus className="mr-2 h-4 w-4" /> Create Product Listing
              </Button>
            </Card>
          ) : (
            <Card className="bg-slate-900/40 border-white/5 overflow-hidden">
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-white/5 bg-slate-950/40 text-slate-400 font-bold">
                      <th className="p-4">Image</th>
                      <th className="p-4">Name</th>
                      <th className="p-4">Price</th>
                      <th className="p-4">Stock</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {products.map((product) => (
                      <tr key={product.id} className="hover:bg-white/5 transition-colors">
                        <td className="p-4">
                          <div className="w-12 h-12 rounded overflow-hidden bg-slate-950 border border-white/5">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={product.imageUrl || "https://images.unsplash.com/photo-1544724480-22c66839c994?w=100"}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="font-semibold text-white">{product.name}</div>
                          <div className="text-slate-500 text-xs line-clamp-1 max-w-sm mt-0.5">
                            {product.description}
                          </div>
                        </td>
                        <td className="p-4 font-semibold text-teal-300">
                          {formatPrice(product.price)}
                        </td>
                        <td className="p-4 font-semibold text-slate-200">
                          {product.stock} units
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/seller/products/${product.id}/edit`)}
                              className="border-white/10 text-slate-300 hover:bg-white/5 hover:text-white"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(product.id, product.name)}
                              className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
