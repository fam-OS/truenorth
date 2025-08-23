import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(input: string | number | Date): string {
  const date = new Date(input);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function absoluteUrl(path: string) {
  return `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}${path}`;
}

export function truncate(str: string, length: number) {
  return str.length > length ? `${str.substring(0, length)}...` : str;
}

export function isArrayOfFile(files: unknown): files is File[] {
  const isArray = Array.isArray(files);
  if (!isArray) return false;
  return files.every((file) => file instanceof File);
}

export function toTitleCase(str: string) {
  return str.replace(
    /\w\S*/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase()
  );
}

export function formatBytes(
  bytes: number,
  decimals = 0,
  sizeType: 'accurate' | 'normal' = 'normal'
) {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const accurateSizes = ['Bytes', 'KiB', 'MiB', 'GiB'];
  if (bytes === 0) return '0 Byte';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(decimals))} ${
    sizeType === 'accurate' ? accurateSizes[i] ?? 'Bytest' : sizes[i] ?? 'Bytes'
  }`;
}

export function formatId(id: string) {
  return `#${id.toString().padStart(4, '0')}`;
}

export function formatEnumValue(value: string) {
  return value
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export function formatPrice(
  price: number | string,
  currency: 'USD' | 'EUR' | 'GBP' | 'BDT' = 'USD',
  notation: 'compact' | 'engineering' | 'scientific' | 'standard' = 'standard'
) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    notation,
  }).format(Number(price));
}
