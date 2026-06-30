"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";

export default function SellerProductsPage() {
  return (
    <ProtectedRoute allowedRole="SELLER">
      <DashboardLayout role="SELLER">
        <div className="space-y-6">
          <h1 className="text-3xl font-bold text-white">Products Catalog</h1>
          <Card className="bg-slate-900/40 border-white/5 p-6 text-slate-400">
            Product inventory management will be implemented in Level 2.
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
