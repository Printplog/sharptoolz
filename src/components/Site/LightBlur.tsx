import { cn } from '@/lib/utils';
import { type HTMLAttributes } from 'react';

type LightBlurProps = HTMLAttributes<HTMLDivElement>

export default function LightBlur({ children, ...props }: LightBlurProps) {
    return (
        <div
            {...props}
            className={cn(
                "size-[400px] rounded-full bg-primary blur-3xl opacity-[0.1] absolute",
                props.className                
            )}
        >
            {children}
        </div>
    );
}
