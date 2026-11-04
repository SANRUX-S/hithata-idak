"use client";

import { useState } from "react";
import type { IncidentReport, Volunteer, VolunteerApplication } from "@/lib/types";

const fieldClass = "w-full rounded-xl border border-[#DAD5E4] bg-white px-3 py-2.5 text-sm leading-relaxed";
const buttonClass = "rounded-xl bg-[#25234A] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#383466] disabled:cursor-wait disabled:opacity-50";

export async function saveAdminAction(path: string, body: unknown) {
  const token = typeof window !== "undefined" ? localStorage.getItem("hid_supporter_session") : null;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["x-supporter-session"] = token;

  const response = await fetch(path, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "The change could not be saved. Please try again.");
  return data;
}

export function ReviewControls({ endpoint, status, notes, options, notesLabel, onSaved }: {
  endpoint: string;
  status: string;
  notes?: string | null;
  options: { value: string; label: string }[];
  notesLabel: string;
  onSaved: () => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  return <form key={`${status}:${notes || ""}`} className="mt-4 grid gap-3 border-t border-[#E8E5DF] pt-4 sm:grid-cols-[minmax(160px,1fr)_2fr_auto]" onSubmit={async (event) => {
    event.preventDefault();
    if (pending) return;
    const values = new FormData(event.currentTarget);
    setPending(true); setError(""); setSuccess("");
    try {
      await saveAdminAction(endpoint, { status: values.get("status"), notes: values.get("notes"), resolutionNotes: values.get("notes") });
      setSuccess("Review saved."); onSaved();
    } catch (error: unknown) { setError(error instanceof Error ? error.message : "Unable to save the review."); }
    finally { setPending(false); }
  }}>
    <label className="space-y-1.5 text-sm font-semibold">Review status
      <select name="status" defaultValue={status} className={fieldClass} disabled={pending}>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
    </label>
    <label className="space-y-1.5 text-sm font-semibold">{notesLabel}
      <textarea name="notes" defaultValue={notes || ""} maxLength={2000} rows={2} className={fieldClass} disabled={pending} placeholder="Internal review notes (optional)" />
    </label>
    <button type="submit" disabled={pending} className={`${buttonClass} self-end`}>{pending ? "Saving…" : "Save review"}</button>
    {error && <p role="alert" className="text-sm text-red-800 sm:col-span-3">{error}</p>}
    {success && <p role="status" className="text-sm text-emerald-800 sm:col-span-3">{success}</p>}
  </form>;
}

export function IncidentReview({ report, onSaved }: { report: IncidentReport; onSaved: () => void }) {
  return <article className="rounded-2xl border border-[#E8E5DF] bg-white p-5 sm:p-6">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h3 className="font-bold capitalize">{report.report_type.replaceAll("_", " ")}</h3>
      <span className="rounded-full bg-[#EDE7F6] px-3 py-1 text-sm font-semibold">{report.status.replaceAll("_", " ")}</span>
    </div>
    <p className="mt-2 text-sm text-[#5B5875]">{report.ticket_ref || "No conversation reference"} · {report.contact_email || "Anonymous"} · {new Date(report.created_at).toLocaleString()}</p>
    <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed">{report.description}</p>
    <ReviewControls endpoint={`/api/portal/admin/incident-reports/${report.id}`} status={report.status} notes={report.resolution_notes} notesLabel="Resolution / handover notes" options={[
      { value: "open", label: "Open" }, { value: "under_review", label: "Under review" }, { value: "resolved", label: "Resolved" },
    ]} onSaved={onSaved} />
  </article>;
}

export function ApplicationReview({ application, onSaved }: { application: VolunteerApplication; onSaved: () => void }) {
  return <><ReviewControls endpoint={`/api/portal/admin/applications/${application.id}`} status={application.status} notes={application.notes} notesLabel="Interview / screening notes" options={[
    { value: "pending", label: "Pending review" }, { value: "interview_scheduled", label: "Interview scheduled" },
    { value: "training", label: "In training" }, { value: "approved", label: "Approved" }, { value: "rejected", label: "Rejected" },
  ]} onSaved={onSaved} /><p className="mt-3 text-sm leading-relaxed text-[#5B5875]">Approval records your screening decision. An administrator can then create the supporter&apos;s login in Volunteer Roster.</p></>;
}

export function VolunteerStatusControls({ volunteer, currentUserId, onSaved }: { volunteer: Volunteer; currentUserId: string; onSaved: () => void }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const isSelf = volunteer.id === currentUserId;
  async function update(isActive: boolean, isApproved: boolean) {
    if (pending) return;
    setPending(true); setError("");
    try { await saveAdminAction(`/api/portal/admin/volunteers/${volunteer.id}/status`, { isActive, isApproved }); onSaved(); }
    catch (error: unknown) { setError(error instanceof Error ? error.message : "Unable to update account access."); }
    finally { setPending(false); }
  }
  return <div className="min-w-44 space-y-2">
    {isSelf ? <span className="text-sm text-[#5B5875]">Your account</span> : <div className="flex flex-wrap gap-2">
      <button type="button" disabled={pending} onClick={() => { void update(!volunteer.is_active, Boolean(volunteer.is_approved)); }} className="rounded-lg border border-[#DAD5E4] px-3 py-2 text-sm font-semibold disabled:opacity-50">{volunteer.is_active ? "Suspend" : "Activate"}</button>
      <button type="button" disabled={pending} onClick={() => { void update(Boolean(volunteer.is_active), !volunteer.is_approved); }} className="rounded-lg border border-[#DAD5E4] px-3 py-2 text-sm font-semibold disabled:opacity-50">{volunteer.is_approved ? "Revoke approval" : "Approve"}</button>
    </div>}
    {error && <p role="alert" className="max-w-xs text-sm text-red-800">{error}</p>}
  </div>;
}
