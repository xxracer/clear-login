
"use client";

import { InterviewReviewForm } from "@/components/dashboard/interview-review-form";
import Image from "next/image";
import { getCompanies } from "@/app/actions/company-actions";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { getFile } from "@/app/actions/kv-actions";


function InterviewPreview({ interviewImageUrl }: { interviewImageUrl: string | null }) {
  return (
      <div className="w-full max-w-4xl z-10">
              <div className="absolute inset-0 z-0">
                  {interviewImageUrl && 
                      <Image
                        src={interviewImageUrl}
                        alt="Interview Background"
                        fill
                        className="object-cover opacity-10"
                        data-ai-hint="office background"
                      />
                  }
                  <div className="absolute inset-0 bg-background/80" />
              </div>
              <div className="pointer-events-none opacity-70 relative z-10">
                  <InterviewReviewForm candidateName="John Doe (Sample)" onReviewSubmit={() => {}} />
              </div>
        </div>
  );
}


export default function InterviewPreviewPage() {
    const [interviewImageUrl, setInterviewImageUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadSettings() {
            setLoading(true);
            try {
                const companies = await getCompanies();
                if (companies && companies.length > 0) {
                    const firstCompany = companies[0];
                    const firstProcess = firstCompany.onboardingProcesses?.[0];
                    if (firstProcess && firstProcess.interviewScreen?.type === 'custom' && firstProcess.interviewScreen?.imageUrl) {
                       const url = await getFile(firstProcess.interviewScreen.imageUrl);
                       setInterviewImageUrl(url);
                    }
                }
            } catch (error) {
                console.error("Failed to load interview preview settings:", error);
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
        <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4 relative">
            <div className="fixed top-0 left-0 w-full bg-background/80 backdrop-blur-sm p-2 text-center text-sm font-semibold border-b shadow-sm z-20">
                PREVIEW MODE
            </div>
            <InterviewPreview interviewImageUrl={interviewImageUrl} />
        </div>
    );
}
