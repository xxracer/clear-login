
'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Users, Info } from "lucide-react";
import { type ApplicationData } from "@/lib/schemas";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getCombinedCandidates } from "@/app/actions/candidate-actions";
import { CandidatesActions } from "./_components/candidates-actions";
import { format } from "date-fns";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getInterviewCandidates } from "@/app/actions/client-actions";
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

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

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<ApplicationData[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const loadData = useCallback(async () => {
    setLoading(true);
    // Fetch both new candidates and those in interview status
    const newCandidates = await getCombinedCandidates();
    const interviewCandidates = await getInterviewCandidates();
    const all = [...newCandidates, ...interviewCandidates]
        // Simple de-duplication
        .filter((c, index, self) => index === self.findIndex(t => t.id === c.id))
        .sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime());
    
    setCandidates(all);
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

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Users className="h-12 w-12 text-muted-foreground animate-pulse" />
      </div>
    );
  }

  if (candidates.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm h-full">
        <div className="flex flex-col items-center gap-2 text-center">
          <Users className="h-12 w-12 text-muted-foreground" />
          <h3 className="text-2xl font-bold tracking-tight">No Candidates Yet</h3>
          <p className="text-sm text-muted-foreground">
            When a candidate applies, they will appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h1 className="text-3xl font-headline font-bold text-foreground">Candidates</h1>
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7"><Info className="h-4 w-4 text-muted-foreground" /></Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Candidates</AlertDialogTitle>
                    <AlertDialogDescription>
                        This page lists all new applicants who have submitted an application, as well as candidates who are currently in the interview process. From here, you can view their application, reject them, or move them forward to the next stage.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogAction>Got it!</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      </div>
      <Card>
        <CardContent className="p-0">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Applying For</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {candidates.map((candidate) => {
                        const applicationDate = toDate(candidate.date);
                        return (
                          <TableRow key={candidate.id}>
                              <TableCell className="font-medium">{candidate.firstName} {candidate.lastName}</TableCell>
                              <TableCell>{candidate.applyingFor.join(', ')}</TableCell>
                              <TableCell>{applicationDate ? format(applicationDate, 'PPP') : 'N/A'}</TableCell>
                              <TableCell className="capitalize">{candidate.status}</TableCell>
                              <TableCell className="text-right space-x-2">
                                <CandidatesActions candidateId={candidate.id} />
                              </TableCell>
                          </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
  );
}
