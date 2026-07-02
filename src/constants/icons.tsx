import React from 'react';
import {
  Airplane,
  Bank,
  Barbell,
  Basket,
  BookOpen,
  Briefcase,
  Bus,
  Camera,
  Car,
  ChartBar,
  Coffee,
  Coins,
  CreditCard,
  DeviceMobile,
  DotsThreeCircle,
  Drop,
  FilmSlate,
  FirstAid,
  ForkKnife,
  GameController,
  Gear,
  Gift,
  GraduationCap,
  Hamburger,
  HandCoins,
  Heartbeat,
  House,
  HouseSimple,
  Lightning,
  Money,
  MusicNotes,
  Package,
  Percent,
  Phone,
  PiggyBank,
  Receipt,
  ShoppingBag,
  ShoppingCart,
  Storefront,
  TShirt,
  TrendUp,
  Wallet,
  WifiHigh,
} from 'phosphor-react-native';

export type IconWeight = 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone';

interface IconProps {
  size?: number;
  color?: string;
  weight?: IconWeight;
}

type IconComponent = React.ComponentType<IconProps>;

export const ICON_REGISTRY: Record<string, IconComponent> = {
  // expense categories
  food: ForkKnife,
  drink: Coffee,
  transport: Car,
  bus: Bus,
  housing: House,
  utilities: Lightning,
  water: Drop,
  shopping: ShoppingBag,
  cart: ShoppingCart,
  health: Heartbeat,
  medical: FirstAid,
  entertainment: FilmSlate,
  game: GameController,
  music: MusicNotes,
  education: GraduationCap,
  book: BookOpen,
  household: Package,
  basket: Basket,
  phone: Phone,
  internet: WifiHigh,
  clothes: TShirt,
  fitness: Barbell,
  travel: Airplane,
  burger: Hamburger,
  other: DotsThreeCircle,
  // income categories
  salary: Money,
  freelance: Briefcase,
  selling: Storefront,
  interest: Percent,
  gift: Gift,
  invest: TrendUp,
  coins: Coins,
  handCoins: HandCoins,
  // accounts
  cash: Wallet,
  bank: Bank,
  credit_card: CreditCard,
  e_wallet: DeviceMobile,
  piggy: PiggyBank,
  home: HouseSimple,
  // misc
  receipt: Receipt,
  camera: Camera,
  chart: ChartBar,
  gear: Gear,
};

export const CATEGORY_ICON_KEYS: string[] = [
  'food', 'drink', 'burger', 'transport', 'bus', 'travel',
  'housing', 'utilities', 'water', 'shopping', 'cart', 'basket',
  'health', 'medical', 'fitness', 'entertainment', 'game', 'music',
  'education', 'book', 'household', 'phone', 'internet', 'clothes',
  'salary', 'freelance', 'selling', 'interest', 'gift', 'invest',
  'coins', 'handCoins', 'piggy', 'receipt', 'other',
];

export const ACCOUNT_ICON_KEYS: string[] = ['cash', 'bank', 'credit_card', 'e_wallet', 'piggy'];

export function AppIcon({
  name,
  size = 22,
  color = '#0F172A',
  weight = 'regular',
}: {
  name: string;
  size?: number;
  color?: string;
  weight?: IconWeight;
}) {
  const Component = ICON_REGISTRY[name] ?? DotsThreeCircle;
  return <Component size={size} color={color} weight={weight} />;
}
