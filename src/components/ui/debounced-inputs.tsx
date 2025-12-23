
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface DebouncedInputProps extends Omit<React.ComponentProps<"input">, 'onChange'> {
  value: string | number;
  onChange: (value: string | number) => void;
  debounce?: number;
}

export const DebouncedInput = React.forwardRef<HTMLInputElement, DebouncedInputProps>(
  ({ value: initialValue, onChange, debounce = 300, ...props }, ref) => {
    const [value, setValue] = useState(initialValue);

    useEffect(() => {
      setValue(initialValue);
    }, [initialValue]);

    useEffect(() => {
      const timeout = setTimeout(() => {
        if (value !== initialValue) {
          onChange(value);
        }
      }, debounce);

      return () => clearTimeout(timeout);
    }, [value, debounce, onChange, initialValue]);

    return (
      <Input
        {...props}
        ref={ref}
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    );
  }
);
DebouncedInput.displayName = 'DebouncedInput';

interface DebouncedTextareaProps extends Omit<React.ComponentProps<"textarea">, 'onChange'> {
  value: string | number;
  onChange: (value: string) => void;
  debounce?: number;
}

export const DebouncedTextarea = React.forwardRef<HTMLTextAreaElement, DebouncedTextareaProps>(
  ({ value: initialValue, onChange, debounce = 300, ...props }, ref) => {
    const [value, setValue] = useState(initialValue);

    useEffect(() => {
      setValue(initialValue);
    }, [initialValue]);

    useEffect(() => {
      const timeout = setTimeout(() => {
        if (value !== initialValue) {
          onChange(String(value));
        }
      }, debounce);

      return () => clearTimeout(timeout);
    }, [value, debounce, onChange, initialValue]);

    return (
      <Textarea
        {...props}
        ref={ref}
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    );
  }
);
DebouncedTextarea.displayName = 'DebouncedTextarea';
