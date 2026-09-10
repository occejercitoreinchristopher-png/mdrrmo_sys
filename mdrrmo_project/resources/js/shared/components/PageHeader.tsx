import { ReactNode } from 'react';
import PageTitle from './PageTitle';

export interface PageHeaderProps {
    title: string;
    subtitle?: string;
    actions?: ReactNode;
}

export default function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
    return (
        <div className="flex items-start justify-between gap-4 mb-6">
            <div>
                <PageTitle>{title}</PageTitle>
                {subtitle && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>
                )}
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
    );
}
