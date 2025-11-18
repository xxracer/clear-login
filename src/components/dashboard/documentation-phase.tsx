
"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { AlertCircle, FileCheck, Lightbulb, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { detectMissingDocuments, DetectMissingDocumentsInput } from "@/ai/flows/detect-missing-documents";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getCandidate } from "@/app/actions/client-actions";
import { ApplicationData } from "@/lib/schemas";
import { getCompanies } from "@/app/actions/company-actions";
import { OnboardingProcess } from "@/lib/company-schemas";
import { Label } from "../ui/label";
import { Checkbox } from "../ui/checkbox";


function buildCandidateProfile(candidate: ApplicationData | null): string {
  if (!candidate) return "No candidate data available.";
  
  return `
    Name: ${candidate.firstName} ${candidate.lastName}
    Position Applying For: ${candidate.position}
    Applying to: ${candidate.applyingFor.join(", ")}
  `;
}

export function DocumentationPhase({ candidateId }: { candidateId: string}) {
  const [missingDocuments, setMissingDocuments] = useState<string[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [candidate, setCandidate] = useState<ApplicationData | null>(null);
  const [activeProcess, setActiveProcess] = useState<OnboardingProcess | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  
  // New state to track checked documents for the simulation
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
      ) || null;
      
      if (!foundProcess && currentCompany.onboardingProcesses && currentCompany.onboardingProcesses.length > 0) {
        foundProcess = currentCompany.onboardingProcesses[0];
      }
      
      setActiveProcess(foundProcess);
    }
  }, [candidateId]);

  useEffect(() => {
    startTransition(() => {
        loadData();
    });
  }, [loadData]);


  const handleDetectMissing = async () => {
    if (!candidate) {
      setError("Candidate data is not loaded yet.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setMissingDocuments(null);

    const submittedDocs: string[] = [];
    (activeProcess?.requiredDocs || []).forEach(doc => {
      if (checkedDocs[doc.id]) {
        submittedDocs.push(doc.label);
      }
    });

    const input: DetectMissingDocumentsInput = {
      candidateProfile: buildCandidateProfile(candidate),
      onboardingPhase: "Detailed Documentation",
      submittedDocuments: submittedDocs,
      requiredDocuments: activeProcess?.requiredDocs || [],
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
  
  const handleCheckboxChange = (docId: string, checked: boolean) => {
    setCheckedDocs(prev => ({
        ...prev,
        [docId]: checked,
    }));
  };

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
                This is a visual checklist to simulate document submission. Check the boxes for documents the candidate has provided.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             {requiredDocs.length > 0 ? requiredDocs.map(doc => (
                <div key={doc.id} className="flex items-center space-x-2">
                    <Checkbox 
                        id={doc.id}
                        checked={!!checkedDocs[doc.id]}
                        onCheckedChange={(checked) => handleCheckboxChange(doc.id, !!checked)}
                    />
                    <Label htmlFor={doc.id} className="font-normal">{doc.label}</Label>
                </div>
             )) : (
                <p className="text-sm text-muted-foreground">No required documents are configured for this process.</p>
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
