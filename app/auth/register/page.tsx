"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthShell, {
  AuthField,
  AuthLink,
  AuthPasswordToggle,
  AuthPrimaryButton,
} from "@/components/AuthShell";

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();

  async function handleSignup(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setErrorMessage("");
    setIsLoading(true);

    const formData = new FormData(form);
    const firstName = String(formData.get("firstName") || "").trim();
    const lastName = String(formData.get("lastName") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "").trim();
    const confirmPassword = String(formData.get("confirmPassword") || "").trim();

    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      setErrorMessage("All fields are required.");
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/signup`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password, firstName, lastName }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result?.success) {
        throw new Error(result?.message || "Signup failed.");
      }

      form.reset();
      router.push("/auth/login");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to sign up."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthShell
      title="Create account"
      subtitle="One profile for all your subjects, practice papers, and AI-marked results."
      footer={
        <p className="text-sm text-black/75">
          Already have an account? <AuthLink href="/auth/login">Log in</AuthLink>
        </p>
      }
    >
      <form className="mt-6 space-y-4" onSubmit={handleSignup}>
        <div className="grid gap-4 sm:grid-cols-2">
          <AuthField label="First name" name="firstName" placeholder="Huzaifa" />
          <AuthField label="Last name" name="lastName" placeholder="Naser" />
        </div>
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
          placeholder="Create a strong password"
          show={showPassword}
          onToggle={() => setShowPassword((prev) => !prev)}
        />
        <AuthPasswordToggle
          id="confirm-password"
          name="confirmPassword"
          label="Re-type password"
          placeholder="Type the password again"
          show={showConfirm}
          onToggle={() => setShowConfirm((prev) => !prev)}
        />

        <AuthPrimaryButton disabled={isLoading}>
          {isLoading ? "Please wait..." : "Sign up"}
        </AuthPrimaryButton>

        {errorMessage ? (
          <p className="text-sm font-medium text-[#DC2626]">{errorMessage}</p>
        ) : null}
      </form>
    </AuthShell>
  );
}
