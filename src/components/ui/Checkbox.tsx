import * as Checkbox from '@radix-ui/react-checkbox';
import { cn } from '../../lib/cn';
import { Check } from 'lucide-react';
export function CheckboxRoot({ className, ...props }: Checkbox.CheckboxProps) {
  return (
    <Checkbox.Root
      className={cn('checkbox-root', className)}
      {...props}
    >
      <Checkbox.Indicator className="checkbox-indicator">
        <Check size={14} />
      </Checkbox.Indicator>
    </Checkbox.Root>
  );
}