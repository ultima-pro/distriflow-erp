import React from 'react';
import { OrderStatus, InvoicePaymentStatus, DeliveryStatus, UserRole } from '../../types/erp';

export const StatusBadge: React.FC<{
  status: OrderStatus | InvoicePaymentStatus | DeliveryStatus | UserRole | string;
  size?: 'sm' | 'md';
}> = ({ status, size = 'sm' }) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm';

  const getStyle = (): string => {
    switch (status) {
      // Order & Delivery Statuses
      case 'DRAFT':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      case 'SUBMITTED':
        return 'bg-amber-50 text-amber-700 border-amber-300';
      case 'CHANGES_REQUESTED':
        return 'bg-orange-50 text-orange-700 border-orange-300';
      case 'APPROVED':
        return 'bg-blue-50 text-blue-700 border-blue-300';
      case 'INVOICED':
        return 'bg-indigo-50 text-indigo-700 border-indigo-300';
      case 'SCHEDULED':
        return 'bg-sky-50 text-sky-700 border-sky-300';
      case 'DISPATCHED':
        return 'bg-purple-50 text-purple-700 border-purple-300';
      case 'DELIVERED':
      case 'PAID':
        return 'bg-emerald-50 text-emerald-700 border-emerald-300';
      case 'REJECTED':
      case 'CANCELLED':
      case 'FAILED':
        return 'bg-rose-50 text-rose-700 border-rose-300';
      case 'PARTIALLY_PAID':
        return 'bg-yellow-50 text-yellow-800 border-yellow-300';
      case 'UNPAID':
        return 'bg-amber-50 text-amber-800 border-amber-300';
      case 'OWNER':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'SALESPERSON':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const formatText = (text: string) => {
    return text.replace(/_/g, ' ');
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${getStyle()} ${sizeClasses}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-70" />
      {formatText(status)}
    </span>
  );
};
