
export default function AuthPagesLayout({ // Renamed from AuthLayout for clarity
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center px-4 pt-32 pb-16 bg-brand-light-gray">
      {/* pt-32 keeps content clear of the fixed floating navbar (pt-6 + h-[72px] ≈ 96px) */}
      {children}
    </div>
  );
}

    