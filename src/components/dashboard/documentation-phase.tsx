
"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { AlertCircle, FileCheck, Lightbulb, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { detectMissingDocuments, DetectMissingDocumentsInput } from "@/ai/flows/detect-missing-documents";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getCandidate } from "@/app/actions/client-actions";
import { ApplicationData } from "@/lib/schemas";
import { getCompanies } from "@/app/actions/company-actions";
import { OnboardingProcess } from "@/lib/company-schemas";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";


function buildCandidateProfile(candidate: ApplicationData | null): string {
  if (!candidate) return "No candidate data available.";

  return `
    Name: ${candidate.firstName} ${candidate.lastName}
    Position Applying For: ${candidate.position}
    Applying to: ${candidate.applyingFor.join(", ") || 'N/A'}
  `;
}

export function DocumentationPhase({ candidateId }: { candidateId: string}) {
  const [missingDocuments, setMissingDocuments] = useState<string[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [candidate, setCandidate] = useState<ApplicationData | null>(null);
  const [activeProcess, setActiveProcess] = useState<OnboardingProcess | null>(null);
  const [isPending, startTransition] = useTransition();

  const [checkedDocs, setCheckedDocs] = useState<Record<string, boolean>>({});

  const loadData = useCallback(async () => {
    if (!candidateId) return;

    const candidateData = await getCandidate(candidateId);
    setCandidate(candidateData);

    const companies = await getCompanies();
    if (companies && companies.length > 0) {
      const currentCompany = companies[0];
      
      let foundProcess = currentCompany.onboardingProcesses?.find(p => 
        candidateData?.applyingFor?.includes(p.name)
      ) || currentCompany.onboardingProcesses?.[0] || null;
      
      setActiveProcess(foundProcess);

      // Initialize checkbox state based on existing documents for realism
      const initialChecks: Record<string, boolean> = {};
      if (candidateData) {
        if(candidateData.i9) initialChecks['i9'] = true;
        if(candidateData.w4) initialChecks['w4'] = true;
        if(candidateData.idCard) initialChecks['proofOfIdentity'] = true;
        if(candidateData.educationalDiplomas) initialChecks['educationalDiplomas'] = true;
      }
      setCheckedDocs(initialChecks);
    }
  }, [candidateId]);

  useEffect(() => {
    startTransition(() => {
        loadData();
    });
  }, [loadData]);


  const handleDetectMissing = async () => {
    if (!candidate || !activeProcess) {
      setError("Candidate data or process configuration is not loaded yet.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setMissingDocuments(null);

    const submittedDocs = (activeProcess.requiredDocs || [])
      .filter(doc => checkedDocs[doc.id])
      .map(doc => doc.label);
      
    const input: DetectMissingDocumentsInput = {
      candidateProfile: buildCandidateProfile(candidate),
      onboardingPhase: "Detailed Documentation",
      submittedDocuments: submittedDocs,
      requiredDocuments: activeProcess.requiredDocs || [],
    };

    try {
      const result = await detectMissingDocuments(input);
      setMissingDocuments(result.missingDocuments);
    } catch (e) {
      setError("Failed to detect missing documents. Please try again.");
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckChange = (docId: string, isChecked: boolean) => {
    setCheckedDocs(prev => ({
        ...prev,
        [docId]: isChecked
    }));
  }

  if (isPending) {
    return <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

  const requiredDocs = activeProcess?.requiredDocs || [];

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-8">
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Required Documentation Checklist</CardTitle>
                <CardDescription>
                    This is a simulation. Check the boxes for documents the candidate has supposedly submitted. The file upload buttons are for visual purposes only.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {requiredDocs.length > 0 ? (
                    requiredDocs.map(doc => (
                        <div key={doc.id} className="flex items-center justify-between p-3 rounded-md border bg-muted/30">
                            <div className="flex items-center gap-3">
                                <Checkbox 
                                    id={`doc-${doc.id}`} 
                                    checked={!!checkedDocs[doc.id]}
                                    onCheckedChange={(checked) => handleCheckChange(doc.id, !!checked)}
                                />
                                <Label htmlFor={`doc-${doc.id}`}>{doc.label}</Label>
                            </div>
                            <Button variant="outline" size="sm" disabled>Upload Document</Button>
                        </div>
                    ))
                ) : (
                    <p className="text-sm text-muted-foreground text-center">No specific documents have been requested for this position.</p>
                )}
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Automated Actions</CardTitle>
                <CardDescription>Use AI to streamline documentation and setup.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col sm:flex-row gap-4">
                    <Button onClick={handleDetectMissing} disabled={isLoading || !candidate}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lightbulb className="mr-2 h-4 w-4" />}
                        Detect Missing Documents
                    </Button>
                </div>
            </CardContent>
        </Card>

      </div>

      <div className="space-y-6">
        <Card className="sticky top-24">
          <CardHeader>
            <CardTitle className="font-headline">Document Suggestions</CardTitle>
            <CardDescription>AI-powered check for potentially missing documents.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && (
              <div className="flex items-center justify-center p-8 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            )}
            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
            {missingDocuments && missingDocuments.length > 0 && (
                <Alert>
                    <FileCheck className="h-4 w-4" />
                    <AlertTitle>Potentially Missing Documents</AlertTitle>
                    <AlertDescription>
                        <ul className="mt-2 list-disc pl-5 space-y-1">
                            {missingDocuments.map((doc, index) => (
                                <li key={index}>{doc}</li>
                            ))}
                        </ul>
                    </AlertDescription>
                </Alert>
            )}
            {missingDocuments && missingDocuments.length === 0 && (
                 <Alert variant="default" className="border-green-500/50 text-green-700 dark:border-green-500 [&>svg]:text-green-700">
                    <FileCheck className="h-4 w-4" />
                    <AlertTitle>All Documents Accounted For!</AlertTitle>
                    <AlertDescription>
                       Based on the analysis, the candidate seems to have submitted all required documents.
                    </AlertDescription>
                </Alert>
            )}
             {!isLoading && !error && !missingDocuments && (
                <div className="text-center text-sm text-muted-foreground p-4">
                    Click 'Detect Missing Documents' to begin analysis.
                </div>
             )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
