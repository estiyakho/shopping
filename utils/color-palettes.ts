export type ColorPalette = {
  label: string;
  shades: string[];
};

export const COLOR_PALETTES: ColorPalette[] = [
  { label: 'Ocean', shades: ['#DBEAFE', '#93C5FD', '#60A5FA', '#2563EB', '#1D4ED8'] },
  { label: 'Sky', shades: ['#E0F2FE', '#7DD3FC', '#38BDF8', '#0EA5E9', '#0369A1'] },
  { label: 'Aqua', shades: ['#ECFEFF', '#A5F3FC', '#67E8F9', '#06B6D4', '#155E75'] },
  { label: 'Teal', shades: ['#CCFBF1', '#5EEAD4', '#2DD4BF', '#14B8A6', '#115E59'] },
  { label: 'Mint', shades: ['#DCFCE7', '#86EFAC', '#4ADE80', '#22C55E', '#15803D'] },
  { label: 'Moss', shades: ['#F7FEE7', '#D9F99D', '#A3E635', '#65A30D', '#365314'] },
  { label: 'Olive', shades: ['#FEFCE8', '#D9F99D', '#A3A635', '#6B8E23', '#3F6212'] },
  { label: 'Forest', shades: ['#D1FAE5', '#6EE7B7', '#34D399', '#059669', '#065F46'] },
  { label: 'Lemon', shades: ['#FEFCE8', '#FEF08A', '#FDE047', '#EAB308', '#A16207'] },
  { label: 'Gold', shades: ['#FEF3C7', '#FCD34D', '#FBBF24', '#F59E0B', '#B45309'] },
  { label: 'Sand', shades: ['#FFFBEB', '#FDE68A', '#E7C873', '#C9A34E', '#8B6B2E'] },
  { label: 'Peach', shades: ['#FFF7ED', '#FED7AA', '#FDBA74', '#FB923C', '#C2410C'] },
  { label: 'Coral', shades: ['#FFE4D6', '#FDA4AF', '#FB7185', '#F97360', '#C2410C'] },
  { label: 'Ruby', shades: ['#FEE2E2', '#FCA5A5', '#EF4444', '#DC2626', '#991B1B'] },
  { label: 'Rose', shades: ['#FFE4E6', '#FDA4AF', '#FB7185', '#F43F5E', '#BE123C'] },
  { label: 'Wine', shades: ['#FDF2F8', '#F9A8D4', '#EC4899', '#BE185D', '#831843'] },
  { label: 'Berry', shades: ['#FDF4FF', '#F5D0FE', '#E879F9', '#C026D3', '#86198F'] },
  { label: 'Lavender', shades: ['#FAF5FF', '#E9D5FF', '#D8B4FE', '#C084FC', '#9333EA'] },
  { label: 'Violet', shades: ['#EEF2FF', '#C7D2FE', '#818CF8', '#6366F1', '#4338CA'] },
  { label: 'Plum', shades: ['#F5E1FF', '#E879F9', '#D946EF', '#A21CAF', '#701A75'] },
  { label: 'Cocoa', shades: ['#EFEBE9', '#BCAAA4', '#8D6E63', '#6D4C41', '#3E2723'] },
  { label: 'Stone', shades: ['#F5F5F4', '#D6D3D1', '#A8A29E', '#78716C', '#44403C'] },
  { label: 'Slate', shades: ['#E2E8F0', '#94A3B8', '#64748B', '#475569', '#334155'] },
  { label: 'Black', shades: ['#E5E7EB', '#9CA3AF', '#4B5563', '#111827', '#000000'] },
];

export function findPaletteByColor(value: string, palettes: ColorPalette[]) {
  return (
    palettes.find((palette) => palette.shades.includes(value)) ??
    palettes.find((palette) => palette.shades[3] === value) ??
    palettes[0]
  );
}
