import { useMemo, useState } from "react";
import { Upload, File, Image, FileText, X, Paperclip } from "lucide-react";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";
import { Alert } from "./ui/Alert";
import { cn } from "../lib/cn";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/Tabs";
import type { AttachmentFile } from "../lib/types";

interface Props {
  files: AttachmentFile[];
  onFilesChange: (files: AttachmentFile[]) => void;
  readOnly?: boolean;
}

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

export default function Attachments({ files, onFilesChange, readOnly }: Props) {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!readOnly) {
      setDragActive(e.type === "dragenter" || e.type === "dragover");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    if (readOnly) return;
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (readOnly || !e.target.files?.length) return;
    handleFiles(e.target.files);
  };

  const handleFiles = (fileList: FileList) => {
    const newFiles: AttachmentFile[] = Array.from(fileList).map((file) => ({
      id: crypto.randomUUID(),
      name: file.name,
      size: file.size,
      type: file.type,
      file,
      url: URL.createObjectURL(file),
      uploadDate: new Date().toISOString(),
    }));
    onFilesChange([...files, ...newFiles]);
  };

  const removeFile = (id: string) => {
    if (readOnly) return;
    onFilesChange(files.filter((f) => f.id !== id));
  };

  const clearAll = () => {
    if (readOnly) return;
    onFilesChange([]);
  };

  const totalSize = files.reduce((acc, f) => acc + f.size, 0);
  const images = useMemo(
    () => files.filter((f) => f.type?.startsWith("image/")),
    [files],
  );
  const docs = useMemo(
    () => files.filter((f) => !f.type?.startsWith("image/")),
    [files],
  );

  const FileCard = ({ file }: { file: AttachmentFile }) => {
    const isNew = !!file.file;
    const isImage = file.type?.startsWith("image/");
    const fileName = file.name || file.name || "Archivo";

    return (
      <div
        className={cn(
          "relative group rounded-lg border transition-all duration-200",
          "hover:shadow-md hover:border-[hsl(var(--primary)/0.5)]",
          isNew
            ? "bg-[hsl(var(--success)/0.05)] border-[hsl(var(--success))]"
            : "bg-[hsl(var(--card))] border-[hsl(var(--border))]",
        )}
      >
        <div className="p-4 flex items-center gap-3">
          {/* Thumbnail / Icon */}
          <div className="w-16 h-16 rounded-lg bg-[hsl(var(--muted))] flex items-center justify-center flex-shrink-0 overflow-hidden">
            {isImage ? (
              <img
                src={file.url}
                alt={fileName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-[hsl(var(--primary))]">
                {getFileIcon(file.type)}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h4
                className="font-medium text-sm truncate flex-1"
                title={fileName}
              >
                {fileName}
              </h4>
              <Badge
                variant={isNew ? "success" : "info"}
                className="text-xs flex-shrink-0"
              >
                {isNew ? "Nuevo" : getFileTypeLabel(file.type)}
              </Badge>
            </div>
            <div className="text-xs text-[hsl(var(--muted-foreground))]">
              <span className="font-medium">{formatFileSize(file.size)}</span>
              <span className="mx-1">•</span>
              <span>{new Date(file.uploadDate).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Delete Button */}
          {!readOnly && (
            <button
              onClick={() => removeFile(file.id)}
              className={cn(
                "p-2 rounded-md transition-all opacity-0 group-hover:opacity-100",
                "hover:bg-red-500/10 text-red-600 hover:text-red-700",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500",
              )}
              aria-label="Eliminar archivo"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>
    );
  };

  const EmptyState = ({ type }: { type: "images" | "docs" }) => (
    <div className="py-8 text-center">
      <div className="mx-auto w-12 h-12 rounded-full bg-[hsl(var(--muted))] flex items-center justify-center mb-3">
        {type === "images" ? (
          <Image size={24} className="text-[hsl(var(--muted-foreground))]" />
        ) : (
          <File size={24} className="text-[hsl(var(--muted-foreground))]" />
        )}
      </div>
      <p className="text-sm text-[hsl(var(--muted-foreground))]">
        {readOnly
          ? `No hay ${type === "images" ? "imágenes" : "documentos"} para esta visita.`
          : `No hay ${type === "images" ? "imágenes" : "documentos"}. Arrastra archivos arriba o usa el selector.`}
      </p>
    </div>
  );

  return (
    <div className={cn("space-y-4", readOnly && "opacity-75")}>
      {/* Summary Card */}
      {files.length > 0 && (
        <div className="flex items-center justify-between p-4 rounded-lg bg-[hsl(var(--muted))] border border-[hsl(var(--border))]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[hsl(var(--primary)/0.1)] flex items-center justify-center">
              <Paperclip size={18} className="text-[hsl(var(--primary))]" />
            </div>
            <div>
              <div className="font-medium text-sm">
                {files.length} archivo{files.length !== 1 ? "s" : ""}
              </div>
              <div className="text-xs text-[hsl(var(--muted-foreground))]">
                {formatFileSize(totalSize)} total
              </div>
            </div>
          </div>

          {!readOnly && files.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAll}
              className="text-red-600 hover:bg-red-500/10 hover:text-red-700"
            >
              <X size={16} />
              <span className="hidden sm:inline">Limpiar todo</span>
            </Button>
          )}
        </div>
      )}

      {/* Dropzone */}
      {!readOnly && (
        <div
          className={cn(
            "relative border-2 border-dashed rounded-lg p-8 transition-all duration-200",
            dragActive
              ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.05)]"
              : "border-[hsl(var(--border))] hover:border-[hsl(var(--primary)/0.5)]",
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            multiple
            accept="image/*,.pdf,.doc,.docx"
            onChange={handleChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            id="file-upload"
            disabled={readOnly}
          />

          <div className="text-center">
            <div
              className={cn(
                "mx-auto w-16 h-16 rounded-lg flex items-center justify-center mb-4 transition-colors",
                dragActive
                  ? "bg-[hsl(var(--primary))] text-white"
                  : "bg-[hsl(var(--muted))] text-[hsl(var(--primary))]",
              )}
            >
              <Upload size={32} />
            </div>

            <h3 className="text-base font-semibold mb-1">
              Arrastra archivos aquí
            </h3>

            <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4">
              o haz clic para seleccionar • Formatos: Imágenes, PDF, Word
            </p>

            <label htmlFor="file-upload" className="cursor-pointer">
              <Button variant="secondary" size="sm" className="cursor-pointer">
                <span className="flex items-center gap-2">
                  <Paperclip size={16} />
                  Seleccionar archivos
                </span>
              </Button>
            </label>
          </div>
        </div>
      )}

      {/* Tabs */}
      {files.length > 0 && (
        <Tabs defaultValue="images" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="images" className="relative">
              Imágenes / Rx
              {images.length > 0 && (
                <Badge
                  variant="info"
                  className="ml-2 px-1.5 h-5 min-w-5 flex items-center justify-center text-xs"
                >
                  {images.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="docs" className="relative">
              Documentos
              {docs.length > 0 && (
                <Badge
                  variant="info"
                  className="ml-2 px-1.5 h-5 min-w-5 flex items-center justify-center text-xs"
                >
                  {docs.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="images" className="space-y-3 mt-4">
            {images.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-3">
                {images.map((file) => (
                  <FileCard key={file.id} file={file} />
                ))}
              </div>
            ) : (
              <EmptyState type="images" />
            )}
          </TabsContent>

          <TabsContent value="docs" className="space-y-3 mt-4">
            {docs.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-3">
                {docs.map((file) => (
                  <FileCard key={file.id} file={file} />
                ))}
              </div>
            ) : (
              <EmptyState type="docs" />
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Info Alert */}
      {!readOnly && (
        <Alert variant="info" className="text-sm">
          <strong>Tip:</strong> Los archivos se guardarán cuando guardes la
          historia clínica. Puedes adjuntar imágenes, radiografías y documentos
          relevantes al tratamiento.
        </Alert>
      )}
    </div>
  );
}
