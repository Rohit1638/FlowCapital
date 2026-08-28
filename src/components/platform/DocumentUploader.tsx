"use client";

import { useCallback, useRef, useState } from "react";
import { Check, FileText, Loader2, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { API_BASE_URL } from "@/lib/platform/client";

export const DOCUMENT_TYPES = [
  "PURCHASE_ORDER",
  "INVOICE",
  "GST_CERTIFICATE",
  "PRODUCTION_PLAN",
  "INVENTORY_STATEMENT",
  "ASSET_OWNERSHIP_PROOF",
  "BANK_STATEMENT",
  "SHIPPING_DOCUMENT",
  "OTHER",
] as const;

export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export interface PendingDocument {
  id: string;
  file: File;
  documentType: DocumentType;
  status: "pending" | "uploading" | "uploaded" | "error";
  progress: number;
  error?: string;
  serverId?: string;
}

const ACCEPT = ".pdf,.doc,.docx,.png,.jpg,.jpeg";
const MAX_BYTES = 15 * 1024 * 1024;

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}

interface DocumentUploaderProps {
  token?: string;
  requestId?: string;
  value: PendingDocument[];
  onChange: (docs: PendingDocument[]) => void;
  className?: string;
}

export function DocumentUploader({ token, requestId, value, onChange, className }: DocumentUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const addFiles = useCallback(
    (files: FileList | File[]) => {
      const next = [...value];
      for (const file of Array.from(files)) {
        const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
        if (!["pdf", "doc", "docx", "png", "jpg", "jpeg"].includes(ext)) continue;
        if (file.size > MAX_BYTES) continue;
        next.push({
          id: `${Date.now()}-${file.name}`,
          file,
          documentType: "OTHER",
          status: "pending",
          progress: 0,
        });
      }
      onChange(next);
    },
    [value, onChange],
  );

  async function uploadOne(doc: PendingDocument) {
    if (!token || !requestId) return doc;
    const form = new FormData();
    form.append("file", doc.file);
    form.append("document_type", doc.documentType);
    onChange(value.map((d) => (d.id === doc.id ? { ...d, status: "uploading", progress: 30 } : d)));
    try {
      const res = await fetch(`${API_BASE_URL}/production-requests/${requestId}/documents`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      onChange(
        value.map((d) =>
          d.id === doc.id ? { ...d, status: "uploaded", progress: 100, serverId: data.id } : d,
        ),
      );
      return { ...doc, status: "uploaded" as const, serverId: data.id };
    } catch {
      onChange(value.map((d) => (d.id === doc.id ? { ...d, status: "error", error: "Unable to upload. Try again." } : d)));
      return doc;
    }
  }

  function remove(id: string) {
    onChange(value.filter((d) => d.id !== id));
  }

  function updateType(id: string, documentType: DocumentType) {
    onChange(value.map((d) => (d.id === id ? { ...d, documentType } : d)));
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          addFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "cursor-pointer rounded-[1.25rem] border-2 border-dashed p-8 text-center transition",
          dragOver ? "border-lime bg-lime/10" : "border-foreground/15 bg-white hover:border-lime/60",
        )}
      >
        <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
        <p className="mt-3 text-sm font-semibold">Upload supporting documents</p>
        <p className="mt-1 text-xs text-muted-foreground">Drag & drop files here or browse</p>
        <p className="mt-2 text-xs text-muted-foreground">PDF, DOCX, JPG, PNG · Max 15 MB</p>
        <input ref={inputRef} type="file" accept={ACCEPT} multiple className="hidden" onChange={(e) => e.target.files && addFiles(e.target.files)} />
      </div>

      {value.length > 0 ? (
        <div className="space-y-3">
          {value.map((doc) => (
            <div key={doc.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-foreground/10 bg-white p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-2">
                {doc.status === "uploading" ? <Loader2 className="h-5 w-5 animate-spin text-cyan-600" /> : doc.status === "uploaded" ? <Check className="h-5 w-5 text-lime-deep" /> : <FileText className="h-5 w-5 text-muted-foreground" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{doc.file.name}</p>
                <p className="text-xs text-muted-foreground">{formatBytes(doc.file.size)}</p>
                {doc.error ? <p className="text-xs text-destructive">{doc.error}</p> : null}
              </div>
              <select
                value={doc.documentType}
                onChange={(e) => updateType(doc.id, e.target.value as DocumentType)}
                className="rounded-lg border border-foreground/10 px-2 py-1.5 text-xs"
              >
                {DOCUMENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
              {token && requestId && doc.status === "pending" ? (
                <button type="button" onClick={() => uploadOne(doc)} className="text-xs font-semibold text-lime-deep hover:underline">
                  Upload
                </button>
              ) : null}
              {doc.status === "error" ? (
                <button type="button" onClick={() => uploadOne(doc)} className="text-xs font-semibold text-cyan-700 hover:underline">
                  Retry
                </button>
              ) : null}
              <button type="button" onClick={() => remove(doc.id)} aria-label="Remove" className="rounded-full p-1 hover:bg-muted">
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export async function uploadPendingDocuments(
  token: string,
  requestId: string,
  docs: PendingDocument[],
): Promise<PendingDocument[]> {
  const results: PendingDocument[] = [];
  for (const doc of docs) {
    const form = new FormData();
    form.append("file", doc.file);
    form.append("document_type", doc.documentType);
    const res = await fetch(`${API_BASE_URL}/production-requests/${requestId}/documents`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    if (!res.ok) throw new Error(`Unable to upload ${doc.file.name}`);
    const data = await res.json();
    results.push({ ...doc, status: "uploaded", progress: 100, serverId: data.id });
  }
  return results;
}
