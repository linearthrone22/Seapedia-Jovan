"use client";

import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, ArrowDownLeft, ArrowUpRight, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

interface WalletTransaction {
  id: string;
  type: "TOPUP" | "PAYMENT" | "REFUND" | "INCOME" | "INCOME_REVERSAL";
  amount: number;
  description: string;
  createdAt: string;
}

interface WalletData {
  id: string;
  balance: number;
  transactions: WalletTransaction[];
}

export default function DriverEarningsPage() {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWallet();
  }, []);

  const fetchWallet = async () => {
    setLoading(true);
    try {
      // Driver shares the user wallet model, so we call the same wallet endpoint
      const res = await api.get("/buyer/wallet");
      setWallet(res.data);
    } catch (err: any) {
      toast.error("Failed to load driver wallet details.");
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
              <h1 className="text-3xl font-extrabold text-white">Courier Earnings</h1>
              <p className="text-slate-400">View payout transactions credited for completed ocean deliveries.</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchWallet}
              className="border-white/10 text-slate-300 hover:bg-white/5"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-t-2 border-teal-400 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Side: Balance Summary Card */}
              <div className="lg:col-span-1">
                <Card className="bg-slate-900/40 border-white/5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />
                  <CardHeader className="space-y-1">
                    <CardDescription className="text-slate-400 text-xs uppercase tracking-wider font-semibold">
                      Total Courier Balance
                    </CardDescription>
                    <CardTitle className="text-3xl font-black text-white flex items-center gap-2 pt-1">
                      <Wallet className="h-7 w-7 text-teal-400" />
                      <span>{formatPrice(wallet?.balance || 0)}</span>
                    </CardTitle>
                  </CardHeader>
                </Card>
              </div>

              {/* Right Side: Payout Logs */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-xl font-bold text-slate-200">Payout Logs</h3>
                <Card className="bg-slate-900/40 border-white/5 overflow-hidden">
                  <div className="divide-y divide-white/5 max-h-[500px] overflow-y-auto custom-scrollbar">
                    {wallet?.transactions.length === 0 ? (
                      <div className="p-8 text-center text-slate-500 text-sm">
                        No payout transactions registered yet. Complete delivery jobs to earn.
                      </div>
                    ) : (
                      wallet?.transactions.map((tx) => {
                        const isCredit = tx.type === "TOPUP" || tx.type === "REFUND" || tx.type === "INCOME";
                        return (
                          <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                            <div className="flex items-center space-x-3">
                              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                                isCredit ? "bg-teal-500/10 text-teal-400" : "bg-red-500/10 text-red-400"
                              }`}>
                                {isCredit ? <ArrowDownLeft className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                              </div>
                              <div>
                                <div className="font-semibold text-slate-200 text-sm">{tx.description}</div>
                                <div className="text-[10px] text-slate-500 mt-0.5">
                                  {new Date(tx.createdAt).toLocaleString()}
                                </div>
                              </div>
                            </div>
                            <div className={`font-extrabold text-sm ${
                              isCredit ? "text-teal-400" : "text-red-400"
                            }`}>
                              {isCredit ? "+" : "-"}{formatPrice(tx.amount)}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </Card>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
