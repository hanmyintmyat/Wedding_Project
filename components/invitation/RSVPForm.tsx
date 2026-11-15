"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Send } from "lucide-react";
import { rsvpSchema } from "@/lib/validations";
import type { RSVPReceipt } from "@/lib/invitation-utils";
import type { z } from "zod";
import { Reveal } from "./Reveal";

type FormInput = z.input<typeof rsvpSchema>;
type FormData = z.output<typeof rsvpSchema>;

const receiptMessage = "Your RSVP has been received.\nWe are grateful to celebrate this special moment with you.";

export default function RSVPForm({ guestName, initialRSVP }: { guestName: string; initialRSVP?: RSVPReceipt | null }) {
  const [status, setStatus] = useState<"idle" | "success" | "error">(initialRSVP ? "success" : "idle");
  const [message, setMessage] = useState(initialRSVP ? receiptMessage : "");
  const form = useForm<FormInput, undefined, FormData>({
    resolver: zodResolver(rsvpSchema),
    defaultValues: {
      guestName,
      attendanceStatus: initialRSVP?.attendanceStatus || "ACCEPTED",
      guestCount: initialRSVP?.guestCount ?? 1,
      message: ""
    }
  });

  async function onSubmit(values: FormData) {
    setStatus("idle");
    setMessage("");
    try {
      const response = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // A saved wish stays private on the server. Preserve it unless edited here.
        body: JSON.stringify({ ...values, message: form.formState.dirtyFields.message ? values.message : undefined })
      });
      if (!response.ok) throw new Error("Unable to save RSVP.");
      const saved = { ...values, guestCount: values.attendanceStatus === "DECLINED" ? 0 : values.guestCount };
      form.reset(saved);
      // Public-home submissions can also recover their receipt after a refresh.
      const url = new URL(window.location.href);
      url.searchParams.set("to", values.guestName);
      window.history.replaceState(null, "", url);
      setStatus("success");
      setMessage(receiptMessage);
    } catch {
      setStatus("error");
      setMessage("We couldn't save your RSVP right now. Please try again.");
    }
  }

  return (
    <section id="rsvp" className="bg-cream/55">
      <Reveal className="section-shell w-[min(100vw-32px,768px)]">
        <div className="text-center">
          <p className="eyebrow">RSVP</p>
          <h2 className="mt-4 font-serif text-4xl">Kindly Reply</h2>
          <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-muted">Kind reminder: each invitation is for a maximum of 2 guests, including yourself.</p>
        </div>
        <form onSubmit={form.handleSubmit(onSubmit)} onChange={() => { if (status === "success") { setStatus("idle"); setMessage(""); } }} className="mx-auto mt-10 grid max-w-3xl gap-5 rounded-[1.5rem] border border-sage/18 bg-white/62 p-4 shadow-sm sm:p-8">
          <label className="grid gap-2 text-sm font-bold text-sage">
            Guest Name
            <input className="min-h-11 rounded-xl border border-sage/20 bg-white px-4 py-3 font-normal text-ink" {...form.register("guestName")} />
            {form.formState.errors.guestName && <span className="text-xs text-red-700">{form.formState.errors.guestName.message}</span>}
          </label>
          <label className="grid gap-2 text-sm font-bold text-sage">
            Will you attend?
            <select className="min-h-11 rounded-xl border border-sage/20 bg-white px-4 py-3 font-normal text-ink" {...form.register("attendanceStatus")}>
              <option value="ACCEPTED">Joyfully Accept</option>
              <option value="DECLINED">Regretfully Decline</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-bold text-sage">
            Number of Guests
            <input type="number" min={0} max={2} aria-describedby="guest-count-help" className="min-h-11 rounded-xl border border-sage/20 bg-white px-4 py-3 font-normal text-ink" {...form.register("guestCount")} />
            <span id="guest-count-help" className="text-xs font-normal text-muted">Maximum 2 guests, including yourself.</span>
            {form.formState.errors.guestCount && <span role="alert" className="text-xs text-red-700">{form.formState.errors.guestCount.message}</span>}
          </label>
          <label className="grid gap-2 text-sm font-bold text-sage">
            Optional Message / Wedding Wish
            <textarea rows={4} className="rounded-xl border border-sage/20 bg-white px-4 py-3 font-normal text-ink" {...form.register("message")} />
          </label>
          <button className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-sage px-6 py-3 text-sm font-bold uppercase tracking-[0.18em] text-white transition hover:bg-ink disabled:opacity-60 sm:w-auto" disabled={form.formState.isSubmitting || status === "success"}>
            <Send className="h-4 w-4" /> {form.formState.isSubmitting ? "Sending..." : status === "success" ? "RSVP Received" : "Send RSVP"}
          </button>
          {message && (
            <div role={status === "error" ? "alert" : "status"} className={`rounded-2xl border px-4 py-4 text-center text-sm leading-7 ${status === "success" ? "border-sage/20 bg-sage/10 text-sage" : "border-red-200 bg-red-50 text-red-700"}`}>
              {status === "success" && <p className="font-serif text-2xl text-ink">Thank You</p>}
              <p className="whitespace-pre-line">{message}</p>
            </div>
          )}
        </form>
      </Reveal>
    </section>
  );
}
