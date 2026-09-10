"use client";

import { FormEvent, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, ImagePlus, Send, Check } from "lucide-react";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

type SubmitStatus = "idle" | "success";

export type EvaluationMode = "vender" | "trocar";

interface FormState {
  name: string;
  whatsapp: string;
  brand: string;
  model: string;
  year: string;
  mileage: string;
  city: string;
}

const initialState: FormState = {
  name: "",
  whatsapp: "",
  brand: "",
  model: "",
  year: "",
  mileage: "",
  city: "",
};

export function EvaluationForm({
  mode,
  onClose,
}: {
  mode: EvaluationMode | null;
  onClose: () => void;
}) {
  const [form, setForm] = useState<FormState>(initialState);
  const [photos, setPhotos] = useState<File[]>([]);
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const open = mode !== null;

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  function handleClose() {
    setStatus("idle");
    onClose();
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (status === "success") return;

    // TODO(backend): substituir este envio por uma chamada real à API/CRM
    // da Zequinha (ex.: POST /api/avaliacoes) incluindo o upload de fotos.
    // Enquanto não há backend, encaminhamos o pedido pronto via WhatsApp,
    // que já é o canal principal de atendimento da loja.
    const objective = mode === "vender" ? "vender" : "trocar";
    const message = [
      `Olá, Zequinha Veículos! Quero ${objective} meu carro.`,
      `Nome: ${form.name}`,
      `WhatsApp: ${form.whatsapp}`,
      `Veículo: ${form.brand} ${form.model} ${form.year}`.trim(),
      `KM: ${form.mileage}`,
      `Cidade: ${form.city}`,
      photos.length > 0
        ? `Fotos: ${photos.length} anexo(s) selecionado(s) (envie por aqui no WhatsApp).`
        : undefined,
    ]
      .filter(Boolean)
      .join("\n");

    window.open(buildWhatsAppUrl(message), "_blank", "noopener,noreferrer");

    // Estado de sucesso breve antes de fechar: confirma que o pedido saiu
    // em vez de sumir o modal de corte seco assim que o WhatsApp abre.
    setStatus("success");
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    window.setTimeout(() => {
      setForm(initialState);
      setPhotos([]);
      setStatus("idle");
      onClose();
    }, reduceMotion ? 400 : 900);
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[220] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 32, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-white/10 bg-graphite-900 p-7 md:p-9"
          >
            <button
              aria-label="Fechar"
              onClick={handleClose}
              className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-white/60 hover:text-white"
            >
              <X size={16} />
            </button>

            <p className="text-[11px] uppercase tracking-widest2 text-turquoise-400">
              Avaliação do veículo
            </p>
            <h3 className="mt-2 font-display text-2xl font-bold text-white sm:text-3xl">
              {mode === "vender" ? "Quero vender meu carro" : "Quero trocar meu carro"}
            </h3>

            <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-4">
              <Field label="Nome" required>
                <input
                  required
                  value={form.name}
                  onChange={set("name")}
                  className="form-input"
                  placeholder="Seu nome completo"
                />
              </Field>
              <Field label="WhatsApp" required>
                <input
                  required
                  value={form.whatsapp}
                  onChange={set("whatsapp")}
                  className="form-input"
                  placeholder="(62) 9 9999-9999"
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Marca">
                  <input value={form.brand} onChange={set("brand")} className="form-input" placeholder="Ex: Fiat" />
                </Field>
                <Field label="Modelo">
                  <input value={form.model} onChange={set("model")} className="form-input" placeholder="Ex: Toro" />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Ano">
                  <input value={form.year} onChange={set("year")} className="form-input" placeholder="2022" />
                </Field>
                <Field label="Quilometragem">
                  <input value={form.mileage} onChange={set("mileage")} className="form-input" placeholder="45.000 km" />
                </Field>
              </div>
              <Field label="Cidade">
                <input value={form.city} onChange={set("city")} className="form-input" placeholder="Trindade - GO" />
              </Field>

              <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-dashed border-white/15 px-4 py-3.5 text-sm text-white/50 transition-colors hover:border-turquoise-400/50">
                <span className="flex items-center gap-2">
                  <ImagePlus size={16} className="text-turquoise-400" />
                  {photos.length > 0
                    ? `${photos.length} foto(s) selecionada(s)`
                    : "Anexar fotos do veículo"}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => setPhotos(Array.from(e.target.files ?? []))}
                />
              </label>

              <motion.button
                type="submit"
                data-cursor="link"
                disabled={status === "success"}
                whileTap={status === "idle" ? { scale: 0.97 } : undefined}
                animate={
                  status === "success"
                    ? { backgroundColor: "#7ee8dc" }
                    : { backgroundColor: "#22c7b5" }
                }
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="mt-2 flex items-center justify-center gap-2 rounded-full px-6 py-4 text-sm font-semibold uppercase tracking-wide text-black"
              >
                <AnimatePresence mode="wait" initial={false}>
                  {status === "success" ? (
                    <motion.span
                      key="success"
                      initial={{ opacity: 0, scale: 0.6 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: "spring", stiffness: 320, damping: 18 }}
                      className="flex items-center gap-2"
                    >
                      <Check size={15} strokeWidth={2.5} />
                      Enviado! Abrindo WhatsApp…
                    </motion.span>
                  ) : (
                    <motion.span
                      key="idle"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="flex items-center gap-2"
                    >
                      <Send size={15} />
                      Solicitar Avaliação
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] uppercase tracking-wide text-white/40">
        {label}
        {required && <span className="text-turquoise-400"> *</span>}
      </span>
      {children}
    </label>
  );
}
