import Link from 'next/link';
import { Logo } from '@/components/shared/logo';

export function Footer() {
  return (
    <footer className="border-t bg-secondary/50">
      <div className="container py-12 px-4 md:px-6">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <Logo size="lg" />
            <p className="mt-2 text-sm text-muted-foreground">
              Connecting SME owners with investors across Asia.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 md:col-span-2 md:grid-cols-3">
            <div>
              <h4 className="font-semibold text-foreground">Platform</h4>
              <nav className="mt-2 flex flex-col space-y-1">
                <Link href="/" className="text-sm text-muted-foreground hover:text-primary">Marketplace</Link>
                <Link href="/auth/register" className="text-sm text-muted-foreground hover:text-primary">Register</Link>
                <Link href="/auth/login" className="text-sm text-muted-foreground hover:text-primary">Login</Link>
              </nav>
            </div>
            <div>
              <h4 className="font-semibold text-foreground">Company</h4>
              <nav className="mt-2 flex flex-col space-y-1">
                <Link href="/about" className="text-sm text-muted-foreground hover:text-primary">About Us</Link>
                <Link href="/contact" className="text-sm text-muted-foreground hover:text-primary">Contact</Link>
                <Link href="/blog" className="text-sm text-muted-foreground hover:text-primary">Blog</Link> {/* Added placeholder */}
              </nav>
            </div>
            <div>
              <h4 className="font-semibold text-foreground">Legal</h4>
              <nav className="mt-2 flex flex-col space-y-1">
                <Link href="/terms" className="text-sm text-muted-foreground hover:text-primary">Terms of Service</Link>
                <Link href="/privacy" className="text-sm text-muted-foreground hover:text-primary">Privacy Policy</Link>
              </nav>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} BizMatch Asia. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
