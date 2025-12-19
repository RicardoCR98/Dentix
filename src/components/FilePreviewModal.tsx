import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "../lib/cn";

interface FilePreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileUrl: string;
  type: "pdf" | "image";
  title?: string;
}

export function FilePreviewModal({
  open,
  onOpenChange,
  fileUrl,
  type,
  title = "Vista previa",
}: FilePreviewModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
        <Dialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50",
            "w-[92vw] max-w-6xl h-[85vh]",
            "-translate-x-1/2 -translate-y-1/2",
            "rounded-xl bg-[hsl(var(--surface))] shadow-2xl border border-[hsl(var(--border))]",
            "p-4 flex flex-col gap-3",
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <Dialog.Title className="text-lg font-semibold text-[hsl(var(--foreground))]">
                {title}
              </Dialog.Title>
              <Dialog.Description className="text-sm text-[hsl(var(--muted-foreground))]">
                {type === "pdf" ? "Documento PDF" : "Imagen"}
              </Dialog.Description>
            </div>
            <Dialog.Close className="p-2 rounded-md text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition">
              <X size={18} />
            </Dialog.Close>
          </div>

          <div className="flex-1 overflow-hidden rounded-lg bg-[hsl(var(--muted))]">
            {type === "pdf" ? (
              <iframe
                src={fileUrl}
                title="Vista previa PDF"
                className="w-full h-full rounded-lg border border-[hsl(var(--border))]"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-[hsl(var(--muted))]">
                <img
                  src={fileUrl}
                  alt={title}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
