"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";

export default function AdminDeliveryJobsPage() {
  return (
    <ProtectedRoute allowedRole="ADMIN">
      <DashboardLayout role="ADMIN">
        <div className="space-y-6">
          <h1 className="text-3xl font-bold text-white">Delivery Jobs</h1>
          <Card className="bg-slate-900/40 border-white/5 p-6 text-slate-400">
            System-wide delivery jobs list monitoring will be implemented in Level 6.
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
