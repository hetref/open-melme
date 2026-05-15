"use client"

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { authClient } from '@/lib/auth-client'
import { Monitor, Smartphone, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'
import { UAParser } from 'ua-parser-js'

const SessionManagement = ({ sessions, currentSessionToken }) => {
  const router = useRouter()
  const otherSessions = sessions.filter(s => s.token !== currentSessionToken)
  const currentSession = sessions.find(s => s.token === currentSessionToken)
  const [isOpen, setIsOpen] = useState(false)

  function revokeOtherSessions() {
    const confirm = window.confirm(
      "Are you sure you want to revoke all other sessions? This action cannot be undone."
    )
    if (!confirm) return
    return authClient.revokeOtherSessions(undefined, {
      onSuccess: () => {
        router.refresh()
      },
    })
  }

  return (
    <div className="space-y-6">
      {currentSessionToken && (
        <SessionCard session={currentSession} isCurrentSession />
      )}
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-medium text-foreground">Other Active Sessions</h3>
          <div className="flex items-center gap-2">
            {otherSessions.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={revokeOtherSessions}
              >
                Revoke Other Sessions
              </Button>
            )}
            {otherSessions.length > 0 && (
              <CollapsibleTrigger asChild>
                <Button variant="outline" size="sm">
                  {isOpen ? "Hide" : `Show ${otherSessions.length}`}
                </Button>
              </CollapsibleTrigger>
            )}
          </div>
        </div>

        <CollapsibleContent className="mt-4">
          {otherSessions.length === 0 ? (
            <Card className="bg-surface border border-border">
              <CardContent className="py-8 text-center text-muted-foreground">
                No other active sessions
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {otherSessions.map(session => (
                <SessionCard key={session.id} session={session} />
              ))}
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}

export default SessionManagement

function SessionCard({
  session,
  isCurrentSession = false,
}) {
  const router = useRouter()
  const userAgentInfo = session.userAgent ? UAParser(session.userAgent) : null

  function getBrowserInformation() {
    if (userAgentInfo == null) return "Unknown Device"
    if (userAgentInfo.browser.name == null && userAgentInfo.os.name == null) {
      return "Unknown Device"
    }

    if (userAgentInfo.browser.name == null) return userAgentInfo.os.name
    if (userAgentInfo.os.name == null) return userAgentInfo.browser.name

    return `${userAgentInfo.browser.name}, ${userAgentInfo.os.name}`
  }

  function formatDate(date) {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(date))
  }

  function revokeSession() {
    const confirm = window.confirm(
      "Are you sure you want to revoke this session? This action cannot be undone."
    )
    if (!confirm) return
    return authClient.revokeSession(
      { token: session.token },
      { onSuccess: () => router.refresh() }
    )
  }

  return (
    <Card className="bg-surface border border-border">
      <CardHeader className="flex justify-between">
        <CardTitle className="text-base text-foreground">
          {getBrowserInformation()}
        </CardTitle>
        {isCurrentSession && <Badge>Current Session</Badge>}
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {userAgentInfo?.device.type === "mobile" ? (
              <Smartphone />
            ) : (
              <Monitor />
            )}
            <div>
              <p className="text-sm text-muted-foreground">
                Created: {formatDate(session.createdAt)}
              </p>
              <p className="text-sm text-muted-foreground">
                Expires: {formatDate(session.expiresAt)}
              </p>
            </div>
          </div>
          {!isCurrentSession && (
            <Button
              variant="destructive"
              size="sm"
              onClick={revokeSession}
            >
              <Trash2 />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}