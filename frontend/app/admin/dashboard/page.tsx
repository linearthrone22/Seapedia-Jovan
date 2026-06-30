"use client";

import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Clock, Tag, Users, ShoppingBag, DollarSign, Store, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";

interface RecentOrder {
  id: string;
  store: { name: string };
  buyer: { username: string };
  totalAmount: number;
  status: string;
  createdAt: string;
}

interface AdminStats {
  userCount: number;
  storeCount: number;
  productCount: number;
  orderCount: number;
  platformRevenue: number;
  recentOrders: RecentOrder[];
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/dashboard/stats");
      setStats(res.data);
    } catch (err: any) {
      toast.error("Failed to load platform stats.");
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
    <ProtectedRoute allowedRole="ADMIN">
      <DashboardLayout role="ADMIN">
        <div className="space-y-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-extrabold text-white">System Admin Control</h1>
              <p className="text-slate-400">Welcome to the central platform operations panel. Monitor and configure systems.</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchStats}
              className="border-white/10 text-slate-300 hover:bg-white/5"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {loading && !stats ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-t-2 border-teal-400 rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                <Card className="bg-slate-900/40 border-white/5 p-4 flex flex-col justify-between">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Users</div>
                  <div className="text-2xl font-black text-white mt-2 flex items-center gap-1.5">
                    <Users className="h-5 w-5 text-teal-400" />
                    <span>{stats?.userCount}</span>
                  </div>
                </Card>

                <Card className="bg-slate-900/40 border-white/5 p-4 flex flex-col justify-between">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Stores</div>
                  <div className="text-2xl font-black text-white mt-2 flex items-center gap-1.5">
                    <Store className="h-5 w-5 text-blue-400" />
                    <span>{stats?.storeCount}</span>
                  </div>
                </Card>

                <Card className="bg-slate-900/40 border-white/5 p-4 flex flex-col justify-between">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Products</div>
                  <div className="text-2xl font-black text-white mt-2 flex items-center gap-1.5">
                    <ShoppingBag className="h-5 w-5 text-indigo-400" />
                    <span>{stats?.productCount}</span>
                  </div>
                </Card>

                <Card className="bg-slate-900/40 border-white/5 p-4 flex flex-col justify-between">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Orders</div>
                  <div className="text-2xl font-black text-white mt-2 flex items-center gap-1.5">
                    <ShoppingBag className="h-5 w-5 text-purple-400" />
                    <span>{stats?.orderCount}</span>
                  </div>
                </Card>

                <Card className="bg-slate-900/40 border-white/5 p-4 flex flex-col justify-between">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Platform Revenue</div>
                  <div className="text-2xl font-black text-teal-400 mt-2 flex items-center gap-1.5">
                    <DollarSign className="h-5 w-5" />
                    <span className="truncate">{formatPrice(stats?.platformRevenue || 0)}</span>
                  </div>
                </Card>
              </div>

              {/* Simulation & Vouchers links */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-slate-900/40 border-white/5 p-6 space-y-4 hover:border-teal-500/20 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-400">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">Time Simulation</h3>
                    <p className="text-xs text-slate-500 mt-1">Advance system clock by days to test SLAs and auto-refunds.</p>
                  </div>
                  <Button onClick={() => router.push("/admin/time-simulation")} size="sm" className="w-full bg-slate-950 hover:bg-slate-800 border border-white/5 text-slate-300">
                    Open Simulation
                  </Button>
                </Card>

                <Card className="bg-slate-900/40 border-white/5 p-6 space-y-4 hover:border-teal-500/20 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                    <Tag className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">Vouchers & Promos</h3>
                    <p className="text-xs text-slate-500 mt-1">Create and configure platform-wide code discounts.</p>
                  </div>
                  <Button onClick={() => router.push("/admin/vouchers")} size="sm" className="w-full bg-slate-950 hover:bg-slate-800 border border-white/5 text-slate-300">
                    Manage Vouchers
                  </Button>
                </Card>
              </div>

              {/* Recent Orders List */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white">Recent Purchases</h3>
                <Card className="bg-slate-900/40 border-white/5 overflow-hidden">
                  <CardContent className="p-0 overflow-x-auto">
                    {stats?.recentOrders.length === 0 ? (
                      <div className="p-8 text-center text-slate-500 text-sm">No orders recorded in system.</div>
                    ) : (
                      <table className="w-full text-left border-collapse text-sm">
                        <thead>
                          <tr className="border-b border-white/5 bg-slate-950/40 text-slate-400 font-bold">
                            <th className="p-4">Order ID</th>
                            <th className="p-4">Merchant Store</th>
                            <th className="p-4">Buyer Customer</th>
                            <th className="p-4">Total Amount</th>
                            <th className="p-4 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {stats?.recentOrders.map((o) => (
                            <tr key={o.id} className="hover:bg-white/5 transition-colors">
                              <td className="p-4 font-mono text-slate-200">#{o.id.slice(-8).toUpperCase()}</td>
                              <td className="p-4 text-white font-semibold">{o.store.name}</td>
                              <td className="p-4 text-slate-300">{o.buyer.username}</td>
                              <td className="p-4 font-bold text-teal-400">{formatPrice(o.totalAmount)}</td>
                              <td className="p-4 text-right">
                                <Badge className="bg-white/5 text-slate-300 border border-white/10 uppercase text-[9px] font-extrabold tracking-wider px-2 py-0.5">
                                  {o.status.replace("_", " ")}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
