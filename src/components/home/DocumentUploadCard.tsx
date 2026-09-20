import { useRef, useState } from "react";
import { CheckCircle2, FileText, LoaderCircle, Trash2, Upload, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ACCEPTED_UPLOAD_TYPES,
  isSupportedUpload,
  supportedUploadLabel,
} from "@/lib/upload-config";

type UploadState = "idle" | "dragging" | "uploading" | "success" | "error";

export function DocumentUploadCard({
  multiple = false,
  onFilesSelected,
  onFilesRemoved,
  fileNames,
  uploadingNames,
  hydrated = true,
  className,
}: {
  multiple?: boolean | undefined;
  onFilesSelected?: ((files: File[]) => void | Promise<void>) | undefined;
  onFilesRemoved?: (() => void) | undefined;
  fileNames?: string[] | undefined;
  uploadingNames?: string[] | undefined;
  hydrated?: boolean | undefined;
  className?: string | undefined;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<UploadState>("idle");
  const [error, setError] = useState("");

  const displayNames = uploadingNames?.length
    ? uploadingNames
    : fileNames ?? [];
  const hasFiles = displayNames.length > 0;

  const clearAll = () => {
    setState("idle");
    setError("");
    onFilesRemoved?.();
  };

  const retry = () => {
    setState("idle");
    setError("");
    browse();
  };

  const browse = () => inputRef.current?.click();

  const acceptFiles = async (incoming: FileList | File[]) => {
    const selected = Array.from(incoming);
    const unsupported = selected.find((file) => !isSupportedUpload(file));
    if (!selected.length) return;
    if (unsupported) {
      setError(`${unsupported.name} is not a supported file type.`);
      setState("error");
      return;
    }
    const accepted = multiple ? selected : selected.slice(0, 1);
    setState("uploading");
    await new Promise<void>((resolve) => window.setTimeout(resolve, 420));
    await onFilesSelected?.(accepted);
    setState("success");
  };

  const currentDisplayState: UploadState = state === "uploading"
    ? "uploading"
    : state === "error"
      ? "error"
      : hasFiles
        ? "success"
        : state === "dragging"
          ? "dragging"
          : "idle";

  return (
    <section
      aria-label="Document upload"
      className={cn("home-upload-card card-surface p-4 sm:px-4 sm:py-4", className)}
    >
      {!hydrated && (
        <div className="rounded-2xl border-2 border-dashed border-border bg-card p-6 text-center sm:p-8">
          <div className="mx-auto h-14 w-14 animate-pulse rounded-2xl bg-muted" />
          <div className="mx-auto mt-5 h-5 w-40 animate-pulse rounded bg-muted" />
          <div className="mx-auto mt-2 h-4 w-56 animate-pulse rounded bg-muted" />
        </div>
      )}
      {hydrated && (
        <>
          <input
            ref={inputRef}
            className="sr-only"
            type="file"
            accept={ACCEPTED_UPLOAD_TYPES}
            multiple={multiple}
            onChange={(event) => {
              void acceptFiles(event.target.files ?? []);
              event.currentTarget.value = "";
            }}
          />
          <div
            role="button"
            tabIndex={0}
            onClick={browse}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                browse();
              }
            }}
            onDragEnter={(event) => {
              event.preventDefault();
              if (currentDisplayState !== "uploading") setState("dragging");
            }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={() => {
              if (state === "dragging") setState("idle");
            }}
            onDrop={(event) => {
              event.preventDefault();
              void acceptFiles(event.dataTransfer.files);
            }}
            className={cn(
              "group rounded-2xl border-2 border-dashed p-6 text-center outline-none transition-all sm:p-8",
              currentDisplayState === "dragging"
                ? "border-primary bg-primary-light scale-[1.01]"
                : "border-primary bg-primary-light/60 shadow-raised",
              currentDisplayState === "error" && "border-destructive bg-destructive/5",
              currentDisplayState === "success" && "border-success/50 bg-success-light/60",
            )}
          >
            {currentDisplayState === "idle" || currentDisplayState === "dragging" ? (
              <>
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-light text-primary transition-transform duration-200 group-hover:-translate-y-1">
                  <Upload className="h-7 w-7" />
                </span>
                <h2 className="mt-5 text-lg font-bold">
                  {currentDisplayState === "dragging" ? "Drop your document here" : "Upload your document"}
                </h2>
                <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-muted-foreground">
                  Drag & drop {multiple ? "files" : "a file"} here or browse from your device.
                </p>
                <p className="mt-3 text-xs font-medium text-muted-foreground">
                  {supportedUploadLabel()}
                </p>
                <Button type="button" className="pointer-events-none mt-5" size="lg">
                  Browse Files
                </Button>
              </>
            ) : currentDisplayState === "uploading" ? (
              <>
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-light text-primary">
                  <LoaderCircle className="h-7 w-7 animate-spin" />
                </span>
                <h2 className="mt-5 text-lg font-bold">
                  Preparing your {displayNames.length > 1 ? "files" : "file"}...
                </h2>
                <p className="mt-2 truncate text-sm text-muted-foreground">
                  {displayNames.join(", ")}
                </p>
                <div className="mx-auto mt-5 h-2 max-w-xs overflow-hidden rounded-full bg-border">
                  <span className="home-upload-progress block h-full rounded-full bg-primary" />
                </div>
              </>
            ) : currentDisplayState === "success" ? (
              <>
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-success-light text-success">
                  <CheckCircle2 className="h-7 w-7" />
                </span>
                <h2 className="mt-5 text-lg font-bold">Upload complete</h2>
                <div className="mx-auto mt-2 max-w-sm space-y-1">
                  {displayNames.map((name) => (
                    <p
                      key={name}
                      className="truncate text-sm text-muted-foreground"
                    >
                      {name}
                    </p>
                  ))}
                </div>
                <p className="mt-2 text-sm font-medium text-success">Ready to customize</p>
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={(event) => {
                      event.stopPropagation();
                      clearAll();
                    }}
                  >
                    <Trash2 className="h-4 w-4" /> Remove
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={(event) => {
                      event.stopPropagation();
                      browse();
                    }}
                  >
                    <Upload className="h-4 w-4" /> Add Files
                  </Button>
                </div>
              </>
            ) : (
              <>
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
                  <XCircle className="h-7 w-7" />
                </span>
                <h2 className="mt-5 text-lg font-bold">Upload failed</h2>
                <p role="alert" className="mt-2 text-sm text-muted-foreground">
                  {error}
                </p>
                <Button
                  type="button"
                  className="mt-5"
                  onClick={(event) => {
                    event.stopPropagation();
                    retry();
                  }}
                >
                  Try again
                </Button>
              </>
            )}
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <FileText className="h-4 w-4 text-primary" /> After uploading, choose a shop and
            customize every file.
          </div>
        </>
      )}
    </section>
  );
}
