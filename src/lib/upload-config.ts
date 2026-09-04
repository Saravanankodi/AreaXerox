export const ACCEPTED_UPLOAD_EXTENSIONS = [
  ".jpg", ".jpeg", ".png", ".webp", ".svg", ".pdf", ".doc", ".docx", ".ppt", ".pptx", ".xls", ".xlsx", ".txt",
] as const;

export const ACCEPTED_UPLOAD_TYPES = ACCEPTED_UPLOAD_EXTENSIONS.join(",");

const extensionPattern = new RegExp(`(${ACCEPTED_UPLOAD_EXTENSIONS.map((extension) => extension.replace(".", "\\.")).join("|")})$`, "i");

export function isSupportedUpload(file: File) {
  return extensionPattern.test(file.name);
}

export function supportedUploadLabel() {
  return "PDF, Word, PowerPoint, Excel, text and image files";
}
