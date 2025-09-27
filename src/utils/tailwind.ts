import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Utility function to merge Tailwind class names
export function twClassMerge(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
