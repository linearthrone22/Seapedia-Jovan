"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Box, Truck, MapPin, Phone, User, AlertTriangle, CheckCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
}

interface ActiveJob {
  id: string;
  orderId: string;
  status: "ACCEPTED" | "PICKED_UP";
  deliveryFee: number;
  order: {
    store: { name: string };
    deliveryAddress: {
      recipientName: string;
      phone: string;
      addressLine: string;
      city: string;
      province: string;
      postalCode: string;
    };
    items: OrderItem[];
  };
}

export default function DriverDashboardPage() {
  const router = useRouter();
  const [activeJob, setActiveJob] = useState<ActiveJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchActiveJob();
  }, []);

  const fetchActiveJob = async () => {
    setLoading(true);
    try {
      const res = await api.get("/driver/jobs/active");
      setActiveJob(res.data);
    } catch (err: any) {
      toast.error("Failed to load active delivery job.");
    } finally {
      setLoading(false);
    }
  };

  const handlePickup = async () => {
    if (!activeJob) return;
    setActionLoading(true);
    try {
      await api.post(`/driver/jobs/${activeJob.id}/pickup`);
      toast.success("Package marked as Picked Up! You are now in transit.");
      fetchActiveJob();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to update package pickup.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeliver = async () => {
    if (!activeJob) return;
    setActionLoading(true);
    try {
      await api.post(`/driver/jobs/${activeJob.id}/deliver`);
      toast.success("Delivery marked as completed successfully! Payout credited.");
      fetchActiveJob();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to update delivery status.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleFail = async () => {
    if (!activeJob) return;
    if (!confirm("Are you sure you want to mark this delivery as failed? This will trigger a buyer refund and return workflow.")) return;

    setActionLoading(true);
    try {
      await api.post(`/driver/jobs/${activeJob.id}/fail`);
      toast.success("Delivery status updated to Failed. Order refunded to buyer.");
      fetchActiveJob();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to update delivery status.");
    } finally {
      setActionLoading(false);
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
              <h1 className="text-3xl font-extrabold text-white">Driver Workspace</h1>
              <p className="text-slate-400">Manage your active shipment route and delivery logs.</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchActiveJob}
              className="border-white/10 text-slate-300 hover:bg-white/5"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-t-2 border-teal-400 rounded-full animate-spin" />
            </div>
          ) : !activeJob ? (
            <Card className="bg-slate-900/40 border-white/5 border-dashed p-16 text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-slate-950/60 flex items-center justify-center text-slate-500 mx-auto border border-white/5">
                <Truck className="h-8 w-8 text-teal-400" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-white">No Active Deliveries</h2>
                <p className="text-slate-400 text-sm max-w-md mx-auto">
                  You are currently offline or have completed your routes. Browse the job board to pick up orders.
                </p>
              </div>
              <Button onClick={() => router.push("/driver/jobs")} className="bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold">
                Browse Delivery Jobs
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Active Route Details */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="bg-slate-900/40 border-white/5 p-6 space-y-6">
                  <div className="flex justify-between items-start border-b border-white/5 pb-4">
                    <div>
                      <h2 className="font-extrabold text-white text-lg">Active Shipment Details</h2>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">JOB ID: {activeJob.id}</p>
                    </div>
                    <span className="bg-teal-500/10 text-teal-300 border border-teal-500/20 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider">
                      {activeJob.status.replace("_", " ")}
                    </span>
                  </div>

                  {/* Route points */}
                  <div className="space-y-6 relative pl-6 border-l border-white/10">
                    {/* Origin */}
                    <div className="relative">
                      <div className="absolute -left-[30px] top-1 w-2.5 h-2.5 rounded-full bg-teal-400" />
                      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Store Origin</h4>
                      <p className="text-sm font-bold text-white mt-1">{activeJob.order.store.name}</p>
                    </div>

                    {/* Destination */}
                    <div className="relative">
                      <div className="absolute -left-[30px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-400" />
                      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Delivery Destination</h4>
                      <div className="text-xs text-slate-300 mt-2 space-y-1.5 leading-relaxed bg-slate-950/40 p-4 rounded-xl border border-white/5">
                        <div className="flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-slate-500" />
                          <span className="font-semibold text-slate-200">{activeJob.order.deliveryAddress.recipientName}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 text-slate-500" />
                          <span>{activeJob.order.deliveryAddress.phone}</span>
                        </div>
                        <div className="flex items-start gap-1.5 pt-1.5 border-t border-white/5 mt-1.5">
                          <MapPin className="h-3.5 w-3.5 text-slate-500 shrink-0 mt-0.5" />
                          <span>
                            {activeJob.order.deliveryAddress.addressLine}, {activeJob.order.deliveryAddress.city}, {activeJob.order.deliveryAddress.province}, {activeJob.order.deliveryAddress.postalCode}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Packages details */}
                  <div className="border-t border-white/5 pt-6 space-y-3">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Package Items</h4>
                    <div className="divide-y divide-white/5">
                      {activeJob.order.items.map((item) => (
                        <div key={item.id} className="py-2.5 flex justify-between text-xs text-slate-300">
                          <span>{item.productName}</span>
                          <span className="font-semibold text-slate-400">x{item.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              </div>

              {/* Action Controls & Payout panel */}
              <div className="lg:col-span-1 space-y-6">
                {/* Payout card */}
                <Card className="bg-slate-900/40 border-white/5 p-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 rounded-full blur-2xl pointer-events-none" />
                  <CardHeader className="p-0 pb-3 border-b border-white/5">
                    <CardDescription className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">Shipment Payout Fee</CardDescription>
                    <CardTitle className="text-2xl font-black text-teal-400 mt-1">{formatPrice(activeJob.deliveryFee)}</CardTitle>
                  </CardHeader>
                </Card>

                {/* Driver Controls */}
                <Card className="bg-slate-900/40 border-white/5 p-6 space-y-4">
                  <h3 className="font-bold text-white text-sm">Shipment Controls</h3>

                  {activeJob.status === "ACCEPTED" ? (
                    <Button
                      onClick={handlePickup}
                      disabled={actionLoading}
                      className="w-full bg-teal-500 hover:bg-teal-600 text-slate-950 font-extrabold py-6 text-sm rounded-xl"
                    >
                      <Box className="mr-2 h-4 w-4" /> Pick Up Package
                    </Button>
                  ) : (
                    <div className="space-y-3">
                      <Button
                        onClick={handleDeliver}
                        disabled={actionLoading}
                        className="w-full bg-teal-500 hover:bg-teal-600 text-slate-950 font-extrabold py-6 text-sm rounded-xl"
                      >
                        <CheckCircle className="mr-2 h-4 w-4" /> Mark Delivered
                      </Button>
                      <Button
                        onClick={handleFail}
                        disabled={actionLoading}
                        variant="destructive"
                        className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 py-6 text-sm rounded-xl font-bold"
                      >
                        <AlertTriangle className="mr-2 h-4 w-4" /> Mark Delivery Failed
                      </Button>
                    </div>
                  )}
                </Card>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
