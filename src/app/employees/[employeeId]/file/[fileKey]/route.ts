
import { getStorage, ref, getBytes } from "firebase/storage";
import { getSdks } from "@/firebase";
import { NextRequest } from "next/server";

export async function GET(
    request: NextRequest,
    { params }: { params: { fileKey: string } }
) {
    try {
        const { firebaseApp } = getSdks();
        const storage = getStorage(firebaseApp);
        const fileKey = decodeURIComponent(params.fileKey);
        
        // In Firebase Storage, the full URL is the "key". We create a ref from it.
        const storageRef = ref(storage, fileKey);
        
        const bytes = await getBytes(storageRef);
        
        // This is a simple way to guess content type. A more robust solution
        // might store metadata in Firestore.
        let contentType = 'application/octet-stream';
        if (fileKey.includes('.pdf')) contentType = 'application/pdf';
        else if (fileKey.includes('.png')) contentType = 'image/png';
        else if (fileKey.includes('.jpg') || fileKey.includes('.jpeg')) contentType = 'image/jpeg';


        return new Response(bytes, {
            headers: {
                'Content-Type': contentType,
                'Content-Length': String(bytes.length),
            },
        });

    } catch (error: any) {
        console.error(`Error retrieving file from Firebase Storage for key ${params.fileKey}:`, error);
        
        if (error.code === 'storage/object-not-found') {
            return new Response('File not found', { status: 404 });
        }
        
        return new Response('Error retrieving file', { status: 500 });
    }
}
