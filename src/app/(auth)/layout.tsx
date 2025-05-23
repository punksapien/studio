
export default function AuthPagesLayout({ // Renamed from AuthLayout for clarity
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[calc(100vh-theme(spacing.20)-theme(spacing.16))] flex-col items-center justify-center px-4 py-12 bg-brand-light-gray">
      {/* Adjusted min-h to account for h-20 navbar. Footer height is variable but usually less critical for auth pages. */}
      {/* Changed background to brand-light-gray for auth pages for a softer look */}
      {children}
    </div>
  );
}

    