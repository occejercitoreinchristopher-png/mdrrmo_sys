import { clsx } from 'clsx';

interface HeadingProps {
    title: string;
    description?: string;
    variant?: 'default' | 'small';
    className?: string;
}

export default function Heading({
    title,
    description,
    variant = 'default',
    className = '',
}: HeadingProps) {
    return (
        <div className={clsx('space-y-1', className)}>
            {variant === 'small' ? (
                <h3 className="text-base font-semibold text-foreground">{title}</h3>
            ) : (
                <h2 className="text-lg font-semibold text-foreground">{title}</h2>
            )}
            {description && (
                <p className="text-sm text-muted-foreground">{description}</p>
            )}
        </div>
    );
}
