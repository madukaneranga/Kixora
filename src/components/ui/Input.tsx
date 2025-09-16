import { forwardRef, InputHTMLAttributes } from 'react';
import clsx from 'clsx';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  variant?: 'default' | 'dark';
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', label, error, helperText, variant = 'default', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className={clsx(
            "block text-sm font-medium mb-2",
            variant === 'dark' ? 'text-[rgb(94,94,94)]' : 'text-black'
          )}>
            {label}
          </label>
        )}
        <input
          type={type}
          className={clsx(
            'w-full px-4 py-2.5 border rounded-lg transition-colors duration-200',
            'focus:outline-none',
            variant === 'dark' ? [
              'bg-black text-white',
              'border-[rgb(51,51,51)]',
              'focus:border-white',
              'placeholder:text-[rgb(94,94,94)]',
              error
                ? 'border-red-500'
                : 'hover:border-[rgb(94,94,94)]'
            ] : [
              'focus:ring-2 focus:ring-gray-500 focus:border-gray-500',
              'placeholder:text-gray-500',
              error
                ? 'border-red-500 bg-red-50'
                : 'border-gray-300 hover:border-gray-500'
            ],
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className={clsx(
            "mt-2 text-sm",
            variant === 'dark' ? 'text-red-400' : 'text-red-500'
          )}>{error}</p>
        )}
        {helperText && !error && (
          <p className={clsx(
            "mt-2 text-sm",
            variant === 'dark' ? 'text-gray-400' : 'text-gray-500'
          )}>{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;