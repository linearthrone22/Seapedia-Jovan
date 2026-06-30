"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getUser, clearAuth, AuthUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Menu, X, LogOut, User, LayoutDashboard, Shuffle } from "lucide-react";
import api from "@/lib/api";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Sync user state on mount and path changes
    setUser(getUser());
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (err) {
      console.error("Logout error", err);
    } finally {
      clearAuth();
      setUser(null);
      router.push("/");
    }
  };

  const getDashboardLink = (role?: string) => {
    if (!role) return "/auth/select-role";
    return `/${role.toLowerCase()}/dashboard`;
  };

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/products", label: "Products" },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-slate-950/70 backdrop-blur-md text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-xl font-bold tracking-wider bg-gradient-to-r from-blue-400 via-teal-300 to-indigo-400 bg-clip-text text-transparent">
                SEAPEDIA
              </span>
            </Link>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors hover:text-teal-400 ${
                  pathname === link.href ? "text-teal-300 font-semibold" : "text-slate-300"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop Auth Controls */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 bg-slate-900/60 px-3 py-1.5 rounded-full border border-white/5">
                  <User className="h-4 w-4 text-teal-400" />
                  <span className="text-sm font-medium text-slate-200">{user.username}</span>
                  {user.activeRole && (
                    <Badge className="bg-teal-500/20 text-teal-300 border-teal-500/30 font-semibold text-[10px] px-2 py-0">
                      {user.activeRole}
                    </Badge>
                  )}
                </div>

                {user.roles.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-slate-300 hover:text-white hover:bg-white/5"
                    onClick={() => router.push("/auth/select-role")}
                  >
                    <Shuffle className="mr-1.5 h-3.5 w-3.5 text-teal-400" /> Switch Role
                  </Button>
                )}

                <Button
                  size="sm"
                  className="bg-teal-500 hover:bg-teal-600 text-slate-950 font-semibold transition-all duration-200"
                  onClick={() => router.push(getDashboardLink(user.activeRole))}
                >
                  <LayoutDashboard className="mr-1.5 h-4 w-4" /> Dashboard
                </Button>

                <Button
                  variant="destructive"
                  size="sm"
                  className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Button
                  variant="ghost"
                  className="text-slate-300 hover:text-white hover:bg-white/5"
                  onClick={() => router.push("/auth/login")}
                >
                  Login
                </Button>
                <Button
                  className="bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 text-white font-semibold shadow-md shadow-teal-500/10"
                  onClick={() => router.push("/auth/register")}
                >
                  Register
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center rounded-md p-2 text-slate-400 hover:bg-white/5 hover:text-white focus:outline-none"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden border-t border-white/5 bg-slate-950 px-2 pt-2 pb-4 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className={`block rounded-md px-3 py-2 text-base font-medium transition-colors hover:bg-white/5 hover:text-teal-400 ${
                pathname === link.href ? "text-teal-300 bg-white/5" : "text-slate-300"
              }`}
            >
              {link.label}
            </Link>
          ))}

          <div className="border-t border-white/5 my-2 pt-2">
            {user ? (
              <div className="px-3 space-y-3">
                <div className="flex items-center justify-between py-1">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-teal-400" />
                    <span className="text-sm font-medium text-slate-200">{user.username}</span>
                  </div>
                  {user.activeRole && (
                    <Badge className="bg-teal-500/20 text-teal-300 border-teal-500/30">
                      {user.activeRole}
                    </Badge>
                  )}
                </div>

                {user.roles.length > 1 && (
                  <Button
                    variant="outline"
                    className="w-full text-slate-300 border-white/10 hover:bg-white/5 hover:text-white"
                    onClick={() => {
                      setIsOpen(false);
                      router.push("/auth/select-role");
                    }}
                  >
                    <Shuffle className="mr-2 h-4 w-4 text-teal-400" /> Switch Role
                  </Button>
                )}

                <Button
                  className="w-full bg-teal-500 hover:bg-teal-600 text-slate-950 font-semibold"
                  onClick={() => {
                    setIsOpen(false);
                    router.push(getDashboardLink(user.activeRole));
                  }}
                >
                  <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
                </Button>

                <Button
                  variant="destructive"
                  className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20"
                  onClick={() => {
                    setIsOpen(false);
                    handleLogout();
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" /> Logout
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 px-3 pt-2">
                <Button
                  variant="outline"
                  className="text-slate-300 border-white/10 hover:bg-white/5 hover:text-white"
                  onClick={() => {
                    setIsOpen(false);
                    router.push("/auth/login");
                  }}
                >
                  Login
                </Button>
                <Button
                  className="bg-gradient-to-r from-blue-500 to-teal-500 text-white font-semibold"
                  onClick={() => {
                    setIsOpen(false);
                    router.push("/auth/register");
                  }}
                >
                  Register
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
