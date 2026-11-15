import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const APPROVED_WEBCAM_HOSTS = new Set(['in2thebeach.es', 'www.in2thebeach.es']);

/** Only embed webcams over HTTPS from approved providers. */
export function isApprovedWebcamUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && APPROVED_WEBCAM_HOSTS.has(parsed.hostname);
  } catch {
    return false;
  }
}
