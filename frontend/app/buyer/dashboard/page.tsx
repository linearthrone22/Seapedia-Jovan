"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Wallet, MapPin, ClipboardList, ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";

export default function BuyerDashboard() {
  const router = useRouter();

  return (
    <ProtectedRoute allowedRole="BUYER">
      <DashboardLayout role="BUYER">
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-extrabold text-white">Buyer Hub</h1>
            <p className="text-slate-400">Welcome to your purchase workspace. Access your checkout tools below.</p>
          </div>

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-slate-900/40 border-white/5 p-6 space-y-4 hover:border-teal-500/20 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-400">
                <ShoppingCart className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-white">My Cart</h3>
                <p className="text-xs text-slate-500 mt-1">Review items queued for single-store checkout.</p>
              </div>
              <Button onClick={() => router.push("/buyer/cart")} size="sm" className="w-full bg-slate-950 hover:bg-slate-800 border border-white/5 text-slate-300">
                Open Cart
              </Button>
            </Card>

            <Card className="bg-slate-900/40 border-white/5 p-6 space-y-4 hover:border-teal-500/20 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                <Wallet className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-white">Wallet</h3>
                <p className="text-xs text-slate-500 mt-1">Top up your balance for instant secure payments.</p>
              </div>
              <Button onClick={() => router.push("/buyer/wallet")} size="sm" className="w-full bg-slate-950 hover:bg-slate-800 border border-white/5 text-slate-300">
                View Wallet
              </Button>
            </Card>

            <Card className="bg-slate-900/40 border-white/5 p-6 space-y-4 hover:border-teal-500/20 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-white">Addresses</h3>
                <p className="text-xs text-slate-500 mt-1">Manage delivery locations and recipient info.</p>
              </div>
              <Button onClick={() => router.push("/buyer/addresses")} size="sm" className="w-full bg-slate-950 hover:bg-slate-800 border border-white/5 text-slate-300">
                Edit Addresses
              </Button>
            </Card>

            <Card className="bg-slate-900/40 border-white/5 p-6 space-y-4 hover:border-teal-500/20 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
                <ClipboardList className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-white">Orders</h3>
                <p className="text-xs text-slate-500 mt-1">Track shipping updates and order status timelines.</p>
              </div>
              <Button onClick={() => router.push("/buyer/orders")} size="sm" className="w-full bg-slate-950 hover:bg-slate-800 border border-white/5 text-slate-300">
                Track Orders
              </Button>
            </Card>
          </div>

          {/* Level 1 status notice */}
          <Card className="bg-slate-950 border-white/5 p-6">
            <h3 className="font-semibold text-white">System Status: Level 1 Enabled</h3>
            <p className="text-sm text-slate-400 mt-2">
              Buyer tools are loaded. Please proceed to Level 2 (Seller Experience) and Level 3 (Buyer Wallet & Checkout) to connect database integrations for wallet top-ups, shipping address modifications, and single-store checkouts.
            </p>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
