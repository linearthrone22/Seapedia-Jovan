"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Truck, History, Wallet } from "lucide-react";
import { useRouter } from "next/navigation";

export default function DriverDashboard() {
  const router = useRouter();

  return (
    <ProtectedRoute allowedRole="DRIVER">
      <DashboardLayout role="DRIVER">
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-extrabold text-white">Driver Workspace</h1>
            <p className="text-slate-400">Welcome to your logistics panel. Accept active jobs and earn delivery payouts.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-slate-900/40 border-white/5 p-6 space-y-4 hover:border-teal-500/20 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-400">
                <Truck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-white">Jobs Board</h3>
                <p className="text-xs text-slate-500 mt-1">Browse and claim pending orders waiting for dispatch.</p>
              </div>
              <Button onClick={() => router.push("/driver/jobs")} size="sm" className="w-full bg-slate-950 hover:bg-slate-800 border border-white/5 text-slate-300">
                Find Jobs
              </Button>
            </Card>

            <Card className="bg-slate-900/40 border-white/5 p-6 space-y-4 hover:border-teal-500/20 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                <History className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-white">Delivery Log</h3>
                <p className="text-xs text-slate-500 mt-1">Review historical delivery details and timestamps.</p>
              </div>
              <Button onClick={() => router.push("/driver/history")} size="sm" className="w-full bg-slate-950 hover:bg-slate-800 border border-white/5 text-slate-300">
                View History
              </Button>
            </Card>

            <Card className="bg-slate-900/40 border-white/5 p-6 space-y-4 hover:border-teal-500/20 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                <Wallet className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-white">My Earnings</h3>
                <p className="text-xs text-slate-500 mt-1">Review your collected 70% delivery commission.</p>
              </div>
              <Button onClick={() => router.push("/driver/earnings")} size="sm" className="w-full bg-slate-950 hover:bg-slate-800 border border-white/5 text-slate-300">
                Check Earnings
              </Button>
            </Card>
          </div>

          <Card className="bg-slate-950 border-white/5 p-6">
            <h3 className="font-semibold text-white">System Status: Level 1 Enabled</h3>
            <p className="text-sm text-slate-400 mt-2">
              Driver tools are loaded. Please proceed to Level 5 (Delivery & Driver Workflow) to activate database integrations for claiming and completing logistics jobs.
            </p>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
