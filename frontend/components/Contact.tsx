"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, MessageCircle, CheckCircle2, Loader2 } from "lucide-react";
import Reveal from "./ui/Reveal";
import MagneticButton from "./ui/MagneticButton";
import { site } from "@/lib/site.config";
import { supabase } from "@/lib/supabase";

type Status = "idle" | "loading" | "success" | "error";

export default function Contact() {
  const [status, setStatus] = useState<Status>("idle");
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;

    setStatus("loading");

    if (!supabase) {
      // Sem Supabase configurado: cai para o envio via e-mail.
      window.location.href = `mailto:${site.email}?subject=Novo contato via site&body=${encodeURIComponent(
        `${form.name} (${form.email})\n\n${form.message}`
      )}`;
      setStatus("success");
      return;
    }

    const { error } = await supabase.from("leads").insert({
      name: form.name,
      email: form.email,
      message: form.message,
    });

    if (error) {
      setStatus("error");
      return;
    }

    setStatus("success");
    setForm({ name: "", email: "", message: "" });
  }

  return (
    <section id="contato" className="relative px-6 py-28">
      <div className="mx-auto max-w-4xl">
        <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-surface p-8 sm:p-14">
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-violet-500/20 blur-[100px] animate-blob" />
          <div className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-aqua-500/15 blur-[100px] animate-blob [animation-delay:5s]" />

          <Reveal>
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-400">
              Contato
            </span>
            <h2 className="mt-4 max-w-lg font-display text-3xl font-bold sm:text-4xl">
              Tem um problema para resolver? Vamos conversar.
            </h2>
            <p className="mt-4 max-w-md text-sm text-white/55">
              Conte um pouco sobre seu projeto e eu retorno em até 24h.
            </p>
          </Reveal>

          <div className="relative mt-10 grid gap-10 md:grid-cols-2">
            <Reveal delay={0.1}>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <input
                  required
                  placeholder="Seu nome"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition-colors focus:border-violet-400"
                />
                <input
                  required
                  type="email"
                  placeholder="Seu e-mail"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition-colors focus:border-violet-400"
                />
                <textarea
                  required
                  rows={4}
                  placeholder="Conte sobre seu projeto ou problema"
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition-colors focus:border-violet-400"
                />

                <MagneticButton
                  type="submit"
                  className="mt-2 w-full justify-center bg-white text-ink"
                >
                  <AnimatePresence mode="wait" initial={false}>
                    {status === "loading" ? (
                      <motion.span
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-2"
                      >
                        <Loader2 className="h-4 w-4 animate-spin" /> Enviando...
                      </motion.span>
                    ) : status === "success" ? (
                      <motion.span
                        key="success"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-2"
                      >
                        <CheckCircle2 className="h-4 w-4" /> Mensagem enviada!
                      </motion.span>
                    ) : (
                      <motion.span key="idle" exit={{ opacity: 0 }}>
                        Enviar mensagem
                      </motion.span>
                    )}
                  </AnimatePresence>
                </MagneticButton>

                {status === "error" && (
                  <p className="text-xs text-red-400">
                    Algo deu errado. Tente novamente ou use o e-mail ao lado.
                  </p>
                )}
              </form>
            </Reveal>

            <Reveal delay={0.2} className="flex flex-col justify-center gap-4">
              <a
                href={`mailto:${site.email}`}
                className="group flex items-center gap-4 rounded-2xl border border-white/10 p-4 transition-colors hover:border-white/30"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/5 text-aqua-400">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-medium">E-mail</div>
                  <div className="text-xs text-white/50">{site.email}</div>
                </div>
              </a>

              <a
                href={`https://wa.me/${site.whatsapp}`}
                target="_blank"
                rel="noreferrer"
                className="group flex items-center gap-4 rounded-2xl border border-white/10 p-4 transition-colors hover:border-white/30"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/5 text-violet-400">
                  <MessageCircle className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-medium">WhatsApp</div>
                  <div className="text-xs text-white/50">Resposta rápida</div>
                </div>
              </a>

              <p className="px-1 text-xs text-white/40">{site.location}</p>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
