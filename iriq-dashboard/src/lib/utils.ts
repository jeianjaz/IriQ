import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  if (typeof date === 'string') {
    date = new Date(date)
  }
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function calculateMoistureStatus(percentage: number): 'dry' | 'moderate' | 'optimal' | 'wet' {
  if (percentage < 30) return 'dry'
  if (percentage < 50) return 'moderate'
  if (percentage < 80) return 'optimal'
  return 'wet'
}

export function getMoistureStatusColor(status: 'dry' | 'moderate' | 'optimal' | 'wet' | 'unknown'): string {
  switch (status) {
    case 'dry': return '#ff4d4f' // Red
    case 'moderate': return '#faad14' // Yellow
    case 'optimal': return '#7AD63D' // Green (from our palette)
    case 'wet': return '#1890ff' // Blue
    case 'unknown': return '#8c8c8c' // Gray
    default: return '#7AD63D'
  }
}
