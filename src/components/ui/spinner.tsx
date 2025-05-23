import React from 'react';
import { cn } from '@/lib/utils';

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Spinner = ({ className, ...props }: SpinnerProps) => {
  return (
    <div className="flex justify-center items-center" {...props}>
      <div className={cn("animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600", className)}></div>
    </div>
  );
};
