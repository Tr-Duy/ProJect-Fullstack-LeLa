import React from 'react';
import { Button } from 'antd';
import { InboxOutlined } from '@ant-design/icons';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  actionText,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`journal-subcard p-8 md:p-12 text-center flex flex-col items-center justify-center space-y-3 bg-[var(--paper-2)]/40 ${className}`}
    >
      <div className="w-14 h-14 rounded-full bg-white border-2 border-[var(--ink)] shadow-[2px_2px_0_var(--ink)] flex items-center justify-center text-2xl text-[var(--ink)] mb-2">
        {icon || <InboxOutlined />}
      </div>
      <h3 className="text-lg font-bold text-[var(--ink)]">{title}</h3>
      {description && (
        <p className="text-sm text-[var(--ink-soft)] max-w-md">
          {description}
        </p>
      )}
      {actionText && onAction && (
        <Button type="primary" onClick={onAction} className="mt-3">
          {actionText}
        </Button>
      )}
    </div>
  );
};
