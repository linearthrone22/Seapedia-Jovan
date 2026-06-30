"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, User, MapPin, Truck, RefreshCw } from "lucide-react";
import { STATUS_BADGES } from "@/app/buyer/orders/page";
import { toast } from "sonner";
import api from "@/lib/api";

interface OrderItem {
  id: string;
  productName: string;
  price: number;
  quantity: number;
}

interface OrderDetail {
  id: string;
  buyer: { username: string; email: string };
  deliveryMethod: string;
  deliveryAddress: {
    recipientName: string;
    phone: string;
    addressLine: string;
    city: string;
    province: string;
    postalCode: string;
  };
  subtotal: number;
  discountAmount: number;
  deliveryFee: number;
  taxAmount: number;
  totalAmount: number;
  status: string;
  createdAt: string;
  items: OrderItem[];
  statusHistory: Array<{
    id: string;
    status: string;
    note: string | null;
    createdAt: string;
  }>;
}

export default function SellerOrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrderDetail();
  }, [params.id]);

  const fetchOrderDetail = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/seller/orders/${params.id}`);
      setOrder(res.data);
    } catch (err: any) {
      toast.error("Failed to load store order details.");
      router.push("/seller/orders");
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

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center bg-slate-950">
        <div className="w-10 h-10 border-t-2 border-teal-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (!order) return null;

  const activeBadge = STATUS_BADGES[order.status] || { label: order.status, style: "" };

  return (
    <ProtectedRoute allowedRole="SELLER">
      <DashboardLayout role="SELLER">
        <div className="space-y-6 max-w-4xl w-full">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => router.push("/seller/orders")}
              className="text-slate-400 hover:text-white hover:bg-white/5"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Orders
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchOrderDetail}
              className="border-white/10 text-slate-300 hover:bg-white/5"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {/* Heading */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-6">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-extrabold text-white">Incoming Order Detail</h1>
                <Badge className={`${activeBadge.style} border font-bold text-[10px] uppercase tracking-wider`}>
                  {activeBadge.label}
                </Badge>
              </div>
              <p className="text-slate-400 text-xs mt-1">
                Order ID: <span className="font-mono text-slate-300 font-bold">{order.id}</span>
              </p>
            </div>
            <div className="text-right text-xs text-slate-500">
              Ordered at: <span className="text-slate-300 font-semibold">{new Date(order.createdAt).toLocaleString()}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Left/Middle Content: Details & Timeline */}
            <div className="md:col-span-2 space-y-6">
              {/* 1. Timeline */}
              <Card className="bg-slate-900/40 border-white/5 p-6">
                <h3 className="font-bold text-white text-md flex items-center gap-2 border-b border-white/5 pb-3">
                  <Clock className="h-4.5 w-4.5 text-teal-400" /> Order Status Log
                </h3>
                <div className="mt-6 relative pl-6 border-l border-white/10 space-y-6">
                  {order.statusHistory.map((history) => {
                    const badge = STATUS_BADGES[history.status] || { label: history.status, style: "" };
                    return (
                      <div key={history.id} className="relative">
                        <div className="absolute -left-[30px] top-1.5 w-2 h-2 rounded-full bg-teal-400 ring-4 ring-teal-400/20" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-white">{badge.label}</span>
                            <span className="text-[10px] text-slate-500 font-medium">
                              {new Date(history.createdAt).toLocaleString()}
                            </span>
                          </div>
                          {history.note && (
                            <p className="text-xs text-slate-400 mt-1 leading-relaxed bg-slate-950/40 p-2.5 rounded border border-white/5">
                              {history.note}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* 2. Items Purchased */}
              <Card className="bg-slate-900/40 border-white/5 p-6">
                <h3 className="font-bold text-white text-md border-b border-white/5 pb-3 mb-4">
                  Purchased Items
                </h3>
                <div className="divide-y divide-white/5">
                  {order.items.map((item) => (
                    <div key={item.id} className="py-3.5 flex justify-between text-sm">
                      <div>
                        <p className="font-semibold text-slate-200">{item.productName}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {formatPrice(item.price)} x {item.quantity}
                        </p>
                      </div>
                      <span className="font-bold text-white">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Right Side: Shipping & Cost info */}
            <div className="md:col-span-1 space-y-6">
              {/* Customer Info */}
              <Card className="bg-slate-900/40 border-white/5 p-6 space-y-4">
                <h3 className="font-bold text-white text-sm flex items-center gap-1.5 border-b border-white/5 pb-2">
                  <User className="h-4 w-4 text-teal-400" /> Buyer Customer
                </h3>
                <div className="text-xs space-y-1">
                  <p className="font-bold text-slate-200">{order.buyer.username}</p>
                  <p className="text-slate-500">{order.buyer.email}</p>
                </div>
              </Card>

              {/* Shipping Address info */}
              <Card className="bg-slate-900/40 border-white/5 p-6 space-y-4">
                <h3 className="font-bold text-white text-sm flex items-center gap-1.5 border-b border-white/5 pb-2">
                  <MapPin className="h-4 w-4 text-teal-400" /> Ship-To Address
                </h3>
                <div className="text-xs space-y-1.5 leading-relaxed">
                  <p className="font-bold text-slate-200">{order.deliveryAddress.recipientName}</p>
                  <p className="text-slate-400 font-semibold">{order.deliveryAddress.phone}</p>
                  <p className="text-slate-500">
                    {order.deliveryAddress.addressLine}, {order.deliveryAddress.city}, {order.deliveryAddress.province}, {order.deliveryAddress.postalCode}
                  </p>
                </div>
              </Card>

              {/* Courier info */}
              <Card className="bg-slate-900/40 border-white/5 p-6 space-y-3">
                <h3 className="font-bold text-white text-sm flex items-center gap-1.5 border-b border-white/5 pb-2">
                  <Truck className="h-4 w-4 text-teal-400" /> Courier Speed
                </h3>
                <div className="text-xs">
                  <span className="bg-teal-500/10 text-teal-300 border border-teal-500/20 px-2 py-0.5 rounded font-extrabold uppercase tracking-wider">
                    {order.deliveryMethod}
                  </span>
                </div>
              </Card>

              {/* Totals panel */}
              <Card className="bg-slate-900/40 border-white/5 p-6 space-y-4">
                <h3 className="font-bold text-white text-sm border-b border-white/5 pb-2">
                  Merchant Subtotals
                </h3>
                <div className="space-y-2.5 text-xs text-slate-400">
                  <div className="flex justify-between">
                    <span>Items Subtotal</span>
                    <span className="font-semibold text-slate-200">{formatPrice(order.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-white font-extrabold text-sm border-t border-white/5 pt-3">
                    <span>Total Order Amount</span>
                    <span className="text-teal-400">{formatPrice(order.totalAmount)}</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
