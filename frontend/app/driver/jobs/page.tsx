"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Truck, MapPin, Navigation, RefreshCw, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

interface AvailableJob {
  id: string;
  orderId: string;
  deliveryFee: number;
  order: {
    store: { name: string };
    deliveryAddress: {
      recipientName: string;
      city: string;
      province: string;
    };
  };
}

export default function DriverJobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<AvailableJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await api.get("/driver/jobs/available");
      setJobs(res.data);
    } catch (err: any) {
      toast.error("Failed to load available shipment jobs.");
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptJob = async (jobId: string) => {
    setActionLoading(jobId);
    try {
      await api.post(`/driver/jobs/${jobId}/accept`);
      toast.success("Delivery job accepted! Navigate back to dashboard to process.");
      router.push("/driver/dashboard");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to accept job.");
    } finally {
      setActionLoading(null);
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
              <h1 className="text-3xl font-extrabold text-white">Delivery Job Board</h1>
              <p className="text-slate-400">Claim available delivery tasks on the ocean-routes registry.</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchJobs}
              className="border-white/10 text-slate-300 hover:bg-white/5"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-t-2 border-teal-400 rounded-full animate-spin" />
            </div>
          ) : jobs.length === 0 ? (
            <Card className="bg-slate-900/40 border-white/5 border-dashed p-16 text-center space-y-4">
              <Truck className="h-8 w-8 text-slate-500 mx-auto" />
              <h2 className="text-xl font-bold text-white">No Jobs Available</h2>
              <p className="text-slate-400 text-sm">Check back later when merchants process packaging shipments.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {jobs.map((job) => (
                <Card
                  key={job.id}
                  className="bg-slate-900/40 border-white/5 p-6 flex flex-col justify-between hover:border-white/10 transition-colors"
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-2">
                        <Navigation className="h-4.5 w-4.5 text-teal-400" />
                        <h3 className="font-bold text-white text-md">Shipment Delivery</h3>
                      </div>
                      <div className="text-teal-400 font-extrabold text-sm bg-teal-500/10 border border-teal-500/20 px-2.5 py-1 rounded">
                        {formatPrice(job.deliveryFee)}
                      </div>
                    </div>

                    <div className="space-y-2 text-xs text-slate-400">
                      <p>
                        Origin Store: <strong className="text-slate-200">{job.order.store.name}</strong>
                      </p>
                      <div className="flex items-start gap-1 mt-1">
                        <MapPin className="h-3.5 w-3.5 text-slate-500 shrink-0 mt-0.5" />
                        <span>
                          To: <strong className="text-slate-200">{job.order.deliveryAddress.recipientName}</strong>
                          {" - "}{job.order.deliveryAddress.city}, {job.order.deliveryAddress.province}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 border-t border-white/5 pt-4">
                    <Button
                      onClick={() => handleAcceptJob(job.id)}
                      disabled={actionLoading !== null}
                      className="w-full bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold"
                    >
                      {actionLoading === job.id ? "Accepting..." : "Claim Delivery Job"}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
