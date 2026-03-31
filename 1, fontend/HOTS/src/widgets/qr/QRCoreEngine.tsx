import React from 'react';
import { Monitor, Smartphone } from 'lucide-react';

// Import Logos to ensure Vite resolution
import logoIndofood from '@/assets/images/indofood_CBP_logo.png';
import logoFlavour from '@/assets/images/flavour_logo.png';

export const DEFAULT_LOGOS = [
  { id: 'none', label: 'None', url: null },
  { id: 'indofood', label: 'Indofood', url: logoIndofood },
  { id: 'flavour', label: 'Flavour', url: logoFlavour },
  { id: 'scanme', label: 'Scan Me', url: 'https://cdn-icons-png.flaticon.com/512/241/241528.png' },
];

export const QR_SIZE = 180;
export const QR_AREA = QR_SIZE * QR_SIZE;

export function getSafeLogoSettings(
  qrValue: string,
  placement: 'strip' | 'center',
  logoAspectRatio: number
): { width: number; height: number; y?: number } {
  const charCount = qrValue.length;
  const QR_VERSION_TABLE = [7, 14, 24, 34, 44, 58, 64, 84, 98, 119, 137, 155, 178, 207, 226];
  const version = QR_VERSION_TABLE.findIndex(max => charCount <= max) + 1 || 10;
  const moduleCount = 4 * version + 17;
  const moduleSize = QR_SIZE / moduleCount;

  if (placement === 'center') {
    const maxSide = Math.min(QR_SIZE * 0.22, 50);
    let w = maxSide;
    let h = maxSide / logoAspectRatio;
    if (h > maxSide) { h = maxSide; w = maxSide * logoAspectRatio; }
    return { width: Math.floor(w), height: Math.floor(h) };
  }

  const stripW = Math.floor(QR_SIZE * 0.75);
  const stripH = Math.floor(QR_SIZE * 0.08);
  const stripTopY = Math.floor((QR_SIZE / 2) - (stripH / 2));
  return { width: stripW, height: stripH, y: stripTopY };
}

export function calculateScanReliability(placement: string, hasLogo: boolean): { status: 'safe' | 'risky' | 'broken'; label: string; color: string } {
  if (!hasLogo) return { status: 'safe', label: '✅ Scannable', color: 'text-emerald-600' };
  if (placement === 'center') return { status: 'safe', label: '✅ Scannable — Center Logo', color: 'text-emerald-600' };
  return { status: 'risky', label: '⚠️ Strip Logo — Test before printing', color: 'text-amber-600' };
}
