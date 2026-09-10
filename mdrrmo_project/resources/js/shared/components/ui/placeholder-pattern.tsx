import { cn } from '@/shared/utils/utils';

interface PlaceholderPatternProps {
    className?: string;
}

export function PlaceholderPattern({ className }: PlaceholderPatternProps) {
    return (
        <svg
            className={cn('h-full w-full', className)}
            aria-hidden="true"
        >
            <defs>
                <pattern
                    id="placeholder-pattern"
                    x="0"
                    y="0"
                    width="10"
                    height="10"
                    patternUnits="userSpaceOnUse"
                >
                    <line
                        x1="0"
                        y1="10"
                        x2="10"
                        y2="0"
                        stroke="currentColor"
                        strokeWidth="0.5"
                    />
                </pattern>
            </defs>
            <rect
                width="100%"
                height="100%"
                fill="url(#placeholder-pattern)"
            />
        </svg>
    );
}
