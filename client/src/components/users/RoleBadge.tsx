import React from 'react';
import { Badge } from '../ui/badge';

interface RoleBadgeProps {
  role: string;
  size?: 'sm' | 'md' | 'lg';
}

const roleColors: Record<string, { bg: string; text: string; border: string }> = {
  super_admin: {
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    text: 'text-purple-800 dark:text-purple-200',
    border: 'border-purple-300 dark:border-purple-700',
  },
  corporate_admin: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-800 dark:text-blue-200',
    border: 'border-blue-300 dark:border-blue-700',
  },
  program_admin: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-800 dark:text-green-200',
    border: 'border-green-300 dark:border-green-700',
  },
  program_user: {
    bg: 'bg-gray-100 dark:bg-gray-800',
    text: 'text-gray-800 dark:text-gray-200',
    border: 'border-gray-300 dark:border-gray-700',
  },
  driver: {
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    text: 'text-orange-800 dark:text-orange-200',
    border: 'border-orange-300 dark:border-orange-700',
  },
};

const sizeClasses = {
  sm: 'text-xs px-1.5 py-0.5',
  md: 'text-sm px-2 py-1',
  lg: 'text-base px-2.5 py-1.5',
};

const formatRoleName = (role: string): string => {
  return role
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export function RoleBadge({ role, size = 'md' }: RoleBadgeProps) {
  const roleKey = role.toLowerCase();
  const colors = roleColors[roleKey] || roleColors.program_user;

  return (
    <Badge
      variant="outline"
      className={`${sizeClasses[size]} ${colors.bg} ${colors.text} ${colors.border} font-medium`}
    >
      {formatRoleName(role)}
    </Badge>
  );
}




