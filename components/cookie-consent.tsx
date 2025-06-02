"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Cookie, X } from "lucide-react"

export function CookieConsent() {
  const [showConsent, setShowConsent] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent")
    if (!consent) {
      setShowConsent(true)
    }
  }, [])

  const acceptCookies = () => {
    localStorage.setItem("cookie-consent", "accepted")
    setShowConsent(false)
  }

  const declineCookies = () => {
    localStorage.setItem("cookie-consent", "declined")
    setShowConsent(false)
  }

  if (!showConsent) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-md">
      <Card className="glass-effect border-white/20 shadow-2xl">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Cookie className="h-5 w-5 text-yellow-400 mt-1 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-white mb-2">Cookie Consent</h3>
              <p className="text-sm text-gray-300 mb-4">
                We use cookies to enhance your browsing experience and analyze our traffic. By clicking "Accept", you
                consent to our use of cookies.
              </p>
              <div className="flex gap-2">
                <Button onClick={acceptCookies} size="sm" className="bg-blue-500 hover:bg-blue-600 text-white">
                  Accept
                </Button>
                <Button
                  onClick={declineCookies}
                  variant="outline"
                  size="sm"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  Decline
                </Button>
              </div>
            </div>
            <Button onClick={declineCookies} variant="ghost" size="sm" className="text-gray-400 hover:text-white p-1">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
