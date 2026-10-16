import { cn } from '@/lib/utils';

export function InputError({ message, className, ...props }) {
    if (!message) return null;

    return (
        <p
            {...props}
            className={cn('text-xs font-medium text-red-500 dark:text-red-400 mt-1.5', className)}
        >
            {message}
        </p>
    );
}

// Tambahkan baris ini di paling bawah:
export default InputError;