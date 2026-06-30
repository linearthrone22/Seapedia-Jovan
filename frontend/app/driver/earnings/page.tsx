"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";

export default function DriverEarningsPage() {
  return (
    <ProtectedRoute allowedRole="DRIVER">
      <DashboardLayout role="DRIVER">
        <div className="space-y-6">
          <h1 className="text-3xl font-bold text-white">Earnings Stats</h1>
          <Card className="bg-slate-900/40 border-white/5 p-6 text-slate-400">
            Earnings charts and details will be implemented in Level 5.
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
