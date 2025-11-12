
'use client';

import { getCandidate, updateCandidateStatus, deleteCandidate } from "@/app/actions/client-actions";
import { ApplicationView } from "@/components/dashboard/application-view";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { type ApplicationData } from "@/lib/schemas";
import { Briefcase, Printer, UserCheck, UserSearch, MessageSquare, UserX, FileText } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useCallback, Suspense } from "react";
import { InterviewReviewForm } from "@/components/dashboard/interview-review-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


function ApplicationViewContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const candidateId = searchParams.get('id');
    const { toast } = useToast();

    const [applicationData, setApplicationData] = useState<ApplicationData | null>(null);
    const [loading, setLoading] = useState(true);

    const loadData = useCallback(async () => {
        if (candidateId) {
            setLoading(true);
            const data = await getCandidate(candidateId);
            setApplicationData(data);
            setLoading(false);
        } else {
            setLoading(false);
        }
    }, [candidateId]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleAction = async (action: () => Promise<any>, successCallback: () => void, errorTitle: string) => {
        try {
            const result = await action();
            if (result.success) {
                successCallback();
            } else {
                toast({ variant: "destructive", title: errorTitle, description: result.error });
            }
        } catch (error) {
            toast({ variant: "destructive", title: errorTitle, description: (error as Error).message });
        }
    };

    const handleSetToInterview = (id: string) => {
        handleAction(
            () => updateCandidateStatus(id, 'interview'),
            () => {
                toast({ title: "Candidate Updated", description: "Moved to interview phase."});
                router.push('/dashboard/candidates');
            },
            "Error setting to interview"
        );
    }

    const handleRejectCandidate = (id: string) => {
        const confirmed = window.confirm("Are you sure you want to reject this candidate? This will permanently delete their application.");
        if (confirmed) {
            handleAction(
                () => deleteCandidate(id),
                () => {
                    toast({ title: "Candidate Rejected", description: `An email has been simulated to ${applicationData?.firstName} informing them of the decision.`});
                    router.push('/dashboard/candidates');
                },
                "Error rejecting candidate"
            );
        }
    }

    const handleMarkAsNewHire = (id: string) => {
        handleAction(
            () => updateCandidateStatus(id, 'new-hire'),
            () => {
                toast({ title: "Candidate Approved!", description: "Moved to New Hire phase." });
                router.push('/dashboard/new-hires');
            },
            "Error marking as new hire"
        );
    }

    const handleMarkAsEmployee = (id: string) => {
        handleAction(
            () => updateCandidateStatus(id, 'employee'),
            () => router.push('/dashboard/employees'),
            "Error marking as employee"
        );
    }

    const handleReviewSubmit = () => {
        if (applicationData) {
            handleMarkAsNewHire(applicationData.id);
        }
    }

    if (loading) {
        return (
            <div className="flex flex-1 items-center justify-center">
                <UserSearch className="h-12 w-12 text-muted-foreground animate-pulse" />
            </div>
        );
    }
    
    if (!applicationData) {
        return (
            <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm h-full">
                <Card className="w-full max-w-lg text-center">
                    <CardHeader>
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                            <UserSearch className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <CardTitle className="font-headline text-2xl mt-4">No Application Data Found</CardTitle>
                        <CardDescription>
                            Could not find application data. The link may be invalid or the candidate was deleted.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild>
                            <Link href="/dashboard/candidates">Back to Candidates</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    const isCandidate = applicationData.status === 'candidate';
    const isNewHire = applicationData.status === 'new-hire';
    const isEmployee = applicationData.status === 'employee';
    const isInterview = applicationData.status === 'interview';

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-headline font-bold text-foreground">
                    Viewing Application: {applicationData.firstName} {applicationData.lastName}
                </h1>
                <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={() => window.print()}>
                        <Printer className="mr-2 h-4 w-4" />
                        Print
                    </Button>
                    {isCandidate && (
                        <>
                            <Button variant="destructive" onClick={() => handleRejectCandidate(applicationData.id)}>
                                <UserX className="mr-2 h-4 w-4" />
                                Reject
                            </Button>
                            <Button onClick={() => handleSetToInterview(applicationData.id)}>
                                <MessageSquare className="mr-2 h-4 w-4" />
                                Set to Interview
                            </Button>
                        </>
                    )}
                    {isInterview && (
                         <Button onClick={() => handleMarkAsNewHire(applicationData.id)}>
                            <UserCheck className="mr-2 h-4 w-4" />
                            Approve for Hire
                        </Button>
                    )}
                    {isNewHire && (
                        <Button onClick={() => handleMarkAsEmployee(applicationData.id)}>
                            <Briefcase className="mr-2 h-4 w-4" />
                            Mark as Employee
                        </Button>
                    )}
                    <Button asChild variant="outline">
                        {isEmployee ? <Link href="/dashboard/employees">Back to Employees</Link> : isNewHire ? <Link href="/dashboard/new-hires">Back to New Hires</Link> : <Link href="/dashboard/candidates">Back to Candidates</Link>}
                    </Button>
                </div>
            </div>
             {isInterview ? (
                <Tabs defaultValue="application">
                    <TabsList>
                        <TabsTrigger value="application"><FileText className="mr-2 h-4 w-4"/> Original Application</TabsTrigger>
                        <TabsTrigger value="interview"><MessageSquare className="mr-2 h-4 w-4"/> Interview Review</TabsTrigger>
                    </TabsList>
                    <TabsContent value="application">
                        <ApplicationView data={applicationData} />
                    </TabsContent>
                    <TabsContent value="interview">
                        <InterviewReviewForm 
                            candidateName={`${applicationData.firstName} ${applicationData.lastName}`} 
                            onReviewSubmit={handleReviewSubmit}
                        />
                    </TabsContent>
                </Tabs>
            ) : (
                <ApplicationView data={applicationData} />
            )}
        </div>
    );
}

export default function ApplicationViewPage() {
    return (
        <Suspense fallback={<div className="flex flex-1 items-center justify-center"><UserSearch className="h-12 w-12 text-muted-foreground animate-pulse" /></div>}>
            <ApplicationViewContent />
        </Suspense>
    )
}
