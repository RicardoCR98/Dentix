// src/components/SignatureCanvas.tsx
import { useRef, useEffect, useState } from "react";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Label } from "./ui/Label";

type SignatureCanvasProps = {
  width?: number;
  height?: number;
  onSave: (dataUrl: string) => void;
  onClear?: () => void;
  allowTextSignature?: boolean; // Nueva opción
  signerName?: string; // Para prellenar la firma textual
};

export function SignatureCanvas({
  width = 600,
  height = 200,
  onSave,
  onClear,
  allowTextSignature = false,
  signerName = "",
}: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);
  const [signatureMode, setSignatureMode] = useState<"draw" | "text">("draw");
  const [textSignature, setTextSignature] = useState(signerName);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Configure canvas for high-quality drawing
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Fill with white background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
  }, [width, height]);

  // Función para obtener coordenadas correctas considerando escala
  const getCanvasCoordinates = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
    canvas: HTMLCanvasElement
  ) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCanvasCoordinates(e, canvas);

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setIsEmpty(false);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCanvasCoordinates(e, canvas);

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear and reset white background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    setIsEmpty(true);
    setTextSignature(signerName);
    onClear?.();
  };

  const generateTextSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    // Draw text signature
    ctx.fillStyle = "#000000";
    ctx.font = "italic 32px 'Brush Script MT', cursive, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(textSignature, width / 2, height / 2);

    setIsEmpty(false);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // If in text mode, generate text signature first
    if (signatureMode === "text" && textSignature.trim()) {
      // Clear canvas
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);

      // Draw text signature directly
      ctx.fillStyle = "#000000";
      ctx.font = "italic 32px 'Brush Script MT', cursive, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(textSignature, width / 2, height / 2);

      // Immediate save after drawing
      const dataUrl = canvas.toDataURL("image/png");
      onSave(dataUrl);
    } else {
      // Convert to base64 PNG
      const dataUrl = canvas.toDataURL("image/png");
      onSave(dataUrl);
    }
  };

  const handleModeChange = (mode: "draw" | "text") => {
    setSignatureMode(mode);
    if (mode === "text" && textSignature.trim()) {
      generateTextSignature();
    } else {
      handleClear();
    }
  };

  const canSave = signatureMode === "draw" ? !isEmpty : textSignature.trim().length > 0;

  return (
    <div className="flex flex-col gap-3">
      {allowTextSignature && (
        <div className="flex gap-2 p-2 bg-gray-50 rounded-lg">
          <Button
            type="button"
            variant={signatureMode === "draw" ? "default" : "outline"}
            size="sm"
            onClick={() => handleModeChange("draw")}
          >
            Dibujar firma
          </Button>
          <Button
            type="button"
            variant={signatureMode === "text" ? "default" : "outline"}
            size="sm"
            onClick={() => handleModeChange("text")}
          >
            Firma con texto
          </Button>
        </div>
      )}

      {signatureMode === "text" && (
        <div>
          <Label>Escriba su nombre completo</Label>
          <Input
            value={textSignature}
            onChange={(e) => setTextSignature(e.target.value)}
            placeholder="Ej: Juan Pérez García"
            className="text-lg"
          />
          {textSignature.trim() && (
            <div className="mt-2 border-2 border-gray-300 rounded-lg overflow-hidden bg-white p-4">
              <p
                className="text-center text-3xl"
                style={{ fontFamily: "'Brush Script MT', cursive, sans-serif", fontStyle: "italic" }}
              >
                {textSignature}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Canvas siempre renderizado, oculto visualmente en modo texto */}
      <div
        className={`border-2 border-gray-300 rounded-lg overflow-hidden bg-white ${
          signatureMode === "text" ? "hidden" : ""
        }`}
      >
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="cursor-crosshair touch-none block"
          style={{ width: "100%", height: "auto" }}
        />
      </div>

      <div className="flex gap-2 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={handleClear}
          disabled={!canSave}
        >
          Limpiar
        </Button>
        <Button
          type="button"
          onClick={handleSave}
          disabled={!canSave}
        >
          Guardar Firma
        </Button>
      </div>

      <p className="text-sm text-gray-500 text-center">
        {signatureMode === "draw"
          ? "Firme en el recuadro arriba usando el mouse o pantalla táctil"
          : "La firma se generará automáticamente al guardar"}
      </p>
    </div>
  );
}
