"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getUser, setAuth, AuthUser } from "@/lib/auth";
import { ShoppingBag, Store, Truck, Shield } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

type RoleType = "BUYER" | "SELLER" | "DRIVER" | "ADMIN";

interface RoleMetadata {
  title: string;
  desc: string;
  icon: any;
  color: string;
}

const ROLE_DETAILS: Record<RoleType, RoleMetadata> = {
  BUYER: {
    title: "Buyer Profile",
    desc: "Shop items, deposit funds, check orders.",
    icon: ShoppingBag,
    color: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  },
  SELLER: {
    title: "Seller Dashboard",
    desc: "Manage products, process orders, check income.",
    icon: Store,
    color: "text-teal-400 bg-teal-500/10 border-teal-500/20",
  },
  DRIVER: {
    title: "Driver Terminal",
    desc: "Claim delivery jobs, map routes, earn fees.",
    icon: Truck,
    color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
  },
  ADMIN: {
    title: "Platform Admin",
    desc: "Monitor metrics, override time simulation, manage vouchers.",
    icon: Shield,
    color: "text-red-400 bg-red-500/10 border-red-500/20",
  },
};

export default function SelectRolePage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loadingRole, setLoadingRole] = useState<string | null>(null);

  useEffect(() => {
    const activeUser = getUser();
    if (!activeUser) {
      toast.error("Please login to access role selection.");
      router.push("/auth/login");
    } else {
      setUser(activeUser);
    }
  }, [router]);

  const handleSelectRole = async (role: string) => {
    setLoadingRole(role);
    try {
      const res = await api.post("/auth/select-role", { role });
      const { token, activeRole } = res.data;

      if (user) {
        const updatedUser = { ...user, activeRole };
        setAuth(token, updatedUser);
        toast.success(`Session activated as ${activeRole}`);
        router.push(`/${activeRole.toLowerCase()}/dashboard`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to activate role.");
    } finally {
      setLoadingRole(null);
    }
  };

  if (!user) return null;

  return (
    <div className="flex-grow flex items-center justify-center py-20 px-4 bg-slate-950 relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-teal-500/5 rounded-full blur-[90px] pointer-events-none" />

      <div className="max-w-2xl w-full space-y-8 relative z-10">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Select Active Profile</h1>
          <p className="text-slate-400 max-w-md mx-auto">
            You hold multiple memberships on SeaPedia. Choose which session to initialize.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {user.roles.map((roleStr) => {
            const role = roleStr as RoleType;
            const meta = ROLE_DETAILS[role] || {
              title: role,
              desc: "Access custom platform functionality.",
              icon: Shield,
              color: "text-slate-400 bg-slate-500/10 border-slate-500/20",
            };
            const Icon = meta.icon;

            return (
              <Card
                key={role}
                onClick={() => !loadingRole && handleSelectRole(role)}
                className={`bg-slate-900/50 border-white/5 hover:border-teal-500/30 cursor-pointer hover:bg-slate-900/80 transition-all duration-300 group ${
                  loadingRole === role ? "opacity-50" : ""
                }`}
              >
                <CardHeader className="space-y-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center border transition-colors ${meta.color} group-hover:scale-105 duration-300`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-white font-bold">{meta.title}</CardTitle>
                    <CardDescription className="text-slate-400 text-sm mt-1">
                      {meta.desc}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button
                    disabled={!!loadingRole}
                    className="w-full bg-slate-950 hover:bg-slate-800 text-slate-300 border border-white/5 font-semibold group-hover:bg-teal-500 group-hover:text-slate-950 transition-colors"
                  >
                    {loadingRole === role ? "Activating..." : "Select Profile"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
