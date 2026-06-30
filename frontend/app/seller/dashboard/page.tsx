"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Store, Package, ShoppingBag, TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SellerDashboard() {
  const router = useRouter();

  return (
    <ProtectedRoute allowedRole="SELLER">
      <DashboardLayout role="SELLER">
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-extrabold text-white">Seller Merchant Hub</h1>
            <p className="text-slate-400">Welcome to your merchant workspace. Create a store and publish products.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-slate-900/40 border-white/5 p-6 space-y-4 hover:border-teal-500/20 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-400">
                <Store className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-white">My Store</h3>
                <p className="text-xs text-slate-500 mt-1">Configure your storefront details and metadata.</p>
              </div>
              <Button onClick={() => router.push("/seller/store")} size="sm" className="w-full bg-slate-950 hover:bg-slate-800 border border-white/5 text-slate-300">
                Manage Store
              </Button>
            </Card>

            <Card className="bg-slate-900/40 border-white/5 p-6 space-y-4 hover:border-teal-500/20 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-white">Catalog</h3>
                <p className="text-xs text-slate-500 mt-1">List goods, manage inventory stocks, edit prices.</p>
              </div>
              <Button onClick={() => router.push("/seller/products")} size="sm" className="w-full bg-slate-950 hover:bg-slate-800 border border-white/5 text-slate-300">
                View Products
              </Button>
            </Card>

            <Card className="bg-slate-900/40 border-white/5 p-6 space-y-4 hover:border-teal-500/20 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-white">Store Orders</h3>
                <p className="text-xs text-slate-500 mt-1">Process incoming orders and coordinate shipments.</p>
              </div>
              <Button onClick={() => router.push("/seller/orders")} size="sm" className="w-full bg-slate-950 hover:bg-slate-800 border border-white/5 text-slate-300">
                Check Orders
              </Button>
            </Card>

            <Card className="bg-slate-900/40 border-white/5 p-6 space-y-4 hover:border-teal-500/20 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-white">Earnings</h3>
                <p className="text-xs text-slate-500 mt-1">Analyze revenue statistics and payouts history.</p>
              </div>
              <Button onClick={() => router.push("/seller/reports")} size="sm" className="w-full bg-slate-950 hover:bg-slate-800 border border-white/5 text-slate-300">
                Revenue Reports
              </Button>
            </Card>
          </div>

          <Card className="bg-slate-950 border-white/5 p-6">
            <h3 className="font-semibold text-white">System Status: Level 1 Enabled</h3>
            <p className="text-sm text-slate-400 mt-2">
              Seller tools are loaded. Please proceed to Level 2 (Seller Experience) to activate database integrations for store setup, product CRUD, and sales logging.
            </p>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
