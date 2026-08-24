"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthShell, {
  AuthField,
  AuthLink,
  AuthPasswordToggle,
  AuthPrimaryButton,
} from "@/components/AuthShell";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "").trim();

    if (!email || !password) {
      setErrorMessage("Email and password are required.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/signin`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result?.success) {
        throw new Error(result?.message || "Login failed.");
      }

      sessionStorage.setItem("accessToken", result.data.accessToken);
      sessionStorage.setItem("refreshToken", result.data.refreshToken);
      sessionStorage.setItem("user", JSON.stringify(result.data.user));
      router.push("/dashboard");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to login."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthShell
      title="Log in"
      subtitle="Welcome back. Enter your details to access your Grademark account and continue practising."
      footer={
        <p className="text-sm text-black/75">
          Don&apos;t have an account?{" "}
          <AuthLink href="/auth/register">Register</AuthLink>
        </p>
      }
    >
      <form className="mt-6 space-y-4" onSubmit={handleLogin}>
        <AuthField
          label="Email"
          name="email"
          type="email"
          placeholder="you@example.com"
        />

        <AuthPasswordToggle
          id="password"
          name="password"
          label="Password"
          placeholder="Enter your password"
          show={showPassword}
          onToggle={() => setShowPassword((prev) => !prev)}
        />

        <div className="flex justify-end">
          <Link
            href="/auth/forgot"
            className="text-xs font-semibold text-black/70 underline underline-offset-2 hover:text-black"
          >
            Forgot password?
          </Link>
        </div>

        <AuthPrimaryButton disabled={isLoading}>
          {isLoading ? "Please wait..." : "Log in"}
        </AuthPrimaryButton>

        {errorMessage ? (
          <p className="text-sm font-medium text-[#DC2626]">{errorMessage}</p>
        ) : null}
      </form>
    </AuthShell>
  );
}
