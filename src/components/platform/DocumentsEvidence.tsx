"use client";

import { useRef, useState } from "react";
import {
  Check,
  Download,
  Eye,
  FileText,
  Loader2,
  MoreHorizontal,
  Plus,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { API_BASE_URL } from "@/lib/platform/client";
import { DocumentUploader, type PendingDocument } from "@/components/platform/DocumentUploader";
import type { RequestDocument } from "@/types/platform";

function formatBytes(bytes?: number): string {
  if (!bytes) return "—";
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}

function statusBadge(status: string) {
  const s = status.toUpperCase();
  if (s === "VERIFIED") return "bg-lime/25 text-ink";
  if (s === "PENDING" || s === "UNDER REVIEW") return "bg-cyan/15 text-cyan-900";
  if (s === "REJECTED") return "bg-destructive/10 text-destructive";
  return "bg-muted text-muted-foreground";
}

function statusLabel(status: string) {
  const s = status.toUpperCase();
  if (s === "VERIFIED") return "Verified";
  if (s === "PENDING") return "Under review";
  if (s === "MISSING") return "Missing";
  if (s === "REJECTED") return "Rejected";
  return status.replace(/_/g, " ");
}

interface DocumentsEvidenceProps {
  documents: RequestDocument[];
  token: string;
  requestId: string;
  onRefresh: () => void;
}

export function DocumentsEvidence({ documents, token, requestId, onRefresh }: DocumentsEvidenceProps) {
  const [showUpload, setShowUpload] = useState(false);
  const [pending, setPending] = useState<PendingDocument[]>([]);
  const [uploading, setUploading] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  async function handleUploadComplete() {
    if (pending.length === 0) return;
    setUploading(true);
    try {
      for (const doc of pending) {
        const form = new FormData();
        form.append("file", doc.file);
        form.append("document_type", doc.documentType);
        const res = await fetch(`${API_BASE_URL}/production-requests/${requestId}/documents`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: form,
        });
        if (!res.ok) throw new Error("Upload failed");
      }
      setPending([]);
      setShowUpload(false);
      onRefresh();
    } finally {
      setUploading(false);
    }
  }

  return (
    <section className="rounded-[1.25rem] border border-foreground/10 bg-white p-6 md:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-semibold tracking-tight">Documents & Evidence</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Supporting documents used to validate the production and financing request.
          </p>
          <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {documents.length} document{documents.length === 1 ? "" : "s"} submitted
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {documents.map((doc) => (
          <div key={doc.id} className="flex flex-wrap items-center gap-4 rounded-xl border border-foreground/8 p-4 transition hover:border-foreground/15">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-2">
              {doc.verification_status === "VERIFIED" ? (
                <Check className="h-5 w-5 text-lime-deep" />
              ) : (
                <FileText className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold">{doc.document_type.replace(/_/g, " ")}</p>
                <span className={cn("rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide", statusBadge(doc.verification_status))}>
                  {statusLabel(doc.verification_status)}
                </span>
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">{doc.document_name}</p>
              <p className="text-xs text-muted-foreground">{formatBytes(doc.file_size_bytes)}</p>
            </div>
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen(menuOpen === doc.id ? null : doc.id)}
                className="rounded-full border border-foreground/10 p-2 hover:bg-muted"
                aria-label="Document actions"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
              {menuOpen === doc.id ? (
                <div className="absolute right-0 z-10 mt-1 w-36 rounded-xl border border-foreground/10 bg-white py-1 shadow-lg">
                  {doc.storage_path ? (
                    <>
                      <a
                        href={`${API_BASE_URL}/production-requests/${requestId}/documents/${doc.id}/download`}
                        className="flex items-center gap-2 px-3 py-2 text-xs hover:bg-muted"
                        onClick={(e) => {
                          e.preventDefault();
                          fetch(`${API_BASE_URL}/production-requests/${requestId}/documents/${doc.id}/download`, {
                            headers: { Authorization: `Bearer ${token}` },
                          })
                            .then((r) => r.blob())
                            .then((blob) => {
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement("a");
                              a.href = url;
                              a.download = doc.document_name;
                              a.click();
                            });
                        }}
                      >
                        <Download className="h-3.5 w-3.5" /> Download
                      </a>
                      <button type="button" className="flex w-full items-center gap-2 px-3 py-2 text-xs hover:bg-muted">
                        <Eye className="h-3.5 w-3.5" /> View
                      </button>
                    </>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      {showUpload ? (
        <div className="mt-6 space-y-4 border-t border-foreground/8 pt-6">
          <DocumentUploader token={token} requestId={requestId} value={pending} onChange={setPending} />
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleUploadComplete}
              disabled={uploading || pending.length === 0}
              className="inline-flex items-center gap-2 rounded-full bg-lime px-5 py-2.5 text-sm font-semibold text-ink transition hover:-translate-y-0.5 disabled:opacity-50"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {uploading ? "Uploading…" : "Save documents"}
            </button>
            <button type="button" onClick={() => setShowUpload(false)} className="text-sm text-muted-foreground hover:text-ink">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowUpload(true)}
          className="mt-6 inline-flex items-center gap-2 rounded-full border border-dashed border-foreground/20 px-4 py-2.5 text-sm font-medium text-muted-foreground transition hover:border-lime hover:text-ink"
        >
          <Plus className="h-4 w-4" />
          Upload supporting document
        </button>
      )}
    </section>
  );
}
