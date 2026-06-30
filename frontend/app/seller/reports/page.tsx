"use client";

import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, ClipboardList, Calendar, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

interface MonthlyData {
  month: string;
  income: number;
  orderCount: number;
}

interface SellerReport {
  totalIncome: number;
  orderCount: number;
  monthlyBreakdown: MonthlyData[];
}

export default function SellerReportsPage() {
  const [report, setReport] = useState<SellerReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await api.get("/seller/reports");
      setReport(res.data);
    } catch (err: any) {
      toast.error("Failed to load store sales reports.");
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatMonthName = (monthStr: string) => {
    const [year, month] = monthStr.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleString("default", { month: "long", year: "numeric" });
  };

  return (
    <ProtectedRoute allowedRole="SELLER">
      <DashboardLayout role="SELLER">
        <div className="space-y-8">
          <div className="flex justify-between items-center border-b border-white/5 pb-6">
            <div>
              <h1 className="text-3xl font-extrabold text-white">Store Analytics & Reports</h1>
              <p className="text-slate-400">View overall earnings and monthly performance metrics.</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchReport}
              className="border-white/10 text-slate-300 hover:bg-white/5"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {loading && !report ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-t-2 border-teal-400 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-8">
              {/* Stats Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Total Revenue */}
                <Card className="bg-slate-900/40 border-white/5 p-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 rounded-full blur-2xl pointer-events-none" />
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-400">
                      <DollarSign className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Store Total Earnings</p>
                      <h2 className="text-2xl font-black text-white mt-1">
                        {formatPrice(report?.totalIncome || 0)}
                      </h2>
                    </div>
                  </div>
                </Card>

                {/* Total Orders Received */}
                <Card className="bg-slate-900/40 border-white/5 p-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                      <ClipboardList className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Total Incoming Orders</p>
                      <h2 className="text-2xl font-black text-white mt-1">
                        {report?.orderCount || 0} orders
                      </h2>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Monthly Breakdown Table */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-teal-400" />
                  <span>Monthly Sales Performance</span>
                </h3>

                <Card className="bg-slate-900/40 border-white/5 overflow-hidden">
                  <CardContent className="p-0">
                    {report?.monthlyBreakdown.length === 0 ? (
                      <div className="p-8 text-center text-slate-500 text-sm">
                        No monthly statistics registered yet. Complete orders to record income.
                      </div>
                    ) : (
                      <table className="w-full text-left border-collapse text-sm">
                        <thead>
                          <tr className="border-b border-white/5 bg-slate-950/40 text-slate-400 font-bold">
                            <th className="p-4">Billing Month</th>
                            <th className="p-4">Orders Completed</th>
                            <th className="p-4 text-right">Income Generated</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {report?.monthlyBreakdown.map((row) => (
                            <tr key={row.month} className="hover:bg-white/5 transition-colors">
                              <td className="p-4 font-semibold text-white">
                                {formatMonthName(row.month)}
                              </td>
                              <td className="p-4 text-slate-300 font-medium">
                                {row.orderCount} orders completed
                              </td>
                              <td className="p-4 text-right font-bold text-teal-400">
                                {formatPrice(row.income)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
