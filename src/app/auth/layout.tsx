export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-white section-lines-dark px-4 pt-32 pb-16">
      {/* pt-32 keeps content clear of the fixed floating navbar (pt-6 + h-[72px] ≈ 96px) */}
      {children}
    </div>
  );
}
