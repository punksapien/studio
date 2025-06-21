
import Image from 'next/image';

export default function HowSellingWorksPage() {
  return (
    <div className="container mx-auto py-8 px-4 flex flex-col items-center justify-center">
      <h1 className="text-3xl font-bold text-center mb-8 font-heading text-brand-dark-blue">
        How Selling a Business on Nobridge Works
      </h1>
      <div className="w-full max-w-6xl">
        <Image
          src="/assets/how_selling_works.png"
          alt="Diagram explaining how to sell a business on Nobridge"
          width={1200}
          height={800}
          className="w-full h-auto rounded-lg shadow-lg"
          priority
        />
      </div>
    </div>
  );
}
