"use client";

import { Clock, Lock, LogOut, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMailbox } from "./_context/MailboxContext";

const aliasEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function MyMailboxPage() {
  const { session, loading, login, logout } = useMailbox();
  const router = useRouter();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isRequestingReset, setIsRequestingReset] = useState(false);
  const [isForgotDialogOpen, setIsForgotDialogOpen] = useState(false);
  const [loginData, setLoginData] = useState({
    aliasEmail: "",
    password: "",
  });
  const [forgotAliasEmail, setForgotAliasEmail] = useState("");

  useEffect(() => {
    if (!loading && session) {
      // If already logged in, redirect to inbox
      router.push("/my-mailbox/inbox");
    }
  }, [loading, session, router]);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!loginData.aliasEmail || !loginData.password) {
      toast.error("Please enter alias email and mailbox password");
      return;
    }

    const normalizedAliasEmail = loginData.aliasEmail.trim().toLowerCase();
    if (!aliasEmailRegex.test(normalizedAliasEmail)) {
      toast.error("Alias email is invalid");
      return;
    }

    setIsLoggingIn(true);

    try {
      await login(normalizedAliasEmail, loginData.password);
      setLoginData({ aliasEmail: "", password: "" });
    } catch {
      // Error is already toasted in the login function
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleForgotPassword = async (event) => {
    event.preventDefault();

    const normalizedAliasEmail = forgotAliasEmail.trim().toLowerCase();

    if (!aliasEmailRegex.test(normalizedAliasEmail)) {
      toast.error("Alias email is invalid");
      return;
    }

    setIsRequestingReset(true);

    try {
      const response = await fetch("/api/mailbox-auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ aliasEmail: normalizedAliasEmail }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to request mailbox password reset",
        );
      }

      toast.success(
        data.message ||
        "If the alias exists, reset instructions were sent to the connected personal email.",
      );
      setIsForgotDialogOpen(false);
      setForgotAliasEmail("");
    } catch (error) {
      console.error("Error requesting mailbox password reset:", error);
      toast.error(error.message || "Failed to request mailbox password reset");
    } finally {
      setIsRequestingReset(false);
    }
  };

  const getSessionTimeRemaining = () => {
    if (!session?.expiresAt) return "";

    const now = new Date();
    const expires = new Date(session.expiresAt);
    const diffMinutes = Math.floor((expires - now) / (1000 * 60));

    if (diffMinutes <= 0) return "Expired";
    if (diffMinutes < 60) return `${diffMinutes} min`;

    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    return `${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (session) {
    // Render session info while redirecting
    return (
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {session.mailbox.name}
              </h1>
              <p className="text-gray-600 mt-2">Redirecting to inbox...</p>
            </div>

            <div className="flex gap-2 items-center">
              <div className="text-sm text-gray-600 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Session expires in {getSessionTimeRemaining()}
              </div>
              <Button variant="outline" onClick={logout}>
                <LogOut className="w-4 h-4 mr-2" />
                Exit Mailbox
              </Button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="py-12 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Mailbox Access
            </CardTitle>
            <CardDescription>
              Login using your alias email and mailbox password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="aliasEmail">Alias Email *</Label>
                <Input
                  id="aliasEmail"
                  type="email"
                  placeholder="name@yourdomain.com"
                  value={loginData.aliasEmail}
                  onChange={(e) =>
                    setLoginData({ ...loginData, aliasEmail: e.target.value })
                  }
                  disabled={isLoggingIn}
                  autoComplete="email"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mailbox Password *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter mailbox password"
                  value={loginData.password}
                  onChange={(e) =>
                    setLoginData({ ...loginData, password: e.target.value })
                  }
                  disabled={isLoggingIn}
                  autoComplete="current-password"
                  required
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <p className="text-xs text-blue-800">
                  Mailbox sessions expire after 1 hour. After login, you'll be
                  redirected to your inbox.
                </p>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                <Button
                  type="button"
                  variant="ghost"
                  className="px-0 text-sm text-blue-700 hover:text-blue-800"
                  onClick={() => {
                    setForgotAliasEmail(loginData.aliasEmail);
                    setIsForgotDialogOpen(true);
                  }}
                  disabled={isLoggingIn}
                >
                  Forgot password?
                </Button>
                <Button type="submit" disabled={isLoggingIn}>
                  {isLoggingIn ? "Logging in..." : "Access Mailbox"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isForgotDialogOpen} onOpenChange={setIsForgotDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Reset Mailbox Password
            </DialogTitle>
            <DialogDescription>
              Enter your alias email and we'll send a secure reset link to the
              connected personal email.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="forgotAliasEmail">Alias Email *</Label>
              <Input
                id="forgotAliasEmail"
                type="email"
                placeholder="name@yourdomain.com"
                value={forgotAliasEmail}
                onChange={(event) => setForgotAliasEmail(event.target.value)}
                disabled={isRequestingReset}
                autoComplete="email"
                required
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsForgotDialogOpen(false)}
                disabled={isRequestingReset}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isRequestingReset}>
                {isRequestingReset ? "Sending..." : "Send Reset Link"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
