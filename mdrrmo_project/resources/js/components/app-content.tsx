import React from 'react';

export function AppContent({ children, variant, className }: { children: React.ReactNode; variant?: string; className?: string }) {
    return <main className={className}>{children}</main>;
}
