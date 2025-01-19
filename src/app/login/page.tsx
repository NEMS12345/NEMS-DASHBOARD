import { Metadata } from "next"
import { LoginForm } from "@/components/auth/LoginForm"
import { createClient } from "@supabase/supabase-js"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "Login - NEMS Dashboard",
  description: "Login to your NEMS Dashboard account",
}

export default async function LoginPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: { session } } = await supabase.auth.getSession()

  if (session) {
    redirect("/dashboard")
  }

  return (
    <div className="flex min-h-screen items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold tracking-tight">
            Sign in to NEMS Dashboard
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter your credentials to access your account
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
