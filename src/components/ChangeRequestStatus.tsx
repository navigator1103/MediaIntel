'use client';

interface ChangeRequestStatusProps {
  status: string;
  className?: string;
}

/**
 * Component to display change request status with consistent styling
 * Uses the standard terminology: "Submitted for Review", "Approved", "Rejected"
 */
export default function ChangeRequestStatus({ status, className = '' }: ChangeRequestStatusProps) {
  // Determine color based on status
  let bgColor = '';
  let textColor = '';
  
  switch (status) {
    case 'Approved':
      bgColor = 'bg-green-100';
      textColor = 'text-green-800';
      break;
    case 'Rejected':
      bgColor = 'bg-red-100';
      textColor = 'text-red-800';
      break;
    case 'Submitted for Review':
    default:
      bgColor = 'bg-yellow-100';
      textColor = 'text-yellow-800';
      break;
  }
  
  return (
    <span 
      className={`px-2 py-1 rounded-full text-xs font-medium ${bgColor} ${textColor} ${className}`}
    >
      {status}
    </span>
  );
}
