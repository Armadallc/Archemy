import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

interface UserAvatarProps {
  user: {
    user_id?: string;
    user_name?: string;
    email?: string;
    avatar_url?: string | null;
    first_name?: string | null;
    last_name?: string | null;
  };
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
};

const textSizeClasses = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
};

export function UserAvatar({ user, size = 'md' }: UserAvatarProps) {
  const getInitials = () => {
    if (user.first_name && user.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    }
    if (user.first_name) {
      return user.first_name[0].toUpperCase();
    }
    if (user.user_name) {
      return user.user_name[0].toUpperCase();
    }
    if (user.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  };

  return (
    <Avatar className={sizeClasses[size]}>
      {user.avatar_url ? (
        <AvatarImage src={user.avatar_url} alt={user.user_name || user.email || 'User'} />
      ) : null}
      <AvatarFallback className={textSizeClasses[size]}>
        {getInitials()}
      </AvatarFallback>
    </Avatar>
  );
}











