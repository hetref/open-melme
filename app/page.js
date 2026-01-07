"use client"

import GoogleAuthButton from "@/components/GoogleAuthButton";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import Loading from "@/components/Loading";
import PasskeyButton from "@/components/PasskeyButton";

export default function Home() {
  const { data: session, isPending: loading } = authClient.useSession();

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-4 text-gray-900">Welcome to Seller Bord</h1>
          <p className="text-xl text-gray-600 mb-12">Your central hub for managing sales and inventory.</p>

          {
            session ? (
              <div className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">Welcome back, {session.user.name}!</h2>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/profile">
                    <Button>
                      Go to Profile
                    </Button>
                  </Link>
                  <Link href="/domains">
                    <Button variant="outline">
                      Go to Domains
                    </Button>
                  </Link>
                  <Button variant="destructive" onClick={() => authClient.signOut()} className="w-full sm:w-auto">
                    Sign Out
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
                <div className="space-y-4">
                  <div className="flex flex-col gap-3">
                    <Link href="/login">
                      <Button className="w-full" size="lg">Login</Button>
                    </Link>
                    <Link href="/register">
                      <Button variant="outline" className="w-full" size="lg">Register</Button>
                    </Link>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-gray-500">Or continue with</span>
                    </div>
                  </div>
                  <GoogleAuthButton />
                  <PasskeyButton />
                </div>
                <div className="pt-4 border-t space-y-2">
                  <Link href="/forget-password" className="text-sm text-gray-600 hover:text-gray-900 block">
                    Forgot your password?
                  </Link>
                </div>
              </div>
            )
          }
        </div>
      </div>
    </div>
  );
}
