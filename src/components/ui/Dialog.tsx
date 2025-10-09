import * as Dialog from '@radix-ui/react-dialog';
import { cn } from '../../lib/cn';
import { X } from 'lucide-react';
export const DialogRoot = Dialog.Root;
export const DialogTrigger = Dialog.Trigger;
export const DialogClose = Dialog.Close;
export const DialogPortal = Dialog.Portal;

export function DialogOverlay({ className, ...props }: Dialog.DialogOverlayProps) {
  return (
    <Dialog.Overlay
      className={cn(
        'fixed inset-0 z-50 bg-black/50',
        'data-[state=open]:animate-[fadeIn_150ms_ease-out]',
        'data-[state=closed]:animate-[fadeOut_100ms_ease-in]',
        className
      )}
      {...props}
    />
  );
}

export function DialogContent({ 
  className, 
  children,
  title,
  description,
  ...props 
}: Dialog.DialogContentProps & { title?: string; description?: string }) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <Dialog.Content
        className={cn(
          'fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2',
          'w-full max-w-lg max-h-[90vh] overflow-y-auto',
          'bg-[hsl(var(--surface))] rounded-xl shadow-lg border border-[hsl(var(--border))]',
          'data-[state=open]:animate-[scaleIn_200ms_cubic-bezier(0.16,1,0.3,1)]',
          'data-[state=closed]:animate-[fadeOut_100ms_ease-in]',
          'focus:outline-none',
          className
        )}
        {...props}
      >
        {title && (
          <Dialog.Title className="text-xl font-bold px-6 pt-6 pb-2">
            {title}
          </Dialog.Title>
        )}
        {description && (
          <Dialog.Description className="text-sm text-[hsl(var(--muted-foreground))] px-6 pb-4">
            {description}
          </Dialog.Description>
        )}
        <div className={title || description ? 'px-6 pb-6' : 'p-6'}>
          {children}
        </div>
        <Dialog.Close className="absolute right-4 top-4 rounded-md p-1 hover:bg-[hsl(var(--muted))] transition-colors">
          <X size={20} />
        </Dialog.Close>
      </Dialog.Content>
    </DialogPortal>
  );
}
