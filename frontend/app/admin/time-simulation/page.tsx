"use client";

import { useState } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Clock, Play, ArrowLeft, RotateCcw, ShieldCheck, HelpCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import api from "@/lib/api";

interface SimulationResults {
  message: string;
  autoCanceled: string[];
  autoCompleted: string[];
}

export default function AdminTimeSimulationPage() {
  const router = useRouter();
  const [days, setDays] = useState("1");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SimulationResults | null>(null);

  const handleAdvanceTime = async (e: React.FormEvent) => {
    e.preventDefault();

    const dVal = parseInt(days);
    if (isNaN(dVal) || dVal <= 0) {
      toast.error("Please enter a valid positive number of days.");
      return;
    }

    setLoading(true);
    setResults(null);
    try {
      const res = await api.post("/admin/time-simulation/advance", { days: dVal });
      setResults(res.data);
      toast.success("System advanced and SLA jobs parsed successfully!");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to run simulation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute allowedRole="ADMIN">
      <DashboardLayout role="ADMIN">
        <div className="space-y-8 max-w-4xl w-full">
          <div className="flex justify-between items-center border-b border-white/5 pb-6">
            <div>
              <h1 className="text-3xl font-extrabold text-white">Time Simulation Panel</h1>
              <p className="text-slate-400">Advance system clock timestamps to test SLA auto-cancel & auto-completion triggers.</p>
            </div>
            <Button
              variant="outline"
              onClick={() => router.push("/admin/dashboard")}
              className="border-white/10 text-slate-300 hover:bg-white/5"
            >
              <ArrowLeft className="mr-1.5 h-4 w-4" /> Admin Hub
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Simulation controls */}
            <div className="md:col-span-1 space-y-6">
              <Card className="bg-slate-900/40 border-white/5">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Clock className="h-5 w-5 text-teal-400" />
                    <span>Advance Time</span>
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Fast-forward platform database timestamps by days.
                  </CardDescription>
                </CardHeader>
                <form onSubmit={handleAdvanceTime}>
                  <CardContent className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300">Days to shift</label>
                      <Input
                        type="number"
                        placeholder="e.g. 5"
                        value={days}
                        onChange={(e) => setDays(e.target.value)}
                        className="bg-slate-950 border-white/10 text-white focus:border-teal-500 font-extrabold"
                        required
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="border-t border-white/5 p-6 bg-slate-950/20">
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold"
                    >
                      {loading ? "Simulating..." : <><Play className="mr-1.5 h-4 w-4 fill-slate-950" /> Advance Clock</>}
                    </Button>
                  </CardFooter>
                </form>
              </Card>

              {/* SLA Rules Help Card */}
              <Card className="bg-slate-900/20 border-white/5 p-4 text-xs text-slate-400 space-y-3 leading-relaxed">
                <div className="flex items-center gap-1.5 font-bold text-slate-200">
                  <HelpCircle className="h-4 w-4 text-teal-400" />
                  <span>Platform SLA Policies</span>
                </div>
                <ul className="list-disc pl-4 space-y-1.5">
                  <li>
                    <strong>Packaging SLA (4 Days)</strong>: Orders staying in <em>Packaging</em> (SEDANG_DIKEMAS) status for &gt; 4 days are auto-cancelled, buyer refunded, and inventory restored.
                  </li>
                  <li>
                    <strong>Transit SLA (3 Days)</strong>: Orders remaining <em>In Transit</em> (SEDANG_DIKIRIM) for &gt; 3 days are auto-completed, and payouts distributed to seller and driver.
                  </li>
                </ul>
              </Card>
            </div>

            {/* Simulation Results Panel */}
            <div className="md:col-span-2">
              <Card className="bg-slate-900/40 border-white/5 p-6 h-full flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-white text-md border-b border-white/5 pb-3">
                    Simulation Execution Results
                  </h3>

                  {!results ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center text-slate-500 text-sm space-y-3">
                      <ShieldCheck className="h-12 w-12 text-slate-600" />
                      <p className="max-w-xs">
                        Enter N days and trigger simulation to view batch job outcomes.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-6 space-y-6">
                      <div className="bg-teal-500/10 border border-teal-500/20 text-teal-400 rounded-lg p-3 text-xs leading-relaxed">
                        {results.message}
                      </div>

                      <div className="space-y-4">
                        <div>
                          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                            Auto-Canceled Orders ({results.autoCanceled.length})
                          </h4>
                          {results.autoCanceled.length === 0 ? (
                            <p className="text-xs text-slate-600">No orders breached the packaging SLA.</p>
                          ) : (
                            <div className="space-y-1.5 max-h-32 overflow-y-auto custom-scrollbar">
                              {results.autoCanceled.map((oid) => (
                                <div key={oid} className="text-xs font-mono text-red-400 bg-red-500/5 p-1.5 rounded border border-red-500/10">
                                  #{oid.slice(-8).toUpperCase()} - Canceled & Refunded
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div>
                          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                            Auto-Completed Orders ({results.autoCompleted.length})
                          </h4>
                          {results.autoCompleted.length === 0 ? (
                            <p className="text-xs text-slate-600">No orders breached the transit SLA.</p>
                          ) : (
                            <div className="space-y-1.5 max-h-32 overflow-y-auto custom-scrollbar">
                              {results.autoCompleted.map((oid) => (
                                <div key={oid} className="text-xs font-mono text-teal-400 bg-teal-500/5 p-1.5 rounded border border-teal-500/10">
                                  #{oid.slice(-8).toUpperCase()} - Completed & Paid Out
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
