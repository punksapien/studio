import Link from 'next/link';
import { Briefcase } from 'lucide-react';

export function Logo({ size = 'xl' }: { size?: 'xl' | '2xl' | 'lg' }) {
  let textSizeClass = 'text-xl';
  if (size === '2xl') textSizeClass = 'text-2xl';
  if (size === 'lg') textSizeClass = 'text-lg';
  
  return (
    <Link href="/" className={`flex items-center gap-2 font-bold text-primary ${textSizeClass}`}>
      <Briefcase className="h-7 w-7" />
      <span>BizMatch Asia</span>
    </Link>
  );
}
