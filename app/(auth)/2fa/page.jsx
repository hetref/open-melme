import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import TotpForm from "./_components/TotpForm"
import BackupCodeTab from "./_components/BackupCodeTab"

export default async function TwoFactorPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (session != null) return redirect("/")

  return (
    <div className="w-full max-w-[420px] relative">
      <Card className="w-full bg-surface border border-border rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04),0_4px_24px_rgba(0,0,0,0.06)]">
        <CardHeader className="text-center pb-4">
          <CardTitle className="font-[var(--font-display)] text-2xl font-bold text-foreground">
            Two-Factor Authentication
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          <Tabs defaultValue="totp">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="totp">Authenticator</TabsTrigger>
              <TabsTrigger value="backup">Backup Code</TabsTrigger>
            </TabsList>

            <TabsContent value="totp">
              <TotpForm />
            </TabsContent>

            <TabsContent value="backup">
              <BackupCodeTab />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}