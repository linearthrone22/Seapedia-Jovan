"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Star, MessageSquare, ArrowRight, Shield, Wallet, ShoppingBag, Truck, Check } from "lucide-react";
import api from "@/lib/api";
import { getUser } from "@/lib/auth";
import { toast } from "sonner";

interface Review {
  id: string;
  reviewerName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export default function Home() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewerName, setReviewerName] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchReviews();
    const user = getUser();
    if (user) {
      setReviewerName(user.username);
    }
  }, []);

  const fetchReviews = async () => {
    try {
      const res = await api.get("/reviews");
      setReviews(res.data);
    } catch (err) {
      console.error("Failed to fetch reviews", err);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewerName.trim() || !comment.trim()) {
      toast.error("Please fill in all fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post("/reviews", { reviewerName, rating, comment });
      toast.success("Thank you for your review!");
      setComment("");
      // Maintain name if logged in, otherwise reset
      const user = getUser();
      if (!user) setReviewerName("");
      fetchReviews();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to submit review.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-24 md:py-32 bg-slate-950 flex flex-col justify-center items-center text-center px-4">
        {/* Glow effect */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto space-y-6">
          <Badge className="bg-teal-500/10 text-teal-300 border-teal-500/20 px-3 py-1 text-xs uppercase tracking-wider font-semibold">
            v1.0 is Live
          </Badge>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white leading-none">
            The Complete Marketplace <br />
            <span className="bg-gradient-to-r from-blue-400 via-teal-300 to-indigo-400 bg-clip-text text-transparent">
              Engineered for the Sea
            </span>
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto font-light leading-relaxed">
            A secure, decentralized-feel multi-role experience connecting Buyers, Sellers, and Drivers with smart automated workflows, instant wallets, and 12% PPN compliance.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
            <Link href="/products">
              <Button size="lg" className="w-full bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 text-white font-semibold px-8 py-6 rounded-lg transition-transform hover:-translate-y-0.5 shadow-lg shadow-teal-500/10">
                Explore Marketplace <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/auth/register">
              <Button size="lg" variant="outline" className="w-full border-white/10 text-slate-200 hover:bg-white/5 hover:text-white px-8 py-6 rounded-lg">
                Join as Partner
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Role Feature Cards */}
      <section className="py-20 bg-slate-900/40 border-y border-white/5 px-4">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
              Choose Your Journey
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              Access custom-tailored dashboards and distinct functionalities based on your current active role.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Buyer Card */}
            <Card className="bg-slate-950/60 border-white/5 hover:border-teal-500/30 transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1">
              <CardHeader className="space-y-4">
                <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:bg-blue-500/20 transition-colors">
                  <ShoppingBag className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl text-white">Buyer Experience</CardTitle>
                <CardDescription className="text-slate-400">
                  Fund your wallet, manage multiple shipping addresses, build your cart, and checkout seamlessly with transparent PPN calculation.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-0 mt-auto">
                <ul className="space-y-2 text-sm text-slate-300">
                  <li className="flex items-center"><Check className="h-4 w-4 text-teal-400 mr-2" /> Single-store cart checkout</li>
                  <li className="flex items-center"><Check className="h-4 w-4 text-teal-400 mr-2" /> Stacking voucher/promo codes</li>
                  <li className="flex items-center"><Check className="h-4 w-4 text-teal-400 mr-2" /> Real-time wallet tracking</li>
                </ul>
                <Link href="/auth/register" className="block w-full">
                  <Button variant="ghost" className="w-full text-blue-400 hover:text-blue-300 hover:bg-white/5 justify-between px-0 font-medium">
                    Create Buyer Account <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Seller Card */}
            <Card className="bg-slate-950/60 border-white/5 hover:border-teal-500/30 transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1">
              <CardHeader className="space-y-4">
                <div className="w-12 h-12 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-400 group-hover:bg-teal-500/20 transition-colors">
                  <Wallet className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl text-white">Seller Dashboard</CardTitle>
                <CardDescription className="text-slate-400">
                  Establish a digital storefront, manage your catalog, process orders, and receive payouts directly to your store wallet upon delivery.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-0 mt-auto">
                <ul className="space-y-2 text-sm text-slate-300">
                  <li className="flex items-center"><Check className="h-4 w-4 text-teal-400 mr-2" /> Custom Store Name & Details</li>
                  <li className="flex items-center"><Check className="h-4 w-4 text-teal-400 mr-2" /> Product Inventory CRUD</li>
                  <li className="flex items-center"><Check className="h-4 w-4 text-teal-400 mr-2" /> Direct Order processing UI</li>
                </ul>
                <Link href="/auth/register" className="block w-full">
                  <Button variant="ghost" className="w-full text-teal-400 hover:text-teal-300 hover:bg-white/5 justify-between px-0 font-medium">
                    Register Store <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Driver Card */}
            <Card className="bg-slate-950/60 border-white/5 hover:border-teal-500/30 transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1">
              <CardHeader className="space-y-4">
                <div className="w-12 h-12 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500/20 transition-colors">
                  <Truck className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl text-white">Driver Operations</CardTitle>
                <CardDescription className="text-slate-400">
                  Accept available delivery orders, navigate from seller store to buyer address, and earn 70% of the delivery fee on completion.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-0 mt-auto">
                <ul className="space-y-2 text-sm text-slate-300">
                  <li className="flex items-center"><Check className="h-4 w-4 text-teal-400 mr-2" /> Real-time job acceptance board</li>
                  <li className="flex items-center"><Check className="h-4 w-4 text-teal-400 mr-2" /> 70% direct delivery payout</li>
                  <li className="flex items-center"><Check className="h-4 w-4 text-teal-400 mr-2" /> Instant order delivery flow</li>
                </ul>
                <Link href="/auth/register" className="block w-full">
                  <Button variant="ghost" className="w-full text-indigo-400 hover:text-indigo-300 hover:bg-white/5 justify-between px-0 font-medium">
                    Drive with SeaPedia <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section className="py-20 px-4 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Left Column: Review Form */}
        <div className="space-y-6 lg:col-span-1">
          <div className="space-y-3">
            <h2 className="text-3xl font-bold tracking-tight text-white">App Reviews</h2>
            <p className="text-slate-400">
              Your feedback shapes SeaPedia. Share your thoughts on our platform experience!
            </p>
          </div>

          <form onSubmit={handleSubmitReview} className="bg-slate-900/50 border border-white/5 rounded-xl p-6 space-y-4 backdrop-blur-sm">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-300">Reviewer Name</label>
              <Input
                placeholder="Enter your name"
                value={reviewerName}
                onChange={(e) => setReviewerName(e.target.value)}
                className="bg-slate-950 border-white/10 text-white focus:border-teal-500"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-300 block">Rating</label>
              <div className="flex space-x-1.5 pt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="focus:outline-none transition-transform active:scale-95"
                  >
                    <Star
                      className={`h-7 w-7 ${
                        star <= rating ? "text-amber-400 fill-amber-400" : "text-slate-600"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-300">Comment</label>
              <textarea
                placeholder="How was your experience?"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                className="w-full bg-slate-950 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-teal-500 transition-colors placeholder:text-slate-600 resize-none"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 text-white font-semibold"
            >
              {isSubmitting ? "Submitting..." : "Submit Review"}
            </Button>
          </form>
        </div>

        {/* Right Column: Review List */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-xl font-semibold text-slate-200 flex items-center space-x-2">
            <MessageSquare className="h-5 w-5 text-teal-400" />
            <span>Latest Feedback ({reviews.length})</span>
          </h3>

          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {reviews.length === 0 ? (
              <div className="text-center py-12 text-slate-600 border border-white/5 rounded-xl border-dashed">
                No reviews yet. Be the first to share your thoughts!
              </div>
            ) : (
              reviews.map((review) => (
                <div
                  key={review.id}
                  className="bg-slate-900/30 border border-white/5 rounded-xl p-5 space-y-3 hover:bg-slate-900/50 transition-all duration-200"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-slate-200">{review.reviewerName}</h4>
                    <div className="flex items-center space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${
                            star <= review.rating ? "text-amber-400 fill-amber-400" : "text-slate-800"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-slate-400 text-sm leading-relaxed">{review.comment}</p>
                  <div className="text-[10px] text-slate-600">
                    {new Date(review.createdAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

