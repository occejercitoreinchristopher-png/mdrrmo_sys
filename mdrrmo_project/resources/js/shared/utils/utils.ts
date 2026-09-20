import type { InertiaLinkProps } from '@inertiajs/react';
import { clsx } from 'clsx';
import type { ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function toUrl(url: NonNullable<InertiaLinkProps['href']>): string {
    return typeof url === 'string' ? url : url.url;
}

export function toTitleCase(str?: string | null): string {
    if (!str) return '';
    return str
        .toLowerCase()
        .replace(/(?:^|\s|-|\/)\S/g, (match) => match.toUpperCase());
}

export function toPascalCase(str?: string | null): string {
    return toTitleCase(str);
}

