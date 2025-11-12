
'use client';

import { getInterviewCandidates } from "@/app/actions/client-actions";
import { useEffect, useState, useCallback } from "react";
import type { ApplicationData } from "@/lib/schemas";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { format } from 'date-fns';
import { Users, Eye } from "lucide-react";
import { CardDescription, CardHeader, CardTitle } from "../ui/card";

// Helper to convert string to JS Date
function toDate(dateString: string | Date | undefined): Date | null {
  if (!dateString) return null;
  if (dateString instanceof Date) return dateString;
  try {
    return new Date(dateString);
  } catch (e) {
    return null;
  }
}

export function CandidateView() {
    const [interviewCandidates, setInterviewCandidates] = useState<ApplicationData[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const loadData = useCallback(async () => {
        setLoading(true);
        const candidates = await getInterviewCandidates();
        setInterviewCandidates(candidates);
        setLoading(false);
    }, []);

    useEffect(() => {
        loadData();
        // Listen for storage changes to keep data in sync across tabs
        window.addEventListener('storage', loadData);
        return () => {
            window.removeEventListener('storage', loadData);
        };
    }, [loadData]);
    
    const handleViewCandidate = (candidateId: string) => {
        router.push(`/dashboard/candidates/view?id=${candidateId}`);
    }


    if (loading) {
        return (
            <div className="flex flex-1 items-center justify-center p-8">
                <Users className="h-12 w-12 text-muted-foreground animate-pulse" />
            </div>
        )
    }

    if (interviewCandidates.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg min-h-[200px]">
                <CardHeader className="p-0">
                    <div className="flex justify-center mb-4">
                        <Users className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <CardTitle className="font-headline text-xl">No Active Candidates for Interview</CardTitle>
                    <CardDescription>
                        Once a candidate is set for an interview, they will appear here.
                    </CardDescription>
                </CardHeader>
            </div>
        )
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Applying For</TableHead>
                    <TableHead>Date Applied</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {interviewCandidates.map((candidate) => {
                    const applicationDate = toDate(candidate.date);
                    return (
                      <TableRow key={candidate.id}>
                          <TableCell className="font-medium">{candidate.firstName} {candidate.lastName}</TableCell>
                          <TableCell>{candidate.applyingFor.join(', ')}</TableCell>
                          <TableCell>{applicationDate ? format(applicationDate, 'PPP') : 'N/A'}</TableCell>
                          <TableCell className="text-right">
                              <Button variant="outline" size="sm" onClick={() => handleViewCandidate(candidate.id)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View/Manage
                              </Button>
                          </TableCell>
                      </TableRow>
                    )
                })}
            </TableBody>
        </Table>
    );
}
