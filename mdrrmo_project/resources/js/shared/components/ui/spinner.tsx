import { Loader2 } from 'lucide-react';
import React from 'react';

export function Spinner({ className = '' }: { className?: string }) {
    return <Loader2 className={`animate-spin ${className}`} />;
}
