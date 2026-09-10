import { Link, type InertiaLinkProps } from '@inertiajs/react';

export default function TextLink({ className = '', ...props }: InertiaLinkProps) {
    return <Link className={`text-blue-500 hover:underline ${className}`} {...props} />;
}
