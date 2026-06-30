"use client";

import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Wallet, MapPin, ClipboardList, ShoppingCart, TrendingUp, CheckCircle, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import api from "@/lib/api";

interface ReportData {
  totalSpent: number;
  orderCount: number;
  statusBreakdown: Record<string, number>;
}

export default function BuyerDashboard() {
  const router = useRouter();
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await api.get("/buyer/reports");
      setReport(res.data);
    } catch (err: any) {
      toast.error("Failed to load buyer analytics reports.");
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
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-extrabold text-white">Buyer Hub</h1>
              <p className="text-slate-400">Welcome to your purchase workspace. Access your checkout tools below.</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchReport}
              className="border-white/10 text-slate-300 hover:bg-white/5"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {/* Report Analytics Cards */}
          {loading && !report ? (
            <div className="flex justify-center py-10">
              <div className="w-8 h-8 border-t-2 border-teal-400 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Total Spent */}
              <Card className="bg-slate-900/40 border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 rounded-full blur-2xl pointer-events-none" />
                <CardHeader className="pb-2">
                  <CardDescription className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Total Funds Spent</CardDescription>
                  <CardTitle className="text-2xl font-black text-white flex items-center gap-2 mt-1">
                    <TrendingUp className="h-6 w-6 text-teal-400" />
                    <span>{formatPrice(report?.totalSpent || 0)}</span>
                  </CardTitle>
                </CardHeader>
              </Card>

              {/* Total Orders */}
              <Card className="bg-slate-900/40 border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
                <CardHeader className="pb-2">
                  <CardDescription className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Total Orders Placed</CardDescription>
                  <CardTitle className="text-2xl font-black text-white flex items-center gap-2 mt-1">
                    <ClipboardList className="h-6 w-6 text-blue-400" />
                    <span>{report?.orderCount || 0} orders</span>
                  </CardTitle>
                </CardHeader>
              </Card>

              {/* Status breakdown preview */}
              <Card className="bg-slate-900/40 border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
                <CardHeader className="pb-2">
                  <CardDescription className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Active Orders Packaged</CardDescription>
                  <CardTitle className="text-2xl font-black text-white flex items-center gap-2 mt-1">
                    <CheckCircle className="h-6 w-6 text-indigo-400" />
                    <span>{report?.statusBreakdown?.SEDANG_DIKEMAS || 0} units</span>
                  </CardTitle>
                </CardHeader>
              </Card>
            </div>
          )}

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-slate-900/40 border-white/5 p-6 space-y-4 hover:border-teal-500/20 transition-colors flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-400">
                  <ShoppingCart className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white">My Cart</h3>
                  <p className="text-xs text-slate-500 mt-1">Review items queued for single-store checkout.</p>
                </div>
              </div>
              <Button onClick={() => router.push("/buyer/cart")} size="sm" className="w-full bg-slate-950 hover:bg-slate-800 border border-white/5 text-slate-300 mt-4">
                Open Cart
              </Button>
            </Card>

            <Card className="bg-slate-900/40 border-white/5 p-6 space-y-4 hover:border-teal-500/20 transition-colors flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                  <Wallet className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white">Wallet</h3>
                  <p className="text-xs text-slate-500 mt-1">Top up your balance for instant secure payments.</p>
                </div>
              </div>
              <Button onClick={() => router.push("/buyer/wallet")} size="sm" className="w-full bg-slate-950 hover:bg-slate-800 border border-white/5 text-slate-300 mt-4">
                View Wallet
              </Button>
            </Card>

            <Card className="bg-slate-900/40 border-white/5 p-6 space-y-4 hover:border-teal-500/20 transition-colors flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white">Addresses</h3>
                  <p className="text-xs text-slate-500 mt-1">Manage delivery locations and recipient info.</p>
                </div>
              </div>
              <Button onClick={() => router.push("/buyer/addresses")} size="sm" className="w-full bg-slate-950 hover:bg-slate-800 border border-white/5 text-slate-300 mt-4">
                Edit Addresses
              </Button>
            </Card>

            <Card className="bg-slate-900/40 border-white/5 p-6 space-y-4 hover:border-teal-500/20 transition-colors flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
                  <ShoppingBag className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white">My Orders</h3>
                  <p className="text-xs text-slate-500 mt-1">Track transit updates and historical purchases.</p>
                </div>
              </div>
              <Button onClick={() => router.push("/buyer/orders")} size="sm" className="w-full bg-slate-950 hover:bg-slate-800 border border-white/5 text-slate-300 mt-4">
                View Orders
              </Button>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
