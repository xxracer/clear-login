
"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, Controller } from "react-hook-form"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Loader2, File, FileText, Download } from "lucide-react"
import { z } from "zod"


import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { updateCandidateWithDocuments } from "@/app/actions/client-actions"
import { RequiredDoc } from "@/lib/company-schemas"
import Link from "next/link"

const createDocumentationSchema = (requiredDocs: RequiredDoc[]) => {
    const shape: Record<string, any> = {};
    requiredDocs.forEach(doc => {
        // All documents are file uploads
        shape[doc.id] = z.any()
            .refine((file): file is File => file instanceof File, "This document is required.")
    });
    
    return z.object(shape);
};


// Map of official document links
const officialDocLinks: Record<string, string> = {
    'i9': 'https://www.uscis.gov/sites/default/files/document/forms/i-9.pdf',
    'w4': 'https://www.irs.gov/pub/irs-pdf/fw4.pdf',
}

// Helper to convert a File to a base64 data URI
async function fileToDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}


export function DocumentationForm({ companyName, candidateId, requiredDocs }: { companyName: string, candidateId?: string | null, requiredDocs: RequiredDoc[] }) {
    const { toast } = useToast()
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)

    const documentationSchema = createDocumentationSchema(requiredDocs);
    type DocumentationSchema = z.infer<typeof documentationSchema>;

    const form = useForm<DocumentationSchema>({
        resolver: zodResolver(documentationSchema),
    });

    async function onSubmit(data: DocumentationSchema) {
        if (!candidateId) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "No candidate ID found. This link may be invalid.",
            });
            return;
        }

        setIsSubmitting(true);
        try {
            const documentsToUpload: Record<string, string> = {};
            
            for (const doc of requiredDocs) {
                const file = data[doc.id as keyof typeof data];
                if (file instanceof File) {
                    const dataUrl = await fileToDataURL(file);
                    // Map specific IDs to the correct field names in ApplicationData
                    const key = doc.id === 'proofOfIdentity' ? 'idCard' : doc.id;
                    documentsToUpload[key] = dataUrl;
                }
            }

            const result = await updateCandidateWithDocuments(
                candidateId, 
                documentsToUpload
            );

            if (result.success) {
                toast({
                  title: "Documents Submitted",
                  description: "Candidate documents have been uploaded.",
                });
                router.push('/documentation/success');
            } else {
                toast({
                  variant: "destructive",
                  title: "Submission Failed",
                  description: result.error || "An unknown error occurred.",
                });
            }
        } catch (error) {
            toast({
              variant: "destructive",
              title: "Submission Failed",
              description: (error as Error).message || "An unexpected error occurred.",
            });
        } finally {
            setIsSubmitting(false);
        }
    }
    
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
            <CardContent className="pt-6 space-y-6">
                {requiredDocs.length > 0 ? (
                    requiredDocs.map(doc => {
                        const officialLink = officialDocLinks[doc.id];
                        return (
                            <div key={doc.id}>
                                <Controller
                                    control={form.control}
                                    name={doc.id}
                                    render={({ field: { onChange, ...fieldProps }, fieldState }) => {
                                        const file = form.watch(doc.id as any);
                                        return (
                                            <FormItem>
                                                <FormLabel className="font-semibold">{doc.label}</FormLabel>
                                                {officialLink && (
                                                    <FormDescription>
                                                        Download the official form, fill it out, save it, and then upload it here.
                                                        <Button variant="link" asChild className="p-1 h-auto ml-1">
                                                            <Link href={officialLink} target="_blank" rel="noopener noreferrer">
                                                                <Download className="mr-1 h-3 w-3" />
                                                                Download {doc.label}
                                                            </Link>
                                                        </Button>
                                                    </FormDescription>
                                                )}
                                                <FormControl>
                                                    <div className="relative">
                                                        <Input 
                                                          type="file" 
                                                          accept="application/pdf,image/*" 
                                                          {...fieldProps} 
                                                          onChange={(e) => onChange(e.target.files?.[0])} 
                                                          value={undefined}
                                                          className="pr-12"
                                                        />
                                                        <File className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                                    </div>
                                                </FormControl>
                                                 {file instanceof File && (
                                                    <FormDescription className="flex items-center gap-2 pt-1">
                                                       <FileText className="h-4 w-4 text-muted-foreground" /> {file.name}
                                                    </FormDescription>
                                                 )}
                                                <FormMessage />
                                            </FormItem>
                                        )
                                    }}
                                />
                            </div>
                        )
                    })
                ) : (
                    <div className="text-center py-10 text-muted-foreground">
                        No specific documents have been requested for this position.
                    </div>
                )}
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting || requiredDocs.length === 0}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Documents
          </Button>
        </div>
      </form>
    </Form>
  )
}

    