"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Truck, Wallet, AlertCircle, ShoppingBag, Check } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

interface Address {
  id: string;
  label: string;
  recipientName: string;
  phone: string;
  addressLine: string;
  city: string;
  province: string;
  postalCode: string;
  isDefault: boolean;
}

interface CartItem {
  id: string;
  quantity: number;
  product: {
    name: string;
    price: number;
  };
}

interface CartData {
  id: string;
  store: { name: string } | null;
  items: CartItem[];
  subtotal: number;
}

type DeliveryMethod = "INSTANT" | "NEXT_DAY" | "REGULAR";

const SHIPPING_FEES: Record<DeliveryMethod, number> = {
  INSTANT: 25000,
  NEXT_DAY: 15000,
  REGULAR: 9000,
};

export default function BuyerCheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartData | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // Selections
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("REGULAR");
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const cartRes = await api.get("/buyer/cart");
      setCart(cartRes.data);

      const addressRes = await api.get("/buyer/addresses");
      const addrList = addressRes.data;
      setAddresses(addrList);

      const walletRes = await api.get("/buyer/wallet");
      setWalletBalance(walletRes.data.balance);

      // Pre-select default address
      const defaultAddr = addrList.find((a: Address) => a.isDefault);
      if (defaultAddr) {
        setSelectedAddressId(defaultAddr.id);
      } else if (addrList.length > 0) {
        setSelectedAddressId(addrList[0].id);
      }
    } catch (err: any) {
      toast.error("Failed to load checkout parameters.");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (!selectedAddressId) {
      toast.error("Please select a delivery address.");
      return;
    }

    setCheckoutLoading(true);
    try {
      const res = await api.post("/buyer/checkout", {
        deliveryMethod,
        deliveryAddressId: selectedAddressId,
      });
      toast.success("Order placed successfully!");
      router.push(`/buyer/orders/${res.data.id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Checkout failed.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  // Calculations
  const subtotal = cart?.subtotal || 0;
  const deliveryFee = SHIPPING_FEES[deliveryMethod];
  const discountAmount = 0; // stack logic in Level 4
  const taxBase = subtotal - discountAmount + deliveryFee;
  const taxAmount = Math.round(taxBase * 0.12);
  const totalAmount = taxBase + taxAmount;

  const hasSufficientFunds = walletBalance !== null && walletBalance >= totalAmount;

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
          <div>
            <h1 className="text-3xl font-extrabold text-white">Order Checkout</h1>
            <p className="text-slate-400">Complete your shipment selection and wallet payment verification.</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-t-2 border-teal-400 rounded-full animate-spin" />
            </div>
          ) : !cart || cart.items.length === 0 ? (
            <Card className="bg-slate-900/40 border-white/5 border-dashed p-16 text-center space-y-4">
              <ShoppingBag className="h-8 w-8 text-slate-500 mx-auto" />
              <h2 className="text-xl font-bold text-white">No Items for Checkout</h2>
              <Button onClick={() => router.push("/buyer/cart")}>Back to Cart</Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Selections Section */}
              <div className="lg:col-span-2 space-y-6">
                {/* 1. Address Selection */}
                <div className="space-y-3">
                  <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                    <MapPin className="h-4.5 w-4.5 text-teal-400" />
                    <span>1. Shipping Address</span>
                  </h3>

                  {addresses.length === 0 ? (
                    <Card className="bg-slate-900/20 border-white/5 p-6 text-center border-dashed">
                      <p className="text-sm text-slate-400 mb-4">No shipping addresses listed.</p>
                      <Button size="sm" onClick={() => router.push("/buyer/addresses")}>
                        Configure Address
                      </Button>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {addresses.map((addr) => {
                        const isSelected = selectedAddressId === addr.id;
                        return (
                          <Card
                            key={addr.id}
                            onClick={() => setSelectedAddressId(addr.id)}
                            className={`bg-slate-900/40 border-white/5 p-4 cursor-pointer hover:border-white/10 transition-colors ${
                              isSelected ? "border-teal-500/50 bg-slate-900/80" : ""
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <h4 className="font-bold text-white text-sm">{addr.label}</h4>
                              {isSelected && <Check className="h-4 w-4 text-teal-400" />}
                            </div>
                            <div className="text-xs text-slate-400 mt-2 space-y-0.5">
                              <p className="font-medium text-slate-200">{addr.recipientName}</p>
                              <p>{addr.phone}</p>
                              <p className="line-clamp-2 mt-1">{addr.addressLine}, {addr.city}</p>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 2. Courier Selection */}
                <div className="space-y-3 pt-4 border-t border-white/5">
                  <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                    <Truck className="h-4.5 w-4.5 text-teal-400" />
                    <span>2. Delivery Speed</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {(["INSTANT", "NEXT_DAY", "REGULAR"] as DeliveryMethod[]).map((method) => {
                      const isSelected = deliveryMethod === method;
                      const fee = SHIPPING_FEES[method];
                      return (
                        <Card
                          key={method}
                          onClick={() => setDeliveryMethod(method)}
                          className={`bg-slate-900/40 border-white/5 p-4 cursor-pointer hover:border-white/10 transition-colors text-center ${
                            isSelected ? "border-teal-500/50 bg-slate-900/80" : ""
                          }`}
                        >
                          <h4 className="font-extrabold text-white text-xs tracking-wider uppercase">
                            {method.replace("_", " ")}
                          </h4>
                          <p className="text-sm font-semibold text-teal-300 mt-2">{formatPrice(fee)}</p>
                          <p className="text-[10px] text-slate-500 mt-1">
                            {method === "INSTANT"
                              ? "SLA 1 Day"
                              : method === "NEXT_DAY"
                              ? "SLA 2 Days"
                              : "SLA 5 Days"}
                          </p>
                        </Card>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Items Review */}
                <div className="space-y-3 pt-4 border-t border-white/5">
                  <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                    <ShoppingBag className="h-4.5 w-4.5 text-teal-400" />
                    <span>3. Review Store Items</span>
                  </h3>
                  <Card className="bg-slate-900/40 border-white/5 p-4 divide-y divide-white/5">
                    <div className="pb-2 text-xs text-teal-400 font-semibold">
                      Merchant storefront: {cart.store?.name}
                    </div>
                    {cart.items.map((item) => (
                      <div key={item.id} className="py-3 flex justify-between text-sm">
                        <div>
                          <span className="font-semibold text-white">{item.product.name}</span>
                          <span className="text-slate-500 text-xs ml-2">x{item.quantity}</span>
                        </div>
                        <span className="font-semibold text-slate-200">
                          {formatPrice(item.product.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </Card>
                </div>
              </div>

              {/* Payout & Calculation Panel */}
              <div className="lg:col-span-1">
                <Card className="bg-slate-900/40 border-white/5 p-6 space-y-6 sticky top-24">
                  <h3 className="font-bold text-white text-lg border-b border-white/5 pb-4">
                    Checkout Totals
                  </h3>

                  {/* Calculations breakdown */}
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between text-slate-400">
                      <span>Items Subtotal</span>
                      <span className="font-medium text-slate-200">{formatPrice(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Delivery Fee</span>
                      <span className="font-medium text-slate-200">{formatPrice(deliveryFee)}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>PPN Tax (12%)</span>
                      <span className="font-medium text-slate-200">{formatPrice(taxAmount)}</span>
                    </div>

                    <div className="flex justify-between text-white font-extrabold text-md border-t border-white/5 pt-4">
                      <span>Total Payout</span>
                      <span className="text-teal-400">{formatPrice(totalAmount)}</span>
                    </div>
                  </div>

                  {/* Wallet audit */}
                  <div className="border-t border-white/5 pt-6 space-y-4">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <Wallet className="h-3.5 w-3.5 text-teal-400" /> Wallet Balance
                      </span>
                      <span className={`font-bold ${hasSufficientFunds ? "text-teal-300" : "text-red-400"}`}>
                        {formatPrice(walletBalance || 0)}
                      </span>
                    </div>

                    {!hasSufficientFunds && (
                      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-xs text-red-400 flex items-start gap-2 leading-relaxed">
                        <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                        <div>
                          <strong>Insufficient wallet funds.</strong> Please top-up in the Wallet Panel before placing order.
                        </div>
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={handleCheckout}
                    disabled={checkoutLoading || !hasSufficientFunds || addresses.length === 0}
                    className="w-full bg-teal-500 hover:bg-teal-600 text-slate-950 font-extrabold py-6 text-md rounded-xl disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed"
                  >
                    {checkoutLoading ? "Processing Order..." : "Confirm & Pay Order"}
                  </Button>
                </Card>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
