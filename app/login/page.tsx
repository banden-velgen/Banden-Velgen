"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Car } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        throw signInError
      }

      if (data.user) {
        router.push("/")
      } else {
        setError("Inloggen mislukt")
      }
    } catch (error: any) {
      console.error("Login error:", error)

      if (error.message?.includes("Invalid login credentials")) {
        setError("Onjuiste inloggegevens")
      } else if (error.message?.includes("Email not confirmed")) {
        setError("E-mail nog niet bevestigd - controleer uw inbox")
      } else {
        setError("Er is een fout opgetreden bij het inloggen")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-full max-w-md px-4">
        <div className="mb-8">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="Autobanden en Velgen" className="h-14 w-18" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">Autobanden en Velgen</h1>
              <p className="text-sm text-gray-600">Nieuw of 2e hands</p>
            </div>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Inloggen</CardTitle>
            <CardDescription>Log in op uw account om verder te gaan</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">E-mailadres</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="uw.email@example.com"
                />
              </div>
              <div>
                <Label htmlFor="password">Wachtwoord</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Uw wachtwoord"
                />
              </div>
              {error && (
                <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md border border-red-200">{error}</div>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Bezig met inloggen..." : "Inloggen"}
              </Button>
            </form>
            <div className="mt-4 text-center">
              <Link href="/register" className="text-sm text-blue-600 hover:underline">
                Nog geen account? Registreer hier
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
