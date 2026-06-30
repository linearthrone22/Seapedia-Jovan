"use client";

import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Wallet, ArrowDownLeft, ArrowUpRight, Plus, RefreshCw } from "lucide-react";
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

export default function BuyerWalletPage() {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [topupAmount, setTopupAmount] = useState("");
  const [topupLoading, setTopupLoading] = useState(false);

  useEffect(() => {
    fetchWallet();
  }, []);

  const fetchWallet = async () => {
    setLoading(true);
    try {
      const res = await api.get("/buyer/wallet");
      setWallet(res.data);
    } catch (err: any) {
      toast.error("Failed to load wallet details.");
    } finally {
      setLoading(false);
    }
  };

  const handleTopup = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(topupAmount);

    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid positive amount.");
      return;
    }

    if (amount > 10000000) {
      toast.error("Maximum top-up amount is IDR 10,000,000.");
      return;
    }

    setTopupLoading(true);
    try {
      await api.post("/buyer/wallet/topup", { amount });
      toast.success("Wallet top-up successful!");
      setTopupAmount("");
      fetchWallet();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Top-up failed.");
    } finally {
      setTopupLoading(false);
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
    <ProtectedRoute allowedRole="BUYER">
      <DashboardLayout role="BUYER">
        <div className="space-y-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-extrabold text-white">Wallet & Top-up</h1>
              <p className="text-slate-400">Add funds to purchase products instantly.</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchWallet}
              className="border-white/10 text-slate-300 hover:bg-white/5 hover:text-white"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {loading && !wallet ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-t-2 border-teal-400 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Side: Balance Card & Topup Form */}
              <div className="lg:col-span-1 space-y-6">
                {/* Balance display */}
                <Card className="bg-slate-900/40 border-white/5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />
                  <CardHeader className="space-y-1">
                    <CardDescription className="text-slate-400 text-xs uppercase tracking-wider font-semibold">
                      Available Balance
                    </CardDescription>
                    <CardTitle className="text-3xl font-black text-white flex items-center gap-2 pt-1">
                      <Wallet className="h-7 w-7 text-teal-400" />
                      <span>{formatPrice(wallet?.balance || 0)}</span>
                    </CardTitle>
                  </CardHeader>
                </Card>

                {/* Topup Form */}
                <Card className="bg-slate-900/40 border-white/5">
                  <CardHeader>
                    <CardTitle className="text-white">Top-up Funds</CardTitle>
                    <CardDescription className="text-slate-400">
                      Instantly credit your wallet using virtual payment.
                    </CardDescription>
                  </CardHeader>
                  <form onSubmit={handleTopup}>
                    <CardContent className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300">Amount (IDR)</label>
                        <Input
                          type="number"
                          placeholder="e.g. 500000"
                          value={topupAmount}
                          onChange={(e) => setTopupAmount(e.target.value)}
                          className="bg-slate-950 border-white/10 text-white focus:border-teal-500 font-semibold"
                          required
                        />
                      </div>
                    </CardContent>
                    <CardFooter className="border-t border-white/5 p-6 bg-slate-950/20">
                      <Button
                        type="submit"
                        disabled={topupLoading}
                        className="w-full bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold"
                      >
                        {topupLoading ? "Processing..." : <><Plus className="mr-1.5 h-4 w-4" /> Deposit Funds</>}
                      </Button>
                    </CardFooter>
                  </form>
                </Card>
              </div>

              {/* Right Side: Transaction Log */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-xl font-bold text-slate-200">Recent Transactions</h3>
                <Card className="bg-slate-900/40 border-white/5 overflow-hidden">
                  <div className="divide-y divide-white/5 max-h-[400px] overflow-y-auto custom-scrollbar">
                    {wallet?.transactions.length === 0 ? (
                      <div className="p-8 text-center text-slate-500 text-sm">
                        No transactions registered yet.
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
