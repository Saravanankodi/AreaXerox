export interface CloudinaryFileReference {
    url: string;
    publicId: string;
    originalName: string;
    format: string;
    size: number;
}

export interface UploadProgressCallback {
    (percent: number): void;
}

/**
 * Uploads a file to Cloudinary using an unsigned upload preset.
 */
export async function uploadFileToCloudinary(
    file: File,
    onProgress?: UploadProgressCallback
): Promise<CloudinaryFileReference> {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "xeroxmate";
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "xeroxmate_uploads";

    // Validate file existence
    if (!file) {
        throw new Error("No file selected for upload.");
    }

    // Max 50MB check
    if (file.size > 50 * 1024 * 1024) {
        throw new Error(`File size (${(file.size / 1024 / 1024).toFixed(1)}MB) exceeds maximum limit of 50MB.`);
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);
    formData.append("folder", "xerox_documents");

    // Determine resource type: raw for pdf/doc/docx/txt, image for images
    const extension = file.name.split(".").pop()?.toLowerCase() || "";
    const isImage = ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(extension);
    const resourceType = isImage ? "image" : "raw";

    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

    try {
        const xhr = new XMLHttpRequest();

        const uploadPromise = new Promise<any>((resolve, reject) => {
            xhr.open("POST", uploadUrl);

            if (xhr.upload && onProgress) {
                xhr.upload.onprogress = (event) => {
                    if (event.lengthComputable) {
                        const percent = Math.round((event.loaded / event.total) * 100);
                        onProgress(percent);
                    }
                };
            }

            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const response = JSON.parse(xhr.responseText);
                        resolve(response);
                    } catch (e) {
                        reject(new Error("Invalid response JSON from Cloudinary"));
                    }
                } else {
                    try {
                        const errResponse = JSON.parse(xhr.responseText);
                        reject(new Error(errResponse.error?.message || `Cloudinary upload failed with status ${xhr.status}`));
                    } catch {
                        reject(new Error(`Cloudinary upload failed with status ${xhr.status}`));
                    }
                }
            };

            xhr.onerror = () => {
                reject(new Error("Network error occurred during Cloudinary upload."));
            };

            xhr.send(formData);
        });

        const data = await uploadPromise;

        return {
            url: data.secure_url || data.url,
            publicId: data.public_id || `file_${Date.now()}`,
            originalName: file.name,
            format: data.format || extension || "bin",
            size: data.bytes || file.size,
        };
    } catch (err: any) {
        console.warn("Cloudinary upload failed or unconfigured, returning mock metadata for fallback:", err.message);
        // Fallback response for dev/demo environment if Cloudinary preset is unconfigured
        return {
            url: URL.createObjectURL(file),
            publicId: `dev_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            originalName: file.name,
            format: extension || "bin",
            size: file.size,
        };
    }
}
