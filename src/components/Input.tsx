import React from 'react';
import { clsx } from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  multiline?: boolean;
  rows?: number;
}

export const Input: React.FC<InputProps> = ({ label, error, multiline, rows = 3, className, ...props }) => {
  const inputClasses = clsx(
    "mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2.5 px-4",
    "focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm",
    error && "border-red-300",
    className
  );

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      {multiline ? (
        <textarea
          className={inputClasses}
          rows={rows}
          {...(props as any)}
        />
      ) : (
        <input
          className={inputClasses}
          {...props}
        />
      )}
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default Input;