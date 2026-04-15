"use client";

import { Lock } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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

export default function MailboxResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [aliasEmail, setAliasEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isValidating, setIsValidating] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInvalidDialogOpen, setIsInvalidDialogOpen] = useState(false);

  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);
  const aliasFromQuery = useMemo(
    () => searchParams.get("alias") || "",
    [searchParams],
  );

  useEffect(() => {
    let cancelled = false;

    const validateToken = async () => {
      if (!token || !aliasFromQuery) {
        if (!cancelled) {
          setIsInvalidDialogOpen(true);
          setIsValidating(false);
        }
        return;
      }

      try {
        const params = new URLSearchParams({
          token,
          alias: aliasFromQuery,
        });

        const response = await fetch(
          `/api/mailbox-auth/reset-password/validate?${params.toString()}`,
        );

        if (!response.ok) {
          throw new Error("Invalid reset link");
        }

        const data = await response.json();

        if (!cancelled) {
          setAliasEmail((data.aliasEmail || aliasFromQuery).toLowerCase());
          setIsValidating(false);
        }
      } catch {
        if (!cancelled) {
          setIsInvalidDialogOpen(true);
          setIsValidating(false);
        }
      }
    };

    validateToken();

    return () => {
      cancelled = true;
    };
  }, [aliasFromQuery, token]);

  useEffect(() => {
    if (!isInvalidDialogOpen) {
      return undefined;
    }

    const timeoutId = setTimeout(() => {
      router.replace("/my-mailbox");
    }, 2500);

    return () => clearTimeout(timeoutId);
  }, [isInvalidDialogOpen, router]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!aliasEmail || !token) {
      setIsInvalidDialogOpen(true);
      return;
    }

    if (!newPassword || newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/mailbox-auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          aliasEmail,
          token,
          newPassword,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Failed to reset mailbox password");
      }

      toast.success(
        "Password reset successful. Please login with your new password.",
      );
      router.replace("/my-mailbox");
    } catch (error) {
      toast.error(error.message || "Failed to reset mailbox password");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Reset Mailbox Password
          </CardTitle>
          <CardDescription>
            Set a new mailbox password for your alias.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isValidating ? (
            <div className="flex items-center justify-center py-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="aliasEmail">Alias Email</Label>
                <Input
                  id="aliasEmail"
                  type="email"
                  value={aliasEmail}
                  readOnly
                  disabled
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">New Mailbox Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="At least 8 characters"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  disabled={isSubmitting}
                  autoComplete="new-password"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  disabled={isSubmitting}
                  autoComplete="new-password"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/my-mailbox")}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Resetting..." : "Reset Password"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={isInvalidDialogOpen}
        onOpenChange={(open) => {
          setIsInvalidDialogOpen(open);
          if (!open) {
            router.replace("/my-mailbox");
          }
        }}
      >
        <DialogContent className="max-w-md" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Invalid Reset Link</DialogTitle>
            <DialogDescription>
              This password reset link is missing or invalid. You will be
              redirected to mailbox login.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => router.replace("/my-mailbox")}>
              Go to Mailbox Login
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
