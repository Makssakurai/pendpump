// The ONLY place colors live. No hex literals anywhere else in the app.
import { Platform } from 'react-native';

export const colors = {
  white: '#FFFFFF',
  bg: '#F0F6FF',
  blue50: '#F0F6FF',
  blue100: '#DCEAFF',
  blue200: '#BFD7FF',
  blue400: '#6BA3FF',
  blue500: '#3B82F6',
  blue600: '#2A5BD7',
  navy700: '#274690',
  navy900: '#0F2A66',
  slate500: '#6B7A99',
  yellow400: '#FFC83D',
  yellow300: '#FFD966',
  yellow100: '#FFF3C4',
  danger: '#E5484D',
  success: '#2FB67C',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 12,
  md: 16,
  lg: 24,
  pill: 999,
} as const;

// Soft blue shadow — CSS on web (boxShadow), classic elevation on native.
export const shadow = Platform.select({
  web: { boxShadow: '0 8px 24px rgba(42,91,215,0.10)' } as const,
  default: {
    shadowColor: '#2A5BD7',
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  } as const,
});

// Flavor colours — used by CupView for liquid crossfade.
export const flavorColors = {
  czekolada: '#B98A63',
  wanilia: '#F6E7B4',
  truskawka: '#FF9DB4',
  bez_smaku: '#CFE3FF',
} as const;

// Base liquid tint
export const baseTintColors = {
  water: '#E3F0FF',
  milk: '#FFFDF7',
  lactose_free: '#FFF8EB',
} as const;

// Category colours for the thin layered stripe in CupView.
export const categoryColors = {
  protein: '#FFE9A8',
  creatine: '#C7D9FF',
  bcaa: '#FFD3E0',
  vitamins: '#FFD966',
  electrolytes: '#BFD7FF',
} as const;

export const font = {
  regular: 'Poppins_400Regular',
  medium: 'Poppins_500Medium',
  semibold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
} as const;
