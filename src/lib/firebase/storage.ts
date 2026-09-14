import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { firebaseApp } from "./config";

export const storage = getStorage(firebaseApp);

/**
 * Upload a File to Firebase Storage and return its public download URL.
 * @param path  Full storage path, e.g. "shopImages/uid/front.jpg"
 * @param file  The File/Blob to upload
 */
export async function uploadFile(path: string, file: File): Promise<string> {
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

/**
 * Delete a file from Firebase Storage by its full path.
 */
export async function deleteFile(path: string): Promise<void> {
  const storageRef = ref(storage, path);
  await deleteObject(storageRef);
}
