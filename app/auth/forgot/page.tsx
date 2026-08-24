import AuthShell, {
  AuthField,
  AuthLink,
  AuthPrimaryButton,
} from "@/components/AuthShell";

export default function ForgotPage() {
  return (
    <AuthShell
      title="Forgot password"
      subtitle="Enter the email linked to your Grademark account and we'll send you a secure reset link."
      footer={
        <p className="text-sm text-black/75">
          Remember your password? <AuthLink href="/auth/login">Log in</AuthLink>
        </p>
      }
    >
      <form className="mt-6 space-y-4">
        <AuthField
          label="Email"
          name="email"
          type="email"
          placeholder="you@example.com"
        />
        <AuthPrimaryButton>Send reset link</AuthPrimaryButton>
      </form>
    </AuthShell>
  );
}
