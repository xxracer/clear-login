
"use client";

import { getCompanies } from "@/app/actions/company-actions";
import { Company } from "@/lib/company-schemas";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";


export default function DocumentationPreviewPage() {
  const [company, setCompany] = useState<Partial<Company> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSettings() {
      setLoading(true);
      try {
        const companies = await getCompanies();
        if (companies && companies.length > 0) {
          setCompany(companies[0]);
        }
      } catch (error) {
        console.error("Failed to load company settings:", error);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  if (loading) {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-muted/40 p-4 relative">
        <div className="fixed top-0 left-0 w-full bg-background/80 backdrop-blur-sm p-2 text-center text-sm font-semibold border-b shadow-sm z-20">
            PREVIEW MODE
        </div>
        <div className="w-full max-w-4xl z-10 mt-12">
            <Card>
                <CardHeader>
                    <CardTitle>Documentation Preview</CardTitle>
                    <CardDescription>
                        This is a preview of how the documentation upload page will appear to the candidate.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="mb-4">Company Name: <span className="font-semibold">{company?.name || 'Your Company Name'}</span></p>
                     <p className="mb-4">Required Documents:</p>
                    {(company?.onboardingProcesses?.[0]?.requiredDocs && company.onboardingProcesses[0].requiredDocs.length > 0) ? (
                        <ul className="list-disc pl-5 space-y-2">
                            {company.onboardingProcesses[0].requiredDocs.map(doc => (
                                <li key={doc.id}>{doc.label} (User will upload file)</li>
                            ))}
                        </ul>
                    ) : (
                         <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg">
                            <AlertCircle className="h-12 w-12 text-muted-foreground" />
                            <h3 className="mt-4 text-lg font-semibold">No Documents Required</h3>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Go back to settings to select the documents your candidates need to upload.
                            </p>
                             <Button asChild className="mt-4" variant="outline">
                                <Link href="/dashboard/settings">Back to Settings</Link>
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
