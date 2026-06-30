"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, Eye, RefreshCw } from "lucide-react";
import { STATUS_BADGES } from "../../buyer/orders/page";
import { toast } from "sonner";
import api from "@/lib/api";

interface Order {
  id: string;
  buyer: { username: string };
  totalAmount: number;
  status: string;
  createdAt: string;
  items: Array<{ productName: string; quantity: number }>;
}

export default function SellerOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSellerOrders();
  }, []);

  const fetchSellerOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get("/seller/orders");
      setOrders(res.data);
    } catch (err: any) {
      toast.error("Failed to load incoming store orders.");
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
    <ProtectedRoute allowedRole="SELLER">
      <DashboardLayout role="SELLER">
        <div className="space-y-8">
          <div className="flex justify-between items-center border-b border-white/5 pb-6">
            <div>
              <h1 className="text-3xl font-extrabold text-white">Incoming Store Orders</h1>
              <p className="text-slate-400">Process and package purchase requests from buyers.</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchSellerOrders}
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
            <Card className="bg-slate-900/40 border-white/5 border-dashed p-16 text-center space-y-4">
              <ShoppingBag className="h-8 w-8 text-slate-500 mx-auto" />
              <h2 className="text-xl font-bold text-white">No Orders Received</h2>
              <p className="text-slate-400 text-sm">Products listed in catalog will appear here when purchased by buyers.</p>
            </Card>
          ) : (
            <Card className="bg-slate-900/40 border-white/5 overflow-hidden">
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-white/5 bg-slate-950/40 text-slate-400 font-bold">
                      <th className="p-4">Order ID</th>
                      <th className="p-4">Buyer Customer</th>
                      <th className="p-4">Items Count</th>
                      <th className="p-4">Date</th>
                      <th className="p-4">Total Income</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {orders.map((order) => {
                      const badge = STATUS_BADGES[order.status] || { label: order.status, style: "" };
                      const itemsCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
                      return (
                        <tr key={order.id} className="hover:bg-white/5 transition-colors">
                          <td className="p-4 font-mono font-semibold text-slate-200">
                            #{order.id.slice(-8).toUpperCase()}
                          </td>
                          <td className="p-4 font-semibold text-white">{order.buyer.username}</td>
                          <td className="p-4 text-slate-300 font-semibold">{itemsCount} units</td>
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
                              onClick={() => router.push(`/seller/orders/${order.id}`)}
                              className="border-white/10 text-slate-300 hover:bg-white/5"
                            >
                              <Eye className="mr-1.5 h-4 w-4" /> Manage Order
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
