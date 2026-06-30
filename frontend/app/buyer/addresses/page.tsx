"use client";

import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MapPin, Plus, Trash, Star, Home, Phone, User, Check, RefreshCw } from "lucide-react";
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

export default function BuyerAddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form Fields
  const [label, setLabel] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [phone, setPhone] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    setLoading(true);
    try {
      const res = await api.get("/buyer/addresses");
      setAddresses(res.data);
    } catch (err: any) {
      toast.error("Failed to load delivery addresses.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAddress = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!label || !recipientName || !phone || !addressLine || !city || !province || !postalCode) {
      toast.error("Please fill in all address parameters.");
      return;
    }

    setSubmitLoading(true);
    try {
      await api.post("/buyer/addresses", {
        label,
        recipientName,
        phone,
        addressLine,
        city,
        province,
        postalCode,
        isDefault,
      });

      toast.success("Address created successfully!");
      // Reset form
      setLabel("");
      setRecipientName("");
      setPhone("");
      setAddressLine("");
      setCity("");
      setProvince("");
      setPostalCode("");
      setIsDefault(false);
      setShowAddForm(false);
      fetchAddresses();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to save address.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this address?")) return;

    try {
      await api.delete(`/buyer/addresses/${id}`);
      toast.success("Address deleted successfully.");
      setAddresses(addresses.filter((a) => a.id !== id));
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to delete address.");
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await api.patch(`/buyer/addresses/${id}/default`);
      toast.success("Default address updated!");
      fetchAddresses();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to set default address.");
    }
  };

  return (
    <ProtectedRoute allowedRole="BUYER">
      <DashboardLayout role="BUYER">
        <div className="space-y-8">
          <div className="flex justify-between items-center border-b border-white/5 pb-6">
            <div>
              <h1 className="text-3xl font-extrabold text-white">Shipping Addresses</h1>
              <p className="text-slate-400">Configure shipping locations for checkout delivery routing.</p>
            </div>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchAddresses}
                className="border-white/10 text-slate-300 hover:bg-white/5"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => setShowAddForm(!showAddForm)}
                className="bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold"
              >
                {showAddForm ? "View Addresses" : <><Plus className="mr-1.5 h-4 w-4" /> Add Address</>}
              </Button>
            </div>
          </div>

          {showAddForm ? (
            // Add Address Form
            <div className="max-w-xl">
              <Card className="bg-slate-900/40 border-white/5">
                <CardHeader>
                  <CardTitle className="text-white">New Shipping Address</CardTitle>
                  <CardDescription className="text-slate-400">
                    Add new address information to receive package deliveries.
                  </CardDescription>
                </CardHeader>
                <form onSubmit={handleCreateAddress}>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      {/* Label */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300">Address Label</label>
                        <Input
                          placeholder="e.g. Home, Office"
                          value={label}
                          onChange={(e) => setLabel(e.target.value)}
                          className="bg-slate-950 border-white/10 text-white focus:border-teal-500"
                          required
                        />
                      </div>
                      {/* Recipient Name */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300">Recipient Name</label>
                        <Input
                          placeholder="e.g. John Doe"
                          value={recipientName}
                          onChange={(e) => setRecipientName(e.target.value)}
                          className="bg-slate-950 border-white/10 text-white focus:border-teal-500"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Phone */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300">Phone Number</label>
                        <Input
                          placeholder="e.g. 08123456789"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="bg-slate-950 border-white/10 text-white focus:border-teal-500"
                          required
                        />
                      </div>
                      {/* Postal Code */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300">Postal Code</label>
                        <Input
                          placeholder="e.g. 10110"
                          value={postalCode}
                          onChange={(e) => setPostalCode(e.target.value)}
                          className="bg-slate-950 border-white/10 text-white focus:border-teal-500"
                          required
                        />
                      </div>
                    </div>

                    {/* Address Line */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300">Street Address</label>
                      <Input
                        placeholder="e.g. Sudirman St. No. 123"
                        value={addressLine}
                        onChange={(e) => setAddressLine(e.target.value)}
                        className="bg-slate-950 border-white/10 text-white focus:border-teal-500"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* City */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300">City</label>
                        <Input
                          placeholder="e.g. Central Jakarta"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="bg-slate-950 border-white/10 text-white focus:border-teal-500"
                          required
                        />
                      </div>
                      {/* Province */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300">Province</label>
                        <Input
                          placeholder="e.g. DKI Jakarta"
                          value={province}
                          onChange={(e) => setProvince(e.target.value)}
                          className="bg-slate-950 border-white/10 text-white focus:border-teal-500"
                          required
                        />
                      </div>
                    </div>

                    {/* Checkbox Default */}
                    <div className="flex items-center space-x-2 pt-2">
                      <input
                        type="checkbox"
                        id="isDefault"
                        checked={isDefault}
                        onChange={(e) => setIsDefault(e.target.checked)}
                        className="h-4.5 w-4.5 rounded border-white/10 bg-slate-950 text-teal-500 focus:ring-teal-500"
                      />
                      <label htmlFor="isDefault" className="text-sm font-medium text-slate-300 select-none cursor-pointer">
                        Set as default shipping address
                      </label>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end gap-3 border-t border-white/5 p-6 bg-slate-950/20">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setShowAddForm(false)}
                      className="text-slate-400 hover:text-white"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={submitLoading}
                      className="bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold"
                    >
                      {submitLoading ? "Saving..." : "Save Address"}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </div>
          ) : (
            // Addresses List
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {loading ? (
                <div className="col-span-2 flex justify-center py-20">
                  <div className="w-8 h-8 border-t-2 border-teal-400 rounded-full animate-spin" />
                </div>
              ) : addresses.length === 0 ? (
                <Card className="col-span-2 bg-slate-900/40 border-white/5 border-dashed p-16 text-center space-y-6">
                  <div className="w-16 h-16 rounded-full bg-slate-950/60 flex items-center justify-center text-slate-500 mx-auto border border-white/5">
                    <MapPin className="h-8 w-8" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-xl font-bold text-white">No Addresses Configured</h2>
                    <p className="text-slate-400 text-sm max-w-md mx-auto">
                      You haven&apos;t added any shipping addresses to your account. Set one up to enable checkout ordering.
                    </p>
                  </div>
                  <Button
                    onClick={() => setShowAddForm(true)}
                    className="bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold"
                  >
                    <Plus className="mr-2 h-4 w-4" /> Create Shipping Address
                  </Button>
                </Card>
              ) : (
                addresses.map((addr) => (
                  <Card
                    key={addr.id}
                    className={`bg-slate-900/40 border-white/5 p-6 flex flex-col justify-between hover:border-white/10 transition-colors relative ${
                      addr.isDefault ? "border-teal-500/30" : ""
                    }`}
                  >
                    {addr.isDefault && (
                      <span className="absolute top-4 right-4 bg-teal-500/10 text-teal-300 border border-teal-500/20 px-2 py-0.5 rounded text-[10px] font-extrabold flex items-center gap-1 uppercase tracking-wider">
                        <Check className="h-3 w-3" /> Default
                      </span>
                    )}

                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Home className="h-4 w-4 text-teal-400" />
                        <h3 className="font-bold text-white text-md">{addr.label}</h3>
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-400">
                        <div className="flex items-center space-x-1.5">
                          <User className="h-3.5 w-3.5 text-slate-500" />
                          <span className="font-semibold text-slate-200">{addr.recipientName}</span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                          <Phone className="h-3.5 w-3.5 text-slate-500" />
                          <span>{addr.phone}</span>
                        </div>
                        <div className="mt-2 border-t border-white/5 pt-2 leading-relaxed">
                          {addr.addressLine}, {addr.city}, {addr.province}, {addr.postalCode}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 mt-6 border-t border-white/5 pt-4">
                      {!addr.isDefault && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSetDefault(addr.id)}
                          className="flex-1 text-teal-400 hover:bg-white/5 font-semibold text-xs"
                        >
                          <Star className="mr-1.5 h-3.5 w-3.5" /> Make Default
                        </Button>
                      )}
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(addr.id)}
                        className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs py-1"
                      >
                        <Trash className="mr-1.5 h-3.5 w-3.5" /> Delete
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
