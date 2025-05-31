import Image from 'next/image';

export type NobridgeIconType =
  | 'business-listing' // icon_01 - Complex Cube/Abstract Structure
  | 'transactions' // icon_02 - Card Slot/ATM-like
  | 'calculator' // icon_03 - Calculator
  | 'revenue' // icon_04 - Dollar Coin
  | 'growth' // icon_05 - Growing Arrow Chart
  | 'featured' // icon_06 - Geometric Star/Flower Cube
  | 'verification' // icon_07 - SIM Card
  | 'secure-docs' // icon_08 - Cube with Inner Sphere/Protected Item
  | 'deal-structure' // icon_09 - Segmented Hexagonal Prism
  | 'digital-assets' // icon_10 - Flat Box/Device
  | 'core-details' // icon_11 - Cube with Inner Focused Cube
  | 'investment' // icon_12 - Stack of Cash
  | 'financial-growth' // icon_13 - Bar Chart with Coin & Growing Bars
  | 'due-diligence' // icon_14 - Scales of Justice/Balance
  | 'interaction' // icon_15 - Isometric Cursor/Pointer
  | 'documents'; // icon_16 - USB Drive

const iconMap: Record<NobridgeIconType, string> = {
  'business-listing': '/assets/icon_01.png',
  'transactions': '/assets/icon_02.png',
  'calculator': '/assets/icon_03.png',
  'revenue': '/assets/icon_04.png',
  'growth': '/assets/icon_05.png',
  'featured': '/assets/icon_06.png',
  'verification': '/assets/icon_07.png',
  'secure-docs': '/assets/icon_08.png',
  'deal-structure': '/assets/icon_09.png',
  'digital-assets': '/assets/icon_10.png',
  'core-details': '/assets/icon_11.png',
  'investment': '/assets/icon_12.png',
  'financial-growth': '/assets/icon_13.png',
  'due-diligence': '/assets/icon_14.png',
  'interaction': '/assets/icon_15.png',
  'documents': '/assets/icon_16.png',
};

interface NobridgeIconProps {
  icon: NobridgeIconType;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  alt?: string;
  className?: string;
}

export function NobridgeIcon({
  icon,
  size = 'md',
  alt,
  className = ''
}: NobridgeIconProps) {
  const dimensions = {
    sm: 24,
    md: 32,
    lg: 48,
    xl: 64
  };

  const iconSize = dimensions[size];
  const iconSrc = iconMap[icon];
  const iconAlt = alt || `${icon} icon`;

  return (
    <Image
      src={iconSrc}
      alt={iconAlt}
      width={iconSize}
      height={iconSize}
      className={`object-contain ${className}`}
    />
  );
}
