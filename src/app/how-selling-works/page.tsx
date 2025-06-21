
import Image from 'next/image';

export default function HowSellingWorksPage() {
  return (
    <div className="flex items-center justify-center p-4 sm:p-6 md:p-8">
      <Image
        src="/assets/how_selling_works.png"
        alt="Diagram explaining how to sell a business on Nobridge"
        width={1200}
        height={800}
        className="w-full h-auto max-w-7xl rounded-lg"
        priority
      />
    </div>
  );
}
