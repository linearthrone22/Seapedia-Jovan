"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getUser, AuthUser } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingBag,
  Store,
  Truck,
  Shield,
  LayoutDashboard,
  Wallet,
  MapPin,
  Tag,
  Clock,
  History,
  TrendingUp,
  Package,
  Users
} from "lucide-react";

interface SidebarItem {
  href: string;
  label: string;
  icon: any;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: "BUYER" | "SELLER" | "DRIVER" | "ADMIN";
}

const SIDEBAR_LINKS: Record<string, SidebarItem[]> = {
  BUYER: [
    { href: "/buyer/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/buyer/cart", label: "My Cart", icon: ShoppingBag },
    { href: "/buyer/wallet", label: "Wallet & Topup", icon: Wallet },
    { href: "/buyer/addresses", label: "Shipping Addresses", icon: MapPin },
    { href: "/buyer/orders", label: "Order History", icon: History },
  ],
  SELLER: [
    { href: "/seller/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/seller/store", label: "Store Settings", icon: Store },
    { href: "/seller/products", label: "Products Catalog", icon: Package },
    { href: "/seller/orders", label: "Incoming Orders", icon: ShoppingBag },
    { href: "/seller/reports", label: "Sales Reports", icon: TrendingUp },
  ],
  DRIVER: [
    { href: "/driver/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/driver/jobs", label: "Available Jobs", icon: Truck },
    { href: "/driver/history", label: "Completed Deliveries", icon: History },
    { href: "/driver/earnings", label: "Earnings Stats", icon: Wallet },
  ],
  ADMIN: [
    { href: "/admin/dashboard", label: "System Overview", icon: LayoutDashboard },
    { href: "/admin/time-simulation", label: "Time Simulation", icon: Clock },
    { href: "/admin/vouchers", label: "Vouchers & Promos", icon: Tag },
    { href: "/admin/users", label: "Users List", icon: Users },
    { href: "/admin/stores", label: "Stores Registry", icon: Store },
    { href: "/admin/products", label: "Products DB", icon: Package },
    { href: "/admin/orders", label: "All Orders", icon: ShoppingBag },
    { href: "/admin/delivery-jobs", label: "Delivery Jobs", icon: Truck },
  ],
};

export default function DashboardLayout({ children, role }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    setUser(getUser());
  }, []);

  const links = SIDEBAR_LINKS[role] || [];

  return (
    <div className="flex-grow flex flex-col md:flex-row bg-slate-950 text-slate-100 min-h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900/50 border-r border-white/5 p-6 flex flex-col justify-between shrink-0">
        <div className="space-y-6">
          <div className="space-y-1.5 pb-4 border-b border-white/5">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
              Workspace Profile
            </h2>
            <div className="flex items-center space-x-2 pt-1">
              <span className="text-sm font-bold text-white leading-none">
                {user?.username || "Loading..."}
              </span>
              <Badge className="bg-teal-500/10 text-teal-300 border-teal-500/20 font-bold text-[9px] px-1.5 py-0">
                {role}
              </Badge>
            </div>
          </div>

          <nav className="space-y-1">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? "bg-teal-500/10 text-teal-300 border-l-2 border-teal-400 pl-2"
                      : "text-slate-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon className="h-4.5 w-4.5" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="pt-6 border-t border-white/5 text-xs text-slate-500">
          Status: <span className="text-teal-400 font-semibold">Active Session</span>
        </div>
      </aside>

      {/* Workspace Panel */}
      <section className="flex-grow p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        {children}
      </section>
    </div>
  );
}
