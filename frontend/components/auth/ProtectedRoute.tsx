"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUser, isLoggedIn } from "@/lib/auth";
import { toast } from "sonner";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRole: "BUYER" | "SELLER" | "DRIVER" | "ADMIN";
}

export default function ProtectedRoute({ children, allowedRole }: ProtectedRouteProps) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) {
      toast.error("Please login to access this area.");
      router.push("/auth/login");
      return;
    }

    const user = getUser();
    if (!user) {
      toast.error("User details missing. Please login again.");
      router.push("/auth/login");
      return;
    }

    if (user.roles.includes("ADMIN") && allowedRole === "ADMIN") {
      setAuthorized(true);
      return;
    }

    if (user.activeRole !== allowedRole) {
      toast.error(`Access denied. Active role "${allowedRole}" required.`);
      if (user.roles.length > 1) {
        router.push("/auth/select-role");
      } else {
        router.push(`/${user.roles[0].toLowerCase()}/dashboard`);
      }
      return;
    }

    setAuthorized(true);
  }, [router, allowedRole]);

  if (!authorized) {
    return (
      <div className="flex-grow flex items-center justify-center bg-slate-950 text-slate-400">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-t-2 border-teal-400 border-solid rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold">Authorizing workspace session...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
