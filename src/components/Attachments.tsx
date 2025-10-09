import { useState } from "react";
import { Card } from "./ui/Card";
import { Button } from "./ui/Button";
import { Label } from "./ui/Label";
import { Input } from "./ui/Input";

type FileItem = { name: string; size: number; type: string; url: string; isImage: boolean };

export default function Attachments(){
  const [items, setItems] = useState<FileItem[]>([]);

  const onPick: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const files = Array.from(e.target.files || []);
    const mapped = files.map(f => ({
      name: f.name,
      size: f.size,
      type: f.type,
      url: URL.createObjectURL(f),
      isImage: (f.type || "").startsWith("image/")
    }));
    setItems(prev => [...prev, ...mapped]);
    e.currentTarget.value = "";
  };

  const remove = (idx: number) => {
    setItems(prev => {
      const it = prev[idx]; if (it) URL.revokeObjectURL(it.url);
      const copy = [...prev]; copy.splice(idx, 1); return copy;
    });
  };

  const fmt = (n: number) => n < 1024 ? `${n} B` : n < 1024*1024 ? `${(n/1024).toFixed(1)} KB` : `${(n/1024/1024).toFixed(1)} MB`;

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-[260px]">
          <Label>Selecciona archivos</Label>
          <Input type="file" multiple accept="image/*,.pdf" onChange={onPick} />
        </div>
        <div className="ml-auto">
          <Button variant="secondary" onClick={()=>setItems([])}>Limpiar</Button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
        {items.map((it, i) => (
          <Card key={i} className="p-2">
            {it.isImage ? (
              <img src={it.url} alt={it.name} className="w-full h-[120px] object-cover rounded-md" />
            ) : (
              <div className="w-full h-[120px] flex items-center justify-center rounded-md bg-[color-mix(in_oklab,var(--surface)_85%,#000_15%)] border border-[hsl(var(--border))]">
                PDF
              </div>
            )}
            <div className="text-sm text-text-muted mt-2 break-all">
              {it.name}<br/>{it.type || "—"} · {fmt(it.size)}
            </div>
            <div className="flex gap-2 mt-2">
              <a href={it.url} target="_blank">
                <Button size="sm">Abrir</Button>
              </a>
              <a href={it.url} download={it.name}>
                <Button size="sm" variant="secondary">Descargar</Button>
              </a>
              <Button size="sm" variant="ghost" onClick={()=>remove(i)}>Eliminar</Button>
            </div>
          </Card>
        ))}
      </div>

      <small className="text-text-muted block mt-2">
        Ahora se guardan temporalmente (en memoria). Con Tauri los copiaremos a la carpeta <code>attachments/</code> y registraremos en SQLite.
      </small>
    </>
  );
}
