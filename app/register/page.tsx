"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Car } from "lucide-react"

export default function RegisterPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const createUserProfile = async (userId: string, userEmail: string) => {
    try {
      const { error } = await supabase.from("profiles").insert({
        id: userId,
        email: userEmail,
        role: userEmail === "admin@banden.autos" ? "admin" : "buyer",
      })

      if (error) {
        console.error("Profile creation error:", error)
      }
    } catch (err) {
      console.error("Profile creation failed:", err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (password !== confirmPassword) {
      setError("Wachtwoorden komen niet overeen")
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError("Wachtwoord moet minimaal 6 karakters lang zijn")
      setLoading(false)
      return
    }

    try {
      // Create auth user with auto-confirm
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: undefined,
          data: {
            email_confirm: true,
          },
        },
      })

      if (signUpError) {
        throw signUpError
      }

      if (!data.user) {
        throw new Error("User creation failed")
      }

      // Create profile manually
      await createUserProfile(data.user.id, email)

      // If user needs confirmation, show different message
      if (data.user && !data.user.email_confirmed_at && data.user.confirmation_sent_at) {
        setError("Controleer uw e-mail voor de bevestigingslink")
        setLoading(false)
        return
      }

      setSuccess(true)
    } catch (error: any) {
      console.error("Registration error:", error)

      if (error.message?.includes("already registered")) {
        setError("Dit e-mailadres is al geregistreerd")
      } else if (error.message?.includes("Invalid email")) {
        setError("Ongeldig e-mailadres")
      } else if (error.message?.includes("weak")) {
        setError("Wachtwoord te zwak - gebruik letters, cijfers en symbolen")
      } else if (error.message?.includes("Email not confirmed")) {
        setError("E-mail nog niet bevestigd - controleer uw inbox")
      } else {
        setError("Registratie mislukt - probeer het opnieuw")
      }
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Registratie succesvol!</CardTitle>
            <CardDescription>Uw account is aangemaakt. U kunt nu inloggen.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/login">
              <Button className="w-full">Ga naar inloggen</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <Link href="/" className="flex items-center gap-2 mb-4">
            <img src="/logo.png" alt="Autobanden en Velgen" className="h-14 w-18" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">Autobanden en Velgen</h1>
              <p className="text-sm text-gray-600">Nieuw of 2e hands</p>
            </div>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Registreren</CardTitle>
            <CardDescription>Maak een nieuw account aan</CardDescription>
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
                  minLength={6}
                  placeholder="Minimaal 6 karakters"
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Bevestig wachtwoord</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Herhaal uw wachtwoord"
                />
              </div>
              {error && (
                <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md border border-red-200">{error}</div>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Bezig met registreren..." : "Registreren"}
              </Button>
            </form>
            <div className="mt-4 text-center">
              <Link href="/login" className="text-sm text-blue-600 hover:underline">
                Al een account? Log hier in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
