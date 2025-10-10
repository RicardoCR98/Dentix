// src/components/Attachments.tsx
import { useState } from "react";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";
import { Alert } from "./ui/Alert";
import { Upload, File, Image, FileText, X, Paperclip } from "lucide-react";
import { cn } from "../lib/cn";

type AttachmentFile = {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadDate: string;
};

const getFileIcon = (type: string) => {
  if (type.startsWith("image/")) return <Image size={20} />;
  if (type.includes("pdf")) return <FileText size={20} />;
  return <File size={20} />;
};

const getFileTypeLabel = (type: string): string => {
  if (type.startsWith("image/")) return "Imagen";
  if (type.includes("pdf")) return "PDF";
  if (type.includes("word")) return "Word";
  return "Archivo";
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};

export default function Attachments() {
  const [files, setFiles] = useState<AttachmentFile[]>([]);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (fileList: FileList) => {
    const newFiles: AttachmentFile[] = Array.from(fileList).map((file) => ({
      id: crypto.randomUUID(),
      name: file.name,
      size: file.size,
      type: file.type,
      url: URL.createObjectURL(file),
      uploadDate: new Date().toISOString(),
    }));

    setFiles((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const totalSize = files.reduce((acc, f) => acc + f.size, 0);

  return (
    <div className='space-y-4'>
      {/* Zona de carga */}
      <div
        className={cn(
          "relative border-2 border-dashed rounded-lg p-8 transition-all",
          dragActive
            ? "border-[hsl(var(--brand))] bg-[color-mix(in_oklab,hsl(var(--brand))_8%,transparent)]"
            : "border-[hsl(var(--border))] hover:border-[hsl(var(--brand))]"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type='file'
          multiple
          accept='image/*,.pdf,.doc,.docx'
          onChange={handleChange}
          className='absolute inset-0 w-full h-full opacity-0 cursor-pointer'
          id='file-upload'
        />

        <div className='text-center'>
          <div className='mx-auto w-16 h-16 rounded-full bg-[hsl(var(--muted))] flex items-center justify-center mb-4'>
            <Upload size={32} className='text-[hsl(var(--brand))]' />
          </div>

          <h3 className='text-lg font-semibold mb-2'>
            {dragActive
              ? "¡Suelta los archivos aquí!"
              : "Arrastra archivos o haz clic"}
          </h3>

          <p className='text-sm text-[hsl(var(--muted-foreground))] mb-4'>
            Formatos soportados: Imágenes (JPG, PNG), PDF, Word
          </p>

          <label htmlFor='file-upload' className='cursor-pointer'>
            <Button variant='secondary' size='sm'>
              <Paperclip size={14} />
              Seleccionar archivos
            </Button>
          </label>
        </div>
      </div>

      {/* Información */}
      {files.length > 0 && (
        <div className='flex items-center justify-between p-3 rounded-lg bg-[hsl(var(--muted))]'>
          <div className='flex items-center gap-2 text-sm'>
            <Paperclip size={14} className='text-[hsl(var(--brand))]' />
            <span className='font-medium'>
              {files.length} archivo{files.length !== 1 ? "s" : ""}
            </span>
            <span className='text-[hsl(var(--muted-foreground))]'>•</span>
            <span className='text-[hsl(var(--muted-foreground))]'>
              {formatFileSize(totalSize)}
            </span>
          </div>

          {files.length > 0 && (
            <Button variant='ghost' size='sm' onClick={() => setFiles([])}>
              <X size={14} />
              Limpiar todo
            </Button>
          )}
        </div>
      )}

      {/* Lista de archivos */}
      {files.length > 0 ? (
        <div className='grid md:grid-cols-2 gap-3'>
          {files.map((file) => (
            <div
              key={file.id}
              className='card p-4 hover:shadow-md transition-shadow w-100%'
            >
              <div className='flex items-center justify-between'>
                {/* Icono/Preview */}
                <div className='w-15 h-15 rounded-lg bg-[hsl(var(--muted))] flex items-center justify-center flex-shrink-0 text-[hsl(var(--brand))]'>
                  {file.type.startsWith("image/") ? (
                    <img
                      src={file.url}
                      alt={file.name}
                      className='w-full h-full object-cover rounded-lg'
                    />
                  ) : (
                    getFileIcon(file.type)
                  )}
                </div>

                {/* Info */}

                <div className='min-w-0'>
                  <div className='flex items-start justify-baseline gap-3 mb-2'>
                    <h4
                      className='font-medium text-sm truncate'
                      title={file.name}
                    >
                      {file.name}
                    </h4>
                    <Badge variant='info' className='text-xs flex-shrink-0'>
                      {getFileTypeLabel(file.type)}
                    </Badge>
                  </div>

                  <div className='flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]'>
                    <span>{formatFileSize(file.size)}</span>
                    <span>•</span>
                    <span>
                      {new Date(file.uploadDate).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Acciones */}
                </div>
                <div className='flex gap-1 justify-end'>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => removeFile(file.id)}
                    className='flex items-center gap-1 hover:bg-red-500/10 text-red-600 hover:text-red-800'
                  >
                    <X size={12} />
                    Eliminar
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Alert variant='info'>
          <div className='text-center py-2'>
            <p className='text-sm'>
              No hay archivos adjuntos. Arrastra archivos o haz clic en el área
              de carga.
            </p>
          </div>
        </Alert>
      )}

      {/* Nota informativa */}
      <Alert variant='warning'>
        <p className='text-sm'>
          <strong>Nota:</strong> Los archivos se almacenan temporalmente en el
          navegador. Para guardarlos permanentemente, haz clic en "Guardar" en
          la sección de acciones.
        </p>
      </Alert>
    </div>
  );
}
