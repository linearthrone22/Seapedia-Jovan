"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, User, Mail, Lock, Shield } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

type RoleOption = "BUYER" | "SELLER" | "DRIVER";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<RoleOption[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRoleToggle = (role: RoleOption) => {
    if (selectedRoles.includes(role)) {
      setSelectedRoles(selectedRoles.filter((r) => r !== role));
    } else {
      setSelectedRoles([...selectedRoles, role]);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (username.length < 3) {
      toast.error("Username must be at least 3 characters long.");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    if (selectedRoles.length === 0) {
      toast.error("Please select at least one role.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/register", {
        username,
        email,
        password,
        roles: selectedRoles,
      });

      toast.success("Registration successful! Please login.");
      router.push("/auth/login");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-grow flex items-center justify-center py-16 px-4 bg-slate-950 relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-teal-500/5 rounded-full blur-[80px] pointer-events-none" />

      <Card className="w-full max-w-md bg-slate-900/60 border-white/5 backdrop-blur-md shadow-2xl relative z-10">
        <CardHeader className="space-y-1.5 text-center">
          <CardTitle className="text-2xl font-bold tracking-tight text-white">Create Partner Account</CardTitle>
          <CardDescription className="text-slate-400">
            Join SeaPedia by setting up your credentials and platform roles.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleRegister}>
          <CardContent className="space-y-4">
            {/* Username */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                  placeholder="johndoe"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-9 bg-slate-950 border-white/10 text-white focus:border-teal-500"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                  type="email"
                  placeholder="john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 bg-slate-950 border-white/10 text-white focus:border-teal-500"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 pr-10 bg-slate-950 border-white/10 text-white focus:border-teal-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-9 pr-10 bg-slate-950 border-white/10 text-white focus:border-teal-500"
                  required
                />
              </div>
            </div>

            {/* Select Roles */}
            <div className="space-y-2 border-t border-white/5 pt-4">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-2">
                <Shield className="h-3.5 w-3.5 text-teal-400" /> Choose platform roles (Select multiple if desired)
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(["BUYER", "SELLER", "DRIVER"] as RoleOption[]).map((role) => {
                  const isSelected = selectedRoles.includes(role);
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => handleRoleToggle(role)}
                      className={`py-3 px-2 rounded-lg border text-xs font-bold transition-all duration-200 ${
                        isSelected
                          ? "bg-teal-500/20 text-teal-300 border-teal-500/50 shadow-md shadow-teal-500/5"
                          : "bg-slate-950/40 border-white/10 text-slate-400 hover:border-white/20 hover:text-white"
                      }`}
                    >
                      {role}
                    </button>
                  );
                })}
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4 p-6 border-t border-white/5 bg-slate-950/20">
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 text-white font-bold"
            >
              {loading ? "Registering..." : "Create Account"}
            </Button>
            <div className="text-center text-xs text-slate-500">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-teal-400 hover:underline">
                Login here
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
