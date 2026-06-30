"use client";

import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tag, Plus, RefreshCw, Layers, Sparkles, Check, CheckSquare } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

interface Voucher {
  id: string;
  code: string;
  description: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  minOrderAmount: number;
  maxUsage: number;
  usedCount: number;
  expiresAt: string;
}

interface Promo {
  id: string;
  code: string;
  description: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  minOrderAmount: number;
  expiresAt: string;
}

export default function AdminVouchersPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [promos, setPromos] = useState<Promo[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"vouchers" | "promos">("vouchers");
  const [showAddForm, setShowAddForm] = useState(false);

  // Form Fields (Common)
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [discountType, setDiscountType] = useState<"PERCENTAGE" | "FIXED">("PERCENTAGE");
  const [discountValue, setDiscountValue] = useState("");
  const [minOrderAmount, setMinOrderAmount] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  // Form Fields (Voucher specific)
  const [maxUsage, setMaxUsage] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const vRes = await api.get("/admin/vouchers");
      setVouchers(vRes.data);

      const pRes = await api.get("/admin/promos");
      setPromos(pRes.data);
    } catch (err: any) {
      toast.error("Failed to load discount lists.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDiscount = async (e: React.FormEvent) => {
    e.preventDefault();

    const dVal = parseFloat(discountValue);
    const minOrder = parseFloat(minOrderAmount || "0");
    if (isNaN(dVal) || dVal <= 0) {
      toast.error("Discount value must be positive.");
      return;
    }

    if (!code || !description || !expiresAt) {
      toast.error("Please fill in all mandatory parameters.");
      return;
    }

    setSubmitLoading(true);
    try {
      const expiresDate = new Date(expiresAt).toISOString();

      if (activeTab === "vouchers") {
        const usageLimit = parseInt(maxUsage);
        if (isNaN(usageLimit) || usageLimit <= 0) {
          toast.error("Max usage limit must be a positive integer.");
          setSubmitLoading(false);
          return;
        }

        await api.post("/admin/vouchers", {
          code,
          description,
          discountType,
          discountValue: dVal,
          minOrderAmount: minOrder,
          maxUsage: usageLimit,
          expiresAt: expiresDate,
        });
        toast.success("Voucher created successfully!");
      } else {
        await api.post("/admin/promos", {
          code,
          description,
          discountType,
          discountValue: dVal,
          minOrderAmount: minOrder,
          expiresAt: expiresDate,
        });
        toast.success("Promo created successfully!");
      }

      // Reset form
      setCode("");
      setDescription("");
      setDiscountValue("");
      setMinOrderAmount("");
      setExpiresAt("");
      setMaxUsage("");
      setShowAddForm(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to create discount configuration.");
    } finally {
      setSubmitLoading(false);
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
    <ProtectedRoute allowedRole="ADMIN">
      <DashboardLayout role="ADMIN">
        <div className="space-y-8">
          <div className="flex justify-between items-center border-b border-white/5 pb-6">
            <div>
              <h1 className="text-3xl font-extrabold text-white">Discounts Management</h1>
              <p className="text-slate-400">Configure vouchers and stacking promos for buyer checkout discounts.</p>
            </div>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchData}
                className="border-white/10 text-slate-300 hover:bg-white/5"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => setShowAddForm(!showAddForm)}
                className="bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold"
              >
                {showAddForm ? "View Configs" : <><Plus className="mr-1.5 h-4 w-4" /> Create Discount</>}
              </Button>
            </div>
          </div>

          {showAddForm ? (
            // Create discount Form
            <div className="max-w-xl">
              <Card className="bg-slate-900/40 border-white/5">
                <CardHeader>
                  <CardTitle className="text-white capitalize">
                    New Platform {activeTab.slice(0, -1)}
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Define discount codes, rates, and minimum order values.
                  </CardDescription>
                </CardHeader>
                <form onSubmit={handleCreateDiscount}>
                  <CardContent className="space-y-4">
                    {/* Code */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300">Discount Code (Uppercase)</label>
                      <Input
                        placeholder="e.g. SAVE100K"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        className="bg-slate-950 border-white/10 text-white uppercase focus:border-teal-500 font-bold"
                        required
                      />
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300">Description</label>
                      <Input
                        placeholder="e.g. Diskon 10% minimal order Rp 50.000"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="bg-slate-950 border-white/10 text-white focus:border-teal-500"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Discount Type */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300">Rate Type</label>
                        <select
                          value={discountType}
                          onChange={(e) => setDiscountType(e.target.value as any)}
                          className="w-full bg-slate-950 border border-white/10 text-white text-sm rounded-lg p-2.5 focus:border-teal-500 focus:outline-none"
                        >
                          <option value="PERCENTAGE">Percentage (%)</option>
                          <option value="FIXED">Fixed Amount (IDR)</option>
                        </select>
                      </div>

                      {/* Discount Value */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300">Discount Value</label>
                        <Input
                          type="number"
                          placeholder={discountType === "PERCENTAGE" ? "e.g. 10" : "e.g. 50000"}
                          value={discountValue}
                          onChange={(e) => setDiscountValue(e.target.value)}
                          className="bg-slate-950 border-white/10 text-white focus:border-teal-500"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Min Order Amount */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300">Min Order Amount (IDR)</label>
                        <Input
                          type="number"
                          placeholder="e.g. 50000"
                          value={minOrderAmount}
                          onChange={(e) => setMinOrderAmount(e.target.value)}
                          className="bg-slate-950 border-white/10 text-white focus:border-teal-500"
                        />
                      </div>

                      {/* Expiry Date */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300">Expiration Date</label>
                        <Input
                          type="datetime-local"
                          value={expiresAt}
                          onChange={(e) => setExpiresAt(e.target.value)}
                          className="bg-slate-950 border-white/10 text-white focus:border-teal-500"
                          required
                        />
                      </div>
                    </div>

                    {/* Max Usage (Voucher only) */}
                    {activeTab === "vouchers" && (
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300">Usage Limit (Max Count)</label>
                        <Input
                          type="number"
                          placeholder="e.g. 100"
                          value={maxUsage}
                          onChange={(e) => setMaxUsage(e.target.value)}
                          className="bg-slate-950 border-white/10 text-white focus:border-teal-500"
                          required
                        />
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="flex justify-end gap-3 border-t border-white/5 p-6 bg-slate-950/20">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setShowAddForm(false)}
                      className="text-slate-400 hover:text-white"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={submitLoading}
                      className="bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold"
                    >
                      {submitLoading ? "Creating..." : `Create ${activeTab === "vouchers" ? "Voucher" : "Promo"}`}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </div>
          ) : (
            // Tabs
            <div className="space-y-6">
              <div className="flex space-x-2 border-b border-white/5 pb-1">
                <button
                  onClick={() => setActiveTab("vouchers")}
                  className={`px-4 py-2 text-sm font-semibold flex items-center gap-1.5 transition-colors border-b-2 ${
                    activeTab === "vouchers"
                      ? "border-teal-500 text-teal-400"
                      : "border-transparent text-slate-400 hover:text-white"
                  }`}
                >
                  <Layers className="h-4 w-4" /> Vouchers
                </button>
                <button
                  onClick={() => setActiveTab("promos")}
                  className={`px-4 py-2 text-sm font-semibold flex items-center gap-1.5 transition-colors border-b-2 ${
                    activeTab === "promos"
                      ? "border-teal-500 text-teal-400"
                      : "border-transparent text-slate-400 hover:text-white"
                  }`}
                >
                  <Sparkles className="h-4 w-4" /> Promos
                </button>
              </div>

              {loading ? (
                <div className="flex justify-center py-20">
                  <div className="w-8 h-8 border-t-2 border-teal-400 rounded-full animate-spin" />
                </div>
              ) : activeTab === "vouchers" ? (
                // Vouchers table
                <Card className="bg-slate-900/40 border-white/5 overflow-hidden">
                  <CardContent className="p-0 overflow-x-auto">
                    {vouchers.length === 0 ? (
                      <div className="p-8 text-center text-slate-500">No vouchers registered.</div>
                    ) : (
                      <table className="w-full text-left border-collapse text-sm">
                        <thead>
                          <tr className="border-b border-white/5 bg-slate-950/40 text-slate-400 font-bold">
                            <th className="p-4">Code</th>
                            <th className="p-4">Description</th>
                            <th className="p-4">Discount Rate</th>
                            <th className="p-4">Min Spend</th>
                            <th className="p-4">Usage Count</th>
                            <th className="p-4">Expires At</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {vouchers.map((v) => (
                            <tr key={v.id} className="hover:bg-white/5 transition-colors">
                              <td className="p-4 font-mono font-bold text-teal-400">{v.code}</td>
                              <td className="p-4 text-slate-300">{v.description}</td>
                              <td className="p-4 text-white font-semibold">
                                {v.discountType === "PERCENTAGE" ? `${v.discountValue}%` : formatPrice(v.discountValue)}
                              </td>
                              <td className="p-4 text-slate-400">{formatPrice(v.minOrderAmount)}</td>
                              <td className="p-4 font-mono text-slate-200">
                                {v.usedCount} / {v.maxUsage}
                              </td>
                              <td className="p-4 text-xs text-slate-500">
                                {new Date(v.expiresAt).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </CardContent>
                </Card>
              ) : (
                // Promos table
                <Card className="bg-slate-900/40 border-white/5 overflow-hidden">
                  <CardContent className="p-0 overflow-x-auto">
                    {promos.length === 0 ? (
                      <div className="p-8 text-center text-slate-500">No promo campaigns registered.</div>
                    ) : (
                      <table className="w-full text-left border-collapse text-sm">
                        <thead>
                          <tr className="border-b border-white/5 bg-slate-950/40 text-slate-400 font-bold">
                            <th className="p-4">Promo Code</th>
                            <th className="p-4">Description</th>
                            <th className="p-4">Discount Rate</th>
                            <th className="p-4">Min Spend</th>
                            <th className="p-4">Expires At</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {promos.map((p) => (
                            <tr key={p.id} className="hover:bg-white/5 transition-colors">
                              <td className="p-4 font-mono font-bold text-teal-400">{p.code}</td>
                              <td className="p-4 text-slate-300">{p.description}</td>
                              <td className="p-4 text-white font-semibold">
                                {p.discountType === "PERCENTAGE" ? `${p.discountValue}%` : formatPrice(p.discountValue)}
                              </td>
                              <td className="p-4 text-slate-400">{formatPrice(p.minOrderAmount)}</td>
                              <td className="p-4 text-xs text-slate-500">
                                {new Date(p.expiresAt).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
