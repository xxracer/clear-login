
'use server';

import { collection, doc, getDoc, getDocs, setDoc, deleteDoc, writeBatch } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { Company, OnboardingProcess } from "@/lib/company-schemas";
import { generateIdForServer } from "@/lib/server-utils";
import { revalidatePath } from 'next/cache';
import { initializeFirebase } from "@/firebase";

// This file now acts as a server-side API for interacting with Firestore.

const COMPANIES_COLLECTION = 'companies';

async function getFirebaseServices() {
    const { firestore: fs, firebaseApp } = initializeFirebase();
    const storage = getStorage(firebaseApp);
    return { firestore: fs, storage };
}

export async function getCompanies(): Promise<Company[]> {
    const { firestore } = await getFirebaseServices();
    const companiesCollection = collection(firestore, COMPANIES_COLLECTION);
    const snapshot = await getDocs(companiesCollection);
    if (snapshot.empty) {
        return [];
    }
    return snapshot.docs.map(doc => doc.data() as Company);
}

export async function getCompany(id: string): Promise<Company | null> {
    const { firestore } = await getFirebaseServices();
    const companyRef = doc(firestore, COMPANIES_COLLECTION, id);
    const docSnap = await getDoc(companyRef);
    if (docSnap.exists()) {
        return docSnap.data() as Company;
    }
    return null;
}

export async function createOrUpdateCompany(companyData: Partial<Company>) {
    try {
        const { firestore } = await getFirebaseServices();
        let companyToSave: Company;

        if (companyData.id) {
            const existingCompany = await getCompany(companyData.id);
            if (!existingCompany) {
                 throw new Error("Company not found for update.");
            }
            // Merge new data with existing data
            companyToSave = { ...existingCompany, ...companyData };
        } else {
            // Create new company
            companyToSave = {
                ...companyData,
                id: generateIdForServer(),
                created_at: new Date().toISOString(),
            } as Company;
        }

        const companyRef = doc(firestore, COMPANIES_COLLECTION, companyToSave.id);
        await setDoc(companyRef, companyToSave, { merge: true });
        
        revalidatePath('/dashboard/settings');
        revalidatePath('/dashboard');
        revalidatePath('/application');

        return { success: true, company: companyToSave };

    } catch (error) {
        console.error("Error saving company data:", error);
        return { success: false, error: `Failed to save company data: ${(error as Error).message}` };
    }
}

export async function addOnboardingProcess(companyId: string, process: OnboardingProcess) {
    try {
        const company = await getCompany(companyId);
        if (!company) {
            throw new Error("Company not found to add process to.");
        }

        if (!company.onboardingProcesses) {
            company.onboardingProcesses = [];
        }
        company.onboardingProcesses.push(process);

        const { firestore } = await getFirebaseServices();
        const companyRef = doc(firestore, COMPANIES_COLLECTION, companyId);
        await setDoc(companyRef, company);

        revalidatePath('/dashboard/settings');
        
        return { success: true, company: company };
    } catch (error) {
        console.error("Error adding onboarding process:", error);
        return { success: false, error: `Failed to add process: ${(error as Error).message}` };
    }
}

export async function deleteOnboardingProcess(companyId: string, processId: string) {
    try {
        const company = await getCompany(companyId);

        if (!company) {
            throw new Error("Company not found.");
        }

        const initialProcessCount = company.onboardingProcesses?.length || 0;

        if (company.onboardingProcesses) {
            company.onboardingProcesses = company.onboardingProcesses.filter(p => p.id !== processId);
        }

        if (company.onboardingProcesses?.length === initialProcessCount) {
             return { success: false, error: "Process not found to delete." };
        }
        
        const { firestore } = await getFirebaseServices();
        const companyRef = doc(firestore, COMPANIES_COLLECTION, companyId);
        await setDoc(companyRef, company);

        revalidatePath('/dashboard/settings');
        
        return { success: true, company: company };
    } catch (error) {
        console.error("Error deleting onboarding process:", error);
        return { success: false, error: `Failed to delete process: ${(error as Error).message}` };
    }
}


export async function deleteCompany(id: string) {
    try {
        const { firestore } = await getFirebaseServices();
        const companyRef = doc(firestore, COMPANIES_COLLECTION, id);
        await deleteDoc(companyRef);
        
        revalidatePath('/dashboard/settings');
        revalidatePath('/dashboard');
        revalidatePath('/application');
        
        return { success: true };
    } catch(error) {
        console.error("Error deleting company:", error);
        return { success: false, error: "Failed to delete company." };
    }
}

export async function deleteAllCompanies() {
     try {
        const { firestore } = await getFirebaseServices();
        const companiesCollection = collection(firestore, COMPANIES_COLLECTION);
        const snapshot = await getDocs(companiesCollection);
        if (snapshot.empty) {
            return { success: true };
        }
        const batch = writeBatch(firestore);
        snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();

        revalidatePath('/dashboard/settings');
        revalidatePath('/dashboard');
        revalidatePath('/application');
        return { success: true };
    } catch(error) {
        console.error("Error deleting all companies:", error);
        return { success: false, error: "Failed to delete all companies." };
    }
}


// --- File Management ---

export async function uploadCompanyLogo(file: File): Promise<string> {
  const { storage } = await getFirebaseServices();
  const filePath = `logos/${Date.now()}-${file.name}`;
  const storageRef = ref(storage, filePath);
  await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(storageRef);
  return downloadURL;
}

export async function deleteCompanyLogo(downloadURL: string) {
    if (!downloadURL) return;
    const { storage } = await getFirebaseServices();
    try {
        const fileRef = ref(storage, downloadURL);
        await deleteObject(fileRef);
    } catch (error) {
        console.error("Error deleting old logo from storage:", error);
        // Don't throw, as the main operation shouldn't fail if old logo deletion fails
    }
}
