"use client";

import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Store, Edit, Plus, Info } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

interface StoreData {
  id: string;
  name: string;
  description: string;
}

export default function SellerStorePage() {
  const [store, setStore] = useState<StoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    fetchStore();
  }, []);

  const fetchStore = async () => {
    setLoading(true);
    try {
      const res = await api.get("/seller/store");
      setStore(res.data);
      setName(res.data.name);
      setDescription(res.data.description || "");
    } catch (err: any) {
      if (err.response?.status === 404) {
        setStore(null);
      } else {
        toast.error("Failed to load storefront details.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Store name is required.");
      return;
    }

    setSubmitLoading(true);
    try {
      if (store) {
        // Edit existing
        const res = await api.put("/seller/store", { name, description });
        setStore(res.data);
        toast.success("Storefront updated successfully!");
        setIsEditing(false);
      } else {
        // Create new
        const res = await api.post("/seller/store", { name, description });
        setStore(res.data);
        toast.success("Storefront created successfully!");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to save storefront.");
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <ProtectedRoute allowedRole="SELLER">
      <DashboardLayout role="SELLER">
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-extrabold text-white">Store Settings</h1>
            <p className="text-slate-400">Establish and modify your platform-wide storefront identity.</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-t-2 border-teal-400 rounded-full animate-spin" />
            </div>
          ) : store ? (
            // Active store view / edit mode
            <div className="max-w-2xl">
              {isEditing ? (
                <form onSubmit={handleSubmit}>
                  <Card className="bg-slate-900/40 border-white/5">
                    <CardHeader>
                      <CardTitle className="text-white">Edit Storefront Profile</CardTitle>
                      <CardDescription className="text-slate-400">
                        Update your merchant branding and description.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300">Store Name</label>
                        <Input
                          placeholder="e.g. Samudra Marine Spec"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="bg-slate-950 border-white/10 text-white focus:border-teal-500"
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300">Description</label>
                        <textarea
                          placeholder="Tell customers about your products..."
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          rows={4}
                          className="w-full bg-slate-950 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-teal-500 transition-colors placeholder:text-slate-600 resize-none"
                        />
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-end gap-3 border-t border-white/5 p-6 bg-slate-950/20">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setIsEditing(false)}
                        className="text-slate-400 hover:text-white"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={submitLoading}
                        className="bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold"
                      >
                        {submitLoading ? "Saving..." : "Save Changes"}
                      </Button>
                    </CardFooter>
                  </Card>
                </form>
              ) : (
                <Card className="bg-slate-900/40 border-white/5 p-6 space-y-6">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-400 border border-teal-500/20">
                        <Store className="h-6 w-6" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-white">{store.name}</h2>
                        <span className="text-xs text-teal-300 bg-teal-500/15 border border-teal-500/20 px-2 py-0.5 rounded font-semibold mt-1 inline-block">
                          Active Storefront
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                      className="border-white/10 text-slate-300 hover:bg-white/5 hover:text-white"
                    >
                      <Edit className="mr-1.5 h-4 w-4" /> Edit Profile
                    </Button>
                  </div>

                  <div className="space-y-2 border-t border-white/5 pt-6">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Store Description
                    </h4>
                    <p className="text-slate-300 text-sm leading-relaxed">
                      {store.description || "No description provided."}
                    </p>
                  </div>

                  <div className="border-t border-white/5 pt-6 flex items-center gap-3 text-xs text-slate-500">
                    <Info className="h-4 w-4 text-teal-400" />
                    <span>Customers can view this storefront by navigating to `/stores/{store.id}`</span>
                  </div>
                </Card>
              )}
            </div>
          ) : (
            // No store exists, create view
            <div className="max-w-2xl">
              <Card className="bg-slate-900/40 border-white/5 border-dashed p-8 text-center space-y-6">
                <div className="w-16 h-16 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-400 mx-auto border border-teal-500/20">
                  <Store className="h-8 w-8" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-white">Setup Your Storefront</h2>
                  <p className="text-slate-400 text-sm max-w-md mx-auto">
                    You do not have an active storefront. Create one today to begin publishing products and receiving payouts.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="text-left max-w-md mx-auto space-y-4 pt-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Store Name</label>
                    <Input
                      placeholder="e.g. Toko Elektronik Jaya"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="bg-slate-950 border-white/10 text-white focus:border-teal-500"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Description</label>
                    <textarea
                      placeholder="Penyedia barang elektronik kelautan..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      className="w-full bg-slate-950 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-teal-500 transition-colors placeholder:text-slate-600 resize-none"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={submitLoading}
                    className="w-full bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold"
                  >
                    {submitLoading ? "Creating..." : <><Plus className="mr-2 h-4 w-4" /> Create Storefront</>}
                  </Button>
                </form>
              </Card>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
