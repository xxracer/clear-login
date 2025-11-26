
'use server';

// This file is deprecated as all file operations are now handled by Firebase Storage.
// It is kept to avoid build errors from any lingering imports, but its functions are non-operational.

async function fileToDataURL(file: File): Promise<string> {
    console.warn("kv-actions.ts is deprecated. Use Firebase Storage actions instead.");
    return "";
}

export async function uploadKvFile(file: File, fileName: string): Promise<string> {
  console.warn("kv-actions.ts is deprecated. Use Firebase Storage actions instead.");
  return "";
}

export async function getFile(fileKey: string): Promise<string | null> {
   console.warn("kv-actions.ts is deprecated. Use Firebase Storage actions instead.");
   return null;
}

export async function deleteFile(fileKey: string): Promise<void> {
   console.warn("kv-actions.ts is deprecated. Use Firebase Storage actions instead.");
}

export async function getFileAsResponse(key: string): Promise<Response> {
  console.warn("kv-actions.ts is deprecated. Use Firebase Storage actions instead.");
  return new Response('This function is deprecated.', { status: 410 });
}
