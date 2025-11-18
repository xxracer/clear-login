
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
import { CopyDocumentationLink } from "./copy-documentation-link";


function buildCandidateProfile(candidate: ApplicationData | null): string {
  if (!candidate) return "No candidate data available.";

  const submittedDocs: string[] = [];
  if (candidate.resume) submittedDocs.push("Resume/CV");
  if (candidate.applicationPdfUrl) submittedDocs.push("Application Form");
  if (candidate.driversLicense) submittedDocs.push("Driver's License");
  if (candidate.idCard) submittedDocs.push("Proof of Identity / ID Card");
  if (candidate.proofOfAddress) submittedDocs.push("Proof of Address");
  if (candidate.i9) submittedDocs.push("I-9 Form");
  if (candidate.w4) submittedDocs.push("W-4 Form");
  if (candidate.educationalDiplomas) submittedDocs.push("Educational Diplomas");
  candidate.documents?.forEach(d => submittedDocs.push(d.title));

  return `
    Name: ${candidate.firstName} ${candidate.lastName}
    Position Applying For: ${candidate.position}
    Applying to: ${candidate.applyingFor.join(", ") || 'N/A'}
    Submitted Documents: ${submittedDocs.join(", ") || 'None'}
  `;
}

export function DocumentationPhase({ candidateId }: { candidateId: string}) {
  const [missingDocuments, setMissingDocuments] = useState<string[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [candidate, setCandidate] = useState<ApplicationData | null>(null);
  const [isPending, startTransition] = useTransition();


  const loadData = useCallback(async () => {
    if (!candidateId) return;

    const candidateData = await getCandidate(candidateId);
    setCandidate(candidateData);
  }, [candidateId]);

  useEffect(() => {
    startTransition(() => {
        loadData();
    });
  }, [loadData]);


  const handleDetectMissing = async () => {
    if (!candidate) {
      setError("Candidate data or process configuration is not loaded yet.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setMissingDocuments(null);
    
    // We need to get the latest candidate data to see which documents were simulated as uploaded
    const latestCandidateData = await getCandidate(candidateId);
    if (!latestCandidateData) {
        setError("Could not retrieve latest candidate data.");
        setIsLoading(false);
        return;
    }

    const companies = await getCompanies();
    const activeProcess = companies[0]?.onboardingProcesses?.[0];

    const submittedDocs: string[] = [];
    if (latestCandidateData.i9) submittedDocs.push("Form I-9 (Employment Eligibility)");
    if (latestCandidateData.w4) submittedDocs.push("Form W-4 (Tax Withholding)");
    if (latestCandidateData.idCard) submittedDocs.push("Proof of Identity & Social Security");
    if (latestCandidateData.educationalDiplomas) submittedDocs.push("Educational Diplomas or Certificates");

    const input: DetectMissingDocumentsInput = {
      candidateProfile: buildCandidateProfile(latestCandidateData),
      onboardingPhase: "Detailed Documentation",
      submittedDocuments: submittedDocs,
      requiredDocuments: activeProcess?.requiredDocs || [],
    };

    try {
      const result = await detectMissingDocuments(input);
      setMissingDocuments(result.missingDocuments);
    } catch (e) {
      console.error(e);
      setError("An AI error occurred while checking for missing documents.");
      setMissingDocuments([]);
    } finally {
      setIsLoading(false);
    }
  };

  const processId = "default"; // Assuming a default process for the link

  if (isPending || !candidate) {
     return <div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Documentation Verification</CardTitle>
        <CardDescription>
            This section is for HR to verify required documents. You can send a link to the candidate or use the AI to check for missing items.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">

        <div className="flex flex-wrap items-center justify-between gap-4 p-4 border rounded-lg bg-muted/30">
            <p className="text-sm font-medium">Send the candidate a link to upload their documents:</p>
            <CopyDocumentationLink candidateId={candidateId} processId={processId} />
        </div>

        <div className="flex items-center justify-center pt-4">
             <Button onClick={handleDetectMissing} disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lightbulb className="mr-2 h-4 w-4" />}
                Use AI to Check for Missing Documents
            </Button>
        </div>
       

        {error && (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}

        {missingDocuments && (
          missingDocuments.length > 0 ? (
            <Alert variant="default" className="border-yellow-500/50">
               <AlertCircle className="h-4 w-4 text-yellow-500"/>
              <AlertTitle className="font-semibold">Potentially Missing Documents</AlertTitle>
              <AlertDescription>
                <p>The AI suggests the following documents might be missing. Please verify manually.</p>
                <ul className="list-disc pl-5 mt-2">
                  {missingDocuments.map((doc, index) => <li key={index}>{doc}</li>)}
                </ul>
              </AlertDescription>
            </Alert>
          ) : (
             <Alert variant="default" className="border-green-500/50">
               <FileCheck className="h-4 w-4 text-green-500"/>
              <AlertTitle className="font-semibold">All Documents Seem to be in Order</AlertTitle>
              <AlertDescription>
                The AI did not detect any obviously missing documents based on the provided information.
              </AlertDescription>
            </Alert>
          )
        )}
      </CardContent>
    </Card>
  );
}
