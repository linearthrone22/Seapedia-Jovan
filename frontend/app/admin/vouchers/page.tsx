"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";

export default function AdminVouchersPage() {
  return (
    <ProtectedRoute allowedRole="ADMIN">
      <DashboardLayout role="ADMIN">
        <div className="space-y-6">
          <h1 className="text-3xl font-bold text-white">Vouchers & Promos</h1>
          <Card className="bg-slate-900/40 border-white/5 p-6 text-slate-400">
            Voucher and promo discount CRUD will be implemented in Level 4 and Level 6.
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
