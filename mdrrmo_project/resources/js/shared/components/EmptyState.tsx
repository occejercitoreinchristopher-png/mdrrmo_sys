import React from 'react';
import { Inbox } from 'lucide-react';
import Button from './Button';

export interface EmptyStateProps {
    title?: string;
    description?: string;
    icon?: React.ElementType;
    actionLabel?: string;
    onAction?: () => void;
}

export default function EmptyState({
    title = 'No data found',
    description = 'There are no records to display.',
    icon: Icon = Inbox,
    actionLabel,
    onAction,
}: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                <Icon className="w-8 h-8 text-slate-500" />
            </div>
            <div>
                <h3 className="text-base font-semibold text-white">{title}</h3>
                <p className="text-sm text-slate-400 mt-1 max-w-xs">{description}</p>
            </div>
            {actionLabel && onAction && (
                <Button onClick={onAction} size="sm">
                    {actionLabel}
                </Button>
            )}
        </div>
    );
}
