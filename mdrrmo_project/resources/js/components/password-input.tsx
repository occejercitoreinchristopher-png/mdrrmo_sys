import * as React from 'react';
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '@/shared/components/ui/input';
import { cn } from '@/shared/utils/utils';

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    className?: string;
}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
    ({ className, ...props }, ref) => {
        const [show, setShow] = useState(false);

        return (
            <div className="relative">
                <Input
                    ref={ref}
                    type={show ? 'text' : 'password'}
                    className={cn('pr-10', className)}
                    {...props}
                />
                <button
                    type="button"
                    onClick={() => setShow((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                >
                    {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
            </div>
        );
    },
);
PasswordInput.displayName = 'PasswordInput';

export default PasswordInput;
