import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full border-t border-white/5 bg-slate-950 text-slate-400 py-8 mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col items-center md:items-start">
            <span className="text-md font-bold tracking-wider bg-gradient-to-r from-blue-400 to-teal-300 bg-clip-text text-transparent mb-1">
              SEAPEDIA
            </span>
            <p className="text-xs text-slate-500">
              Modern Multi-Role Marketplace Platform. Built for the Sea.
            </p>
          </div>
          <div className="flex space-x-6 text-sm">
            <Link href="/" className="hover:text-teal-400 transition-colors">
              Home
            </Link>
            <Link href="/products" className="hover:text-teal-400 transition-colors">
              Products
            </Link>
            <Link href="/reviews" className="hover:text-teal-400 transition-colors">
              Reviews
            </Link>
          </div>
          <div className="text-xs text-slate-600">
            &copy; {new Date().getFullYear()} SeaPedia Jovan. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
