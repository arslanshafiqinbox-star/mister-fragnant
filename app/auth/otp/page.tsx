import AuthShell, { AuthLink, AuthPrimaryButton } from "@/components/AuthShell";

export default function OtpPage() {
  return (
    <AuthShell
      title="Enter OTP"
      subtitle="We've sent a 6-digit one-time code to your email. Type it below to continue."
      footer={
        <p className="text-sm text-black/75">
          Wrong email? <AuthLink href="/auth/login">Back to log in</AuthLink>
        </p>
      }
    >
      <form className="mt-6 space-y-4">
        <div className="flex justify-between gap-2">
          {Array.from({ length: 6 }).map((_, idx) => (
            <input
              key={idx}
              type="text"
              maxLength={1}
              className="h-11 w-11 border-2 border-black bg-white text-center text-sm font-semibold outline-none focus:bg-[#FFF7D6] sm:h-12 sm:w-12"
            />
          ))}
        </div>
        <AuthPrimaryButton>Verify code</AuthPrimaryButton>
      </form>
    </AuthShell>
  );
}
