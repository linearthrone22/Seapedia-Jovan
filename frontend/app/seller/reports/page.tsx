"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";

export default function SellerReportsPage() {
  return (
    <ProtectedRoute allowedRole="SELLER">
      <DashboardLayout role="SELLER">
        <div className="space-y-6">
          <h1 className="text-3xl font-bold text-white">Sales Reports</h1>
          <Card className="bg-slate-900/40 border-white/5 p-6 text-slate-400">
            Store metrics and graphs will be implemented in Level 4.
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
