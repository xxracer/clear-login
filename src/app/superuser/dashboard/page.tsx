
'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { RefreshCcw, LogOut, ShieldCheck, Loader2 } from "lucide-react";
import { deleteAllCompanies } from "@/app/actions/company-actions";
import { resetDemoData } from "@/app/actions/client-actions";

export default function SuperUserDashboardPage() {
    const [isPending, setIsPending] = useState(false);
    const router = useRouter();
    const { toast } = useToast();

    const handleResetDemo = async () => {
        setIsPending(true);
        try {
            // This now clears localStorage for candidates
            await resetDemoData();
            // This clears Vercel KV for companies
            await deleteAllCompanies();
            
            // Clear the seen count and trigger a notification check
            localStorage.setItem('lastSeenCandidateCount', '0');
            window.dispatchEvent(new Event('data-reset'));

            toast({ title: "Demo Reset Successful", description: "All company and candidate data has been cleared." });
        } catch (error) {
            toast({ variant: "destructive", title: "Demo Reset Failed", description: (error as Error).message });
        } finally {
            setIsPending(false);
        }
    };

    const handleLogout = () => {
        // In a real app, this would clear a token or session.
        // For this demo, we just navigate back to the login page.
        router.push('/superuser/login');
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
            <Card className="w-full max-w-lg">
                <CardHeader className="text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        <ShieldCheck className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="font-headline text-2xl mt-4">Super User Dashboard</CardTitle>
                    <CardDescription>
                        Access to administrative actions. Use with caution.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" className="w-full" disabled={isPending}>
                                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
                                {isPending ? "Resetting..." : "Reset All Demo Data"}
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action will permanently delete all company profiles from Vercel KV and all candidate data from the browser's local storage. This cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleResetDemo}>Yes, Reset Demo</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                    <Button variant="outline" className="w-full" onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
