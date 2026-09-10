import React from 'react';

export function AppShell({ children, variant }: { children: React.ReactNode; variant?: string }) {
    return <div>{children}</div>;
}
