"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Plus } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

export default function NewProductPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Product name is required.");
      return;
    }

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      toast.error("Price must be a positive number.");
      return;
    }

    const stockNum = parseInt(stock);
    if (isNaN(stockNum) || stockNum < 0) {
      toast.error("Stock must be a non-negative integer.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/seller/products", {
        name,
        description,
        price: priceNum,
        stock: stockNum,
        imageUrl: imageUrl.trim() || undefined,
      });

      toast.success("Product listed successfully!");
      router.push("/seller/products");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to list product.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute allowedRole="SELLER">
      <DashboardLayout role="SELLER">
        <div className="space-y-6 max-w-xl">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="text-slate-400 hover:text-white hover:bg-white/5"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to catalog
          </Button>

          <Card className="bg-slate-900/40 border-white/5">
            <CardHeader>
              <CardTitle className="text-white">Add New Product</CardTitle>
              <CardDescription className="text-slate-400">
                Register a new item in your digital store.
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                {/* Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Product Name</label>
                  <Input
                    placeholder="e.g. Premium Marine Anchor"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-slate-950 border-white/10 text-white focus:border-teal-500"
                    required
                  />
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Description</label>
                  <textarea
                    placeholder="Describe your product specs and benefits..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="w-full bg-slate-950 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-teal-500 transition-colors placeholder:text-slate-600 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Price */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Price (IDR)</label>
                    <Input
                      type="number"
                      placeholder="150000"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="bg-slate-950 border-white/10 text-white focus:border-teal-500"
                      required
                    />
                  </div>

                  {/* Stock */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Available Stock</label>
                    <Input
                      type="number"
                      placeholder="10"
                      value={stock}
                      onChange={(e) => setStock(e.target.value)}
                      className="bg-slate-950 border-white/10 text-white focus:border-teal-500"
                      required
                    />
                  </div>
                </div>

                {/* Image URL */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Image URL (Optional)</label>
                  <Input
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="bg-slate-950 border-white/10 text-white focus:border-teal-500"
                  />
                </div>
              </CardContent>

              <CardFooter className="flex justify-end gap-3 border-t border-white/5 p-6 bg-slate-950/20">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => router.push("/seller/products")}
                  className="text-slate-400 hover:text-white"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold"
                >
                  {loading ? "Publishing..." : <><Plus className="mr-1.5 h-4 w-4" /> Publish Product</>}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
