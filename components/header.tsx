"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { Car } from "lucide-react"

export function Header() {
  const { user, profile, signOut } = useAuth()

  return (
    <header className="border-b bg-white">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Car className="h-8 w-8 text-red-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">Autobanden en Velgen</h1>
              <p className="text-sm text-gray-600">Nieuw of 2e hands</p>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                {profile?.role === "admin" && (
                  <Link href="/admin">
                    <Button variant="outline">Admin Dashboard</Button>
                  </Link>
                )}
                <span className="text-sm text-gray-600">Welkom, {user.email}</span>
                <Button onClick={signOut} variant="outline">
                  Uitloggen
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="outline">Inloggen</Button>
                </Link>
                <Link href="/register">
                  <Button>Registreren</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
