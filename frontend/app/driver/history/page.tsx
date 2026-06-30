"use client";

import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Truck, CheckCircle2, XCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

interface HistoryJob {
  id: string;
  orderId: string;
  status: "DELIVERED" | "FAILED";
  deliveryFee: number;
  updatedAt: string;
  order: {
    store: { name: string };
  };
}

export default function DriverHistoryPage() {
  const [history, setHistory] = useState<HistoryJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await api.get("/driver/history");
      setHistory(res.data);
    } catch (err: any) {
      toast.error("Failed to load delivery history.");
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

  return (
    <ProtectedRoute allowedRole="DRIVER">
      <DashboardLayout role="DRIVER">
        <div className="space-y-8">
          <div className="flex justify-between items-center border-b border-white/5 pb-6">
            <div>
              <h1 className="text-3xl font-extrabold text-white">Delivery History</h1>
              <p className="text-slate-400">Review completed and failed courier shipment routes.</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchHistory}
              className="border-white/10 text-slate-300 hover:bg-white/5"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-t-2 border-teal-400 rounded-full animate-spin" />
            </div>
          ) : history.length === 0 ? (
            <Card className="bg-slate-900/40 border-white/5 border-dashed p-16 text-center space-y-4">
              <Truck className="h-8 w-8 text-slate-500 mx-auto" />
              <h2 className="text-xl font-bold text-white">No History Logs</h2>
              <p className="text-slate-400 text-sm">Completed or failed delivery jobs will be recorded here.</p>
            </Card>
          ) : (
            <Card className="bg-slate-900/40 border-white/5 overflow-hidden">
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-white/5 bg-slate-950/40 text-slate-400 font-bold">
                      <th className="p-4">Job ID</th>
                      <th className="p-4">Merchant Origin</th>
                      <th className="p-4">Payout Fee</th>
                      <th className="p-4">Completed Date</th>
                      <th className="p-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {history.map((job) => {
                      const isSuccess = job.status === "DELIVERED";
                      return (
                        <tr key={job.id} className="hover:bg-white/5 transition-colors">
                          <td className="p-4 font-mono text-slate-200">
                            #{job.id.slice(-8).toUpperCase()}
                          </td>
                          <td className="p-4 font-semibold text-white">{job.order.store.name}</td>
                          <td className="p-4 font-bold text-teal-400">
                            {formatPrice(job.deliveryFee)}
                          </td>
                          <td className="p-4 text-slate-400">
                            {new Date(job.updatedAt).toLocaleString()}
                          </td>
                          <td className="p-4 text-right">
                            <Badge
                              className={`border font-bold text-[10px] uppercase tracking-wider px-2 py-0.5 ${
                                isSuccess
                                  ? "bg-teal-500/10 text-teal-400 border-teal-500/20"
                                  : "bg-red-500/10 text-red-400 border-red-500/20"
                              }`}
                            >
                              {isSuccess ? (
                                <span className="flex items-center gap-1">
                                  <CheckCircle2 className="h-3.5 w-3.5" /> Delivered
                                </span>
                              ) : (
                                <span className="flex items-center gap-1">
                                  <XCircle className="h-3.5 w-3.5" /> Failed
                                </span>
                              )}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
