"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";

export default function BuyerOrdersPage() {
  return (
    <ProtectedRoute allowedRole="BUYER">
      <DashboardLayout role="BUYER">
        <div className="space-y-6">
          <h1 className="text-3xl font-bold text-white">Order History</h1>
          <Card className="bg-slate-900/40 border-white/5 p-6 text-slate-400">
            Order history listing will be implemented in Level 3.
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
