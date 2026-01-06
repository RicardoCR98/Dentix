// src/components/InformedConsentModal.tsx
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogFooter } from "./ui/Dialog";
import { Button } from "./ui/Button";
import { Label } from "./ui/Label";
import { Input } from "./ui/Input";
import { Textarea } from "./ui/Textarea";
import { SelectRoot, SelectTrigger, SelectContent, SelectItem } from "./ui/Select";
import { SignatureCanvas } from "./SignatureCanvas";
import type { ConsentTemplate, InformedConsent, Patient, Signer } from "../lib/types";
import { invoke } from "@tauri-apps/api/core";
import { useToast } from "../hooks/useToast";

type InformedConsentModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: Patient;
  visitId?: number;
  onConsentCreated?: () => void;
};

export function InformedConsentModal({
  open,
  onOpenChange,
  patient,
  visitId,
  onConsentCreated,
}: InformedConsentModalProps) {
  const toast = useToast();
  const [templates, setTemplates] = useState<ConsentTemplate[]>([]);
  const [signers, setSigners] = useState<Signer[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [selectedTemplate, setSelectedTemplate] = useState<ConsentTemplate | null>(null);

  // Form state
  const [procedureName, setProcedureName] = useState("");
  const [consentText, setConsentText] = useState("");
  const [signedBy, setSignedBy] = useState(patient.full_name || "");
  const [doctorId, setDoctorId] = useState<string>("");
  const [doctorName, setDoctorName] = useState("");
  const [witnessName, setWitnessName] = useState("");
  const [witnessSignature, setWitnessSignature] = useState("");
  const [notes, setNotes] = useState("");
  const [signatureData, setSignatureData] = useState("");

  // UI state
  const [step, setStep] = useState<"template" | "form" | "signature">("template");
  const [loading, setLoading] = useState(false);
  const [showWitnessSignature, setShowWitnessSignature] = useState(false);

  // Load templates and signers on mount
  useEffect(() => {
    if (open) {
      loadTemplates();
      loadSigners();
      // Reset form when opening
      setStep("template");
      setSelectedTemplateId("");
      setSelectedTemplate(null);
      setProcedureName("");
      setSignedBy(patient.full_name || "");
      setDoctorId("");
      setDoctorName("");
      setWitnessName("");
      setWitnessSignature("");
      setNotes("");
      setSignatureData("");
      setShowWitnessSignature(false);
    }
  }, [open, patient.full_name]);

  const loadTemplates = async () => {
    try {
      const result = await invoke<ConsentTemplate[]>("get_consent_templates");
      setTemplates(result);
    } catch (error) {
      console.error("Error loading consent templates:", error);
      toast.error("Error", "No se pudieron cargar las plantillas");
    }
  };

  const loadSigners = async () => {
    try {
      const result = await invoke<Signer[]>("get_signers");
      setSigners(result.filter((s) => s.active !== false));
    } catch (error) {
      console.error("Error loading signers:", error);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);

    const template = templates.find((t) => t.id?.toString() === templateId);
    if (template) {
      setSelectedTemplate(template);

      // Replace template variables with patient data
      let replacedText = template.content;
      replacedText = replacedText.replace(/{paciente}/g, patient.full_name || "");
      replacedText = replacedText.replace(/{cedula}/g, patient.doc_id || "");
      replacedText = replacedText.replace(/{fecha}/g, new Date().toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }));

      setConsentText(replacedText);
    }
  };

  const handleProcedureNameChange = (value: string) => {
    setProcedureName(value);
    // Replace {procedimiento} variable in real-time
    if (selectedTemplate) {
      let replacedText = selectedTemplate.content;
      replacedText = replacedText.replace(/{paciente}/g, patient.full_name || "");
      replacedText = replacedText.replace(/{cedula}/g, patient.doc_id || "");
      replacedText = replacedText.replace(/{fecha}/g, new Date().toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }));
      replacedText = replacedText.replace(/{procedimiento}/g, value);
      replacedText = replacedText.replace(/{doctor}/g, doctorName);

      setConsentText(replacedText);
    }
  };

  const handleDoctorChange = (signerId: string) => {
    setDoctorId(signerId);
    const signer = signers.find((s) => s.id?.toString() === signerId);
    const name = signer?.name || "";
    setDoctorName(name);

    // Replace {doctor} variable in real-time
    if (selectedTemplate) {
      let replacedText = selectedTemplate.content;
      replacedText = replacedText.replace(/{paciente}/g, patient.full_name || "");
      replacedText = replacedText.replace(/{cedula}/g, patient.doc_id || "");
      replacedText = replacedText.replace(/{fecha}/g, new Date().toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }));
      replacedText = replacedText.replace(/{procedimiento}/g, procedureName);
      replacedText = replacedText.replace(/{doctor}/g, name);

      setConsentText(replacedText);
    }
  };

  const handleNextStep = () => {
    if (step === "template" && selectedTemplate) {
      setStep("form");
    } else if (step === "form") {
      setStep("signature");
    }
  };

  const handlePreviousStep = () => {
    if (step === "signature") {
      setStep("form");
    } else if (step === "form") {
      setStep("template");
    }
  };

  const handleSaveSignature = (dataUrl: string) => {
    setSignatureData(dataUrl);
  };

  const handleSaveConsent = async () => {
    if (!signatureData) {
      toast.error("Firma requerida", "Por favor, firme el consentimiento antes de guardar");
      return;
    }

    if (!patient.id) {
      toast.error("Error", "ID de paciente no disponible");
      return;
    }

    setLoading(true);
    try {
      const consent: InformedConsent = {
        patient_id: patient.id,
        visit_id: visitId,
        procedure_type: selectedTemplate?.procedure_type || "",
        procedure_name: procedureName || undefined,
        consent_template: selectedTemplate?.name || "",
        consent_text: consentText,
        signature_data: signatureData,
        signed_by: signedBy,
        signed_at: new Date().toISOString(),
        witness_name: witnessName || undefined,
        witness_signature: witnessSignature || undefined,
        doctor_name: doctorName || undefined,
        notes: notes || undefined,
      };

      await invoke("create_informed_consent", { consent });

      toast.success("Consentimiento guardado", "El consentimiento informado se ha guardado correctamente");
      onConsentCreated?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving informed consent:", error);
      toast.error("Error al guardar", String(error));
    } finally {
      setLoading(false);
    }
  };

  const renderTemplateStep = () => (
    <DialogContent>
      <div className="space-y-4">
        <div>
          <Label htmlFor="template">Seleccione una plantilla de consentimiento</Label>
          <SelectRoot value={selectedTemplateId} onValueChange={handleTemplateSelect}>
            <SelectTrigger />
            <SelectContent>
              {templates.map((template) => (
                <SelectItem key={template.id} value={template.id?.toString() || `template-${template.id}`}>
                  {template.name}
                </SelectItem>
              ))}
            </SelectContent>
          </SelectRoot>
        </div>

        {selectedTemplate && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-lg mb-2">{selectedTemplate.title}</h3>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">
              {selectedTemplate.content.substring(0, 300)}...
            </p>
          </div>
        )}
      </div>

      <DialogFooter>
        <Button variant="ghost" onClick={() => onOpenChange(false)}>
          Cancelar
        </Button>
        <Button onClick={handleNextStep} disabled={!selectedTemplate}>
          Siguiente
        </Button>
      </DialogFooter>
    </DialogContent>
  );

  const renderFormStep = () => (
    <DialogContent>
      <div className="space-y-4">
        {/* Grid de 2 columnas para campos del formulario */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="procedureName">Nombre del procedimiento específico</Label>
            <Input
              id="procedureName"
              value={procedureName}
              onChange={(e) => handleProcedureNameChange(e.target.value)}
              placeholder="Ej: Extracción de molar 46"
            />
          </div>

          <div>
            <Label htmlFor="doctorSelect">Doctor/a que realiza el procedimiento</Label>
            <SelectRoot value={doctorId} onValueChange={handleDoctorChange}>
              <SelectTrigger />
              <SelectContent>
                {signers.map((signer) => (
                  <SelectItem key={signer.id} value={signer.id?.toString() || ""}>
                    {signer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </SelectRoot>
          </div>

          <div>
            <Label htmlFor="signedBy">Nombre del paciente que firma</Label>
            <Input
              id="signedBy"
              value={signedBy}
              onChange={(e) => setSignedBy(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="witnessName">Nombre del testigo (opcional)</Label>
            <Input
              id="witnessName"
              value={witnessName}
              onChange={(e) => setWitnessName(e.target.value)}
              placeholder="Nombre del testigo"
            />
          </div>
        </div>

        {/* Notas a ancho completo */}
        <div>
          <Label htmlFor="notes">Notas adicionales (opcional)</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Información adicional relevante"
          />
        </div>

        {/* Texto del consentimiento a ancho completo */}
        <div>
          <Label htmlFor="consentText">Texto del consentimiento</Label>
          <Textarea
            id="consentText"
            value={consentText}
            onChange={(e) => setConsentText(e.target.value)}
            rows={10}
            className="font-mono text-sm"
          />
          <p className="text-xs text-gray-500 mt-1">
            Puede editar el texto si es necesario
          </p>
        </div>
      </div>

      <DialogFooter>
        <Button variant="secondary" onClick={handlePreviousStep}>
          Anterior
        </Button>
        <Button onClick={handleNextStep}>
          Siguiente: Firmar
        </Button>
      </DialogFooter>
    </DialogContent>
  );

  const renderSignatureStep = () => (
    <DialogContent>
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-lg mb-2">Firma del Paciente</h3>
          <p className="text-sm text-gray-600 mb-4">
            {signedBy} debe firmar a continuación para autorizar el consentimiento.
          </p>

          <SignatureCanvas
            width={600}
            height={200}
            onSave={handleSaveSignature}
            onClear={() => setSignatureData("")}
            allowTextSignature={true}
            signerName={signedBy}
          />
        </div>

        {witnessName && (
          <div className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-lg">Firma del Testigo (Opcional)</h3>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setShowWitnessSignature(!showWitnessSignature)}
              >
                {showWitnessSignature ? "Ocultar" : "Mostrar"} firma testigo
              </Button>
            </div>

            {showWitnessSignature && (
              <SignatureCanvas
                width={600}
                height={200}
                onSave={setWitnessSignature}
                onClear={() => setWitnessSignature("")}
                allowTextSignature={true}
                signerName={witnessName}
              />
            )}
          </div>
        )}

        {signatureData && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">
              ✓ Firma del paciente capturada correctamente
            </p>
          </div>
        )}
      </div>

      <DialogFooter>
        <Button variant="ghost" onClick={handlePreviousStep}>
          Anterior
        </Button>
        <Button
          onClick={handleSaveConsent}
          disabled={!signatureData || loading}
        >
          {loading ? "Guardando..." : "Guardar Consentimiento"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={
        step === "template"
          ? "Nuevo Consentimiento Informado"
          : step === "form"
            ? "Completar Información"
            : "Firmar Consentimiento"
      }
      description={
        step === "template"
          ? "Seleccione el tipo de procedimiento"
          : step === "form"
            ? "Complete los datos del procedimiento"
            : "Capture la firma del paciente"
      }
      size="3xl"
    >
      {step === "template" && renderTemplateStep()}
      {step === "form" && renderFormStep()}
      {step === "signature" && renderSignatureStep()}
    </Dialog>
  );
}
