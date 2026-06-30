"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, Eye, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

interface Order {
  id: string;
  store: { name: string };
  totalAmount: number;
  status: "SEDANG_DIKEMAS" | "MENUNGGU_PENGIRIM" | "SEDANG_DIKIRIM" | "PESANAN_SELESAI" | "DIKEMBALIKAN";
  createdAt: string;
}

export const STATUS_BADGES: Record<string, { label: string; style: string }> = {
  SEDANG_DIKEMAS: { label: "Packaging", style: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  MENUNGGU_PENGIRIM: { label: "Waiting Pickup", style: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  SEDANG_DIKIRIM: { label: "In Transit", style: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" },
  PESANAN_SELESAI: { label: "Completed", style: "bg-teal-500/10 text-teal-400 border-teal-500/20" },
  DIKEMBALIKAN: { label: "Returned/Refunded", style: "bg-red-500/10 text-red-400 border-red-500/20" },
};

export default function BuyerOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get("/buyer/orders");
      setOrders(res.data);
    } catch (err: any) {
      toast.error("Failed to load order history.");
    } finally {
      setLoading(false);
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
              <h1 className="text-3xl font-extrabold text-white">Order History</h1>
              <p className="text-slate-400">Track current status and historical orders.</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchOrders}
              className="border-white/10 text-slate-300 hover:bg-white/5"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-t-2 border-teal-400 rounded-full animate-spin" />
            </div>
          ) : orders.length === 0 ? (
            <Card className="bg-slate-900/40 border-white/5 border-dashed p-16 text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-slate-950/60 flex items-center justify-center text-slate-500 mx-auto border border-white/5">
                <ShoppingBag className="h-8 w-8" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-white">No Orders Placed</h2>
                <p className="text-slate-400 text-sm max-w-md mx-auto">
                  You haven&apos;t placed any orders on SeaPedia yet. Shop our catalog today.
                </p>
              </div>
              <Button onClick={() => router.push("/products")} className="bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold">
                Go Shop Products
              </Button>
            </Card>
          ) : (
            <Card className="bg-slate-900/40 border-white/5 overflow-hidden">
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-white/5 bg-slate-950/40 text-slate-400 font-bold">
                      <th className="p-4">Order ID</th>
                      <th className="p-4">Merchant Store</th>
                      <th className="p-4">Date</th>
                      <th className="p-4">Total Price</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {orders.map((order) => {
                      const badge = STATUS_BADGES[order.status] || { label: order.status, style: "" };
                      return (
                        <tr key={order.id} className="hover:bg-white/5 transition-colors">
                          <td className="p-4 font-mono font-semibold text-slate-200">
                            #{order.id.slice(-8).toUpperCase()}
                          </td>
                          <td className="p-4 font-semibold text-white">{order.store.name}</td>
                          <td className="p-4 text-slate-400">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </td>
                          <td className="p-4 font-bold text-teal-300">
                            {formatPrice(order.totalAmount)}
                          </td>
                          <td className="p-4">
                            <Badge className={`${badge.style} border font-bold text-[10px] uppercase tracking-wider px-2 py-0.5`}>
                              {badge.label}
                            </Badge>
                          </td>
                          <td className="p-4 text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/buyer/orders/${order.id}`)}
                              className="border-white/10 text-slate-300 hover:bg-white/5"
                            >
                              <Eye className="mr-1.5 h-4 w-4" /> Track Details
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
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
