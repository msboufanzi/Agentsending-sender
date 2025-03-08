import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

type ToastVariant = 'default' | 'destructive'

interface ToastProps {
  title: string
  description: string
  variant?: ToastVariant
}

export const toast = ({ title, description, variant = 'default' }: ToastProps) => {
  // In a real application, this would use a toast library
  console.log(`[${variant.toUpperCase()}] ${title}: ${description}`)
  
  // In a real app, you'd show a toast notification
  alert(`${title}: ${description}`)
}