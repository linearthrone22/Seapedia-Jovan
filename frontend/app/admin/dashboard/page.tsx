"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Clock, Tag, Users } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
  const router = useRouter();

  return (
    <ProtectedRoute allowedRole="ADMIN">
      <DashboardLayout role="ADMIN">
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-extrabold text-white">System Admin Control</h1>
            <p className="text-slate-400">Welcome to the central platform operations panel. Monitor and configure systems.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

            <Card className="bg-slate-900/40 border-white/5 p-6 space-y-4 hover:border-teal-500/20 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-white">User Registry</h3>
                <p className="text-xs text-slate-500 mt-1">Manage user profiles, credential audits, and roles.</p>
              </div>
              <Button onClick={() => router.push("/admin/users")} size="sm" className="w-full bg-slate-950 hover:bg-slate-800 border border-white/5 text-slate-300">
                View Users
              </Button>
            </Card>

            <Card className="bg-slate-900/40 border-white/5 p-6 space-y-4 hover:border-teal-500/20 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-white">Store Audits</h3>
                <p className="text-xs text-slate-500 mt-1">Review active storefront partners and registries.</p>
              </div>
              <Button onClick={() => router.push("/admin/stores")} size="sm" className="w-full bg-slate-950 hover:bg-slate-800 border border-white/5 text-slate-300">
                View Stores
              </Button>
            </Card>
          </div>

          <Card className="bg-slate-950 border-white/5 p-6">
            <h3 className="font-semibold text-white">System Status: Level 1 Enabled</h3>
            <p className="text-sm text-slate-400 mt-2">
              Admin tools are loaded. Please proceed to Level 4 (Discounts & Seller Order Processing) and Level 6 (Admin Monitoring & Overdue Handling) to connect database integrations for voucher CRUD operations, active stats, and time-simulation triggers.
            </p>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
