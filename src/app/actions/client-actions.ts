
'use client';

import { generateId } from "@/lib/local-storage-client";
import { type ApplicationData, type ApplicationSchema, type InterviewReviewSchema, DocumentFile } from "@/lib/schemas";
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, writeBatch } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { getSdks } from "@/firebase";

// This file now acts as a client-side API for interacting with Firestore and Storage.

const { firestore } = getSdks();
const CANDIDATES_COLLECTION = 'candidates';

async function getFirebaseServices() {
    const { firestore: fs, firebaseApp } = getSdks();
    const storage = getStorage(firebaseApp);
    return { firestore: fs, storage };
}


// --- Public Client Actions ---

export async function createCandidate(data: Partial<ApplicationSchema>): Promise<{ success: boolean, id?: string, error?: string }> {
    try {
        const { firestore } = await getFirebaseServices();
        const id = generateId();
        const candidateRef = doc(firestore, CANDIDATES_COLLECTION, id);
        
        const newCandidate: Partial<ApplicationData> = {
            ...data,
            id: id,
            created_at: new Date().toISOString(),
            status: 'candidate',
            documents: [],
            miscDocuments: [],
        };
        
        // Handle file uploads to Firebase Storage if they exist
        if (data.resume instanceof File) {
            const resumeUrl = await uploadFileToStorage(id, data.resume, "resume");
            newCandidate.resume = resumeUrl;
        }
        if (data.driversLicense instanceof File) {
            const licenseUrl = await uploadFileToStorage(id, data.driversLicense, "drivers-license");
            newCandidate.driversLicense = licenseUrl;
        }

        await setDoc(candidateRef, newCandidate);
        
        return { success: true, id: newCandidate.id };
    } catch (error) {
        console.error("Error creating candidate: ", error);
        return { success: false, error: (error as Error).message || "Failed to create candidate." };
    }
}

export async function createLegacyEmployee(employeeData: Partial<ApplicationData>): Promise<{ success: boolean, id?: string, error?: string }> {
    try {
        const { firestore } = await getFirebaseServices();
        const id = generateId();
        const employeeRef = doc(firestore, CANDIDATES_COLLECTION, id);

        const newEmployee: ApplicationData = {
            ...employeeData,
            id: id,
            created_at: new Date().toISOString(),
            status: 'employee',
            applyingFor: employeeData.applyingFor || [],
            education: employeeData.education || { college: {}, voTech: {}, highSchool: {}, other: {} },
        } as ApplicationData;
        
        await setDoc(employeeRef, newEmployee);

        return { success: true, id: newEmployee.id };
    } catch (error) {
        console.error("Error creating legacy employee: ", error);
        return { success: false, error: (error as Error).message || "Failed to create legacy employee." };
    }
}

async function getAllFromFirestore(): Promise<ApplicationData[]> {
    const { firestore } = await getFirebaseServices();
    const candidatesCollection = collection(firestore, CANDIDATES_COLLECTION);
    const snapshot = await getDocs(candidatesCollection);
    return snapshot.docs.map(doc => doc.data() as ApplicationData);
}


export async function getCandidates(): Promise<ApplicationData[]> {
    const all = await getAllFromFirestore();
    const sorted = all.sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime());
    return sorted.filter(c => c.status === 'candidate');
}

export async function getInterviewCandidates(): Promise<ApplicationData[]> {
    const all = await getAllFromFirestore();
    const sorted = all.sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime());
    return sorted.filter(c => c.status === 'interview');
}

export async function getNewHires(): Promise<ApplicationData[]> {
    const all = await getAllFromFirestore();
    const sorted = all.sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime());
    return sorted.filter(c => c.status === 'new-hire');
}

export async function getEmployees(): Promise<ApplicationData[]> {
    const all = await getAllFromFirestore();
    const sorted = all.sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime());
    return sorted.filter(c => ['employee', 'inactive'].includes(c.status!));
}

export async function getPersonnel(): Promise<ApplicationData[]> {
    const all = await getAllFromFirestore();
    const sorted = all.sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime());
    return sorted.filter(c => ['new-hire', 'employee', 'inactive'].includes(c.status!));
}

export async function getCandidate(id: string): Promise<ApplicationData | null> {
    const { firestore } = await getFirebaseServices();
    const docRef = doc(firestore, CANDIDATES_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() as ApplicationData : null;
}

export async function updateCandidateWithDocuments(id: string, documents: { [key: string]: string }): Promise<{ success: boolean, error?: string }> {
    try {
        const { firestore } = await getFirebaseServices();
        const candidateRef = doc(firestore, CANDIDATES_COLLECTION, id);
        await updateDoc(candidateRef, documents);
        return { success: true };
    } catch (error) {
        console.error("Error updating document: ", error);
        return { success: false, error: (error as Error).message || "Failed to update candidate." };
    }
}


// --- File Management ---

async function uploadFileToStorage(employeeId: string, file: File, path: string): Promise<string> {
    const { storage } = await getFirebaseServices();
    const filePath = `${employeeId}/${path}/${Date.now()}-${file.name}`;
    const storageRef = ref(storage, filePath);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
}


export async function updateCandidateWithFileUpload(employeeId: string, file: File, title: string, type: 'required' | 'misc'): Promise<{ success: boolean, error?: string }> {
     try {
        const { firestore } = await getFirebaseServices();
        const candidateRef = doc(firestore, CANDIDATES_COLLECTION, employeeId);
        const candidate = await getCandidate(employeeId);

        if (candidate) {
            const downloadURL = await uploadFileToStorage(employeeId, file, type);
            const newDoc: DocumentFile = { id: downloadURL, title: title, url: downloadURL };

            const updatePayload: Partial<ApplicationData> = {};
            if (type === 'required') {
                updatePayload.documents = [...(candidate.documents || []), newDoc];
            } else {
                updatePayload.miscDocuments = [...(candidate.miscDocuments || []), newDoc];
            }
            
            await updateDoc(candidateRef, updatePayload);
            return { success: true };
        } else {
            throw new Error("Could not find candidate to update.");
        }
     } catch (error) {
         console.error("Error updating with file upload: ", error);
        return { success: false, error: (error as Error).message || "Failed to update candidate." };
     }
}

export async function deleteEmployeeFile(employeeId: string, fileUrl: string): Promise<{ success: boolean, error?: string }> {
    try {
        const { firestore, storage } = await getFirebaseServices();
        const candidateRef = doc(firestore, CANDIDATES_COLLECTION, employeeId);
        const candidate = await getCandidate(employeeId);

        if (candidate) {
            const fileRef = ref(storage, fileUrl);
            await deleteObject(fileRef);

            const updatedDocs = candidate.documents?.filter(doc => doc.url !== fileUrl) || [];
            const updatedMiscDocs = candidate.miscDocuments?.filter(doc => doc.url !== fileUrl) || [];

            await updateDoc(candidateRef, {
                documents: updatedDocs,
                miscDocuments: updatedMiscDocs
            });
            return { success: true };
        } else {
             throw new Error("Could not find employee to update.");
        }
    } catch (error) {
        console.error("Error deleting file:", error);
        return { success: false, error: "Failed to delete file." };
    }
}


export async function updateCandidateLicense(id: string, licenseFile: File, expirationDate: Date): Promise<{ success: boolean, error?: string }> {
    try {
        const { firestore } = await getFirebaseServices();
        const candidateRef = doc(firestore, CANDIDATES_COLLECTION, id);
        
        const licenseUrl = await uploadFileToStorage(id, licenseFile, 'drivers-license');

        await updateDoc(candidateRef, {
            driversLicense: licenseUrl,
            driversLicenseExpiration: expirationDate.toISOString()
        });

        return { success: true };
    } catch(e) {
        console.error("Error updating license:", e);
        return { success: false, error: (e as Error).message || "Failed to update license." };
    }
}

export async function updateCandidateWithInterviewReview(id: string, reviewData: InterviewReviewSchema): Promise<{ success: boolean; error?: string }> {
    try {
        const { firestore } = await getFirebaseServices();
        const candidateRef = doc(firestore, CANDIDATES_COLLECTION, id);
        await updateDoc(candidateRef, { interviewReview: reviewData });
        return { success: true };
    } catch (error) {
        console.error("Error saving interview review: ", error);
        return { success: false, error: (error as Error).message || "Failed to save interview review." };
    }
}

export async function updateCandidateStatus(id: string, status: 'interview' | 'new-hire' | 'employee' | 'inactive', inactiveInfo?: any): Promise<{ success: boolean, error?: string }> {
    try {
        const { firestore } = await getFirebaseServices();
        const candidateRef = doc(firestore, CANDIDATES_COLLECTION, id);
        const payload: Partial<ApplicationData> = { status };
        if (inactiveInfo) {
            payload.inactiveInfo = inactiveInfo;
        }
        await updateDoc(candidateRef, payload);
        return { success: true };
    } catch (error) {
        console.error("Error updating status: ", error);
        return { success: false, error: "Failed to update candidate status." };
    }
}

export async function deleteCandidate(id: string): Promise<{ success: boolean, error?: string }> {
    try {
        const { firestore } = await getFirebaseServices();
        const candidateRef = doc(firestore, CANDIDATES_COLLECTION, id);
        await deleteDoc(candidateRef);
        // Note: This does not delete associated files in Storage. A more robust solution would.
        return { success: true };
    } catch (error) {
        console.error("Error deleting document: ", error);
        return { success: false, error: "Failed to delete candidate." };
    }
}


export async function resetDemoData() {
    const { firestore } = await getFirebaseServices();
    const candidatesCollection = collection(firestore, CANDIDATES_COLLECTION);
    const snapshot = await getDocs(candidatesCollection);
    const batch = writeBatch(firestore);
    snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
    });
    await batch.commit();
}
