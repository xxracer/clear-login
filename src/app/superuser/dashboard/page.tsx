
'use client';

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { RefreshCcw, LogOut, ShieldCheck, Loader2, UserPlus } from "lucide-react";
import { deleteAllCompanies } from "@/app/actions/company-actions";
import { resetDemoData } from "@/app/actions/client-actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createAdminUser } from "@/app/actions/auth-actions";
import { generateIdForServer } from "@/lib/server-utils";


function CreateAdminForm() {
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [companyName, setCompanyName] = useState('');

    const handleCreateAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password || !companyName) {
            toast({ variant: "destructive", title: "Missing fields", description: "Please fill out all fields." });
            return;
        }

        startTransition(async () => {
            const companyId = generateIdForServer(); // We'll use the company name as its ID for simplicity
            const result = await createAdminUser(email, password, companyId);
            if (result.success) {
                toast({ title: "Admin User Created", description: `User ${email} for company ${companyName} created.` });
                setEmail('');
                setPassword('');
                setCompanyName('');
            } else {
                toast({ variant: "destructive", title: "Creation Failed", description: result.error });
            }
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><UserPlus /> Create Company Admin</CardTitle>
                <CardDescription>Create the first admin user for a new client company.</CardDescription>
            </CardHeader>
            <form onSubmit={handleCreateAdmin}>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="companyName">Company Name</Label>
                        <Input id="companyName" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="New Client Inc." required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Admin Email</Label>
                        <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@newclient.com" required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Initial Password</Label>
                        <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
                    </div>
                    <Button type="submit" className="w-full" disabled={isPending}>
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Create Admin
                    </Button>
                </CardContent>
            </form>
        </Card>
    )
}

export default function SuperUserDashboardPage() {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();
    const { toast } = useToast();

    const handleResetDemo = async () => {
        startTransition(async () => {
             try {
                await resetDemoData();
                await deleteAllCompanies();
                
                localStorage.setItem('lastSeenCandidateCount', '0');
                window.dispatchEvent(new Event('data-reset'));

                toast({ title: "Demo Reset Successful", description: "All company and candidate data has been cleared." });
            } catch (error) {
                toast({ variant: "destructive", title: "Demo Reset Failed", description: (error as Error).message });
            }
        });
    };

    const handleLogout = () => {
        router.push('/superuser/login');
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
            <div className="w-full max-w-lg space-y-8">
                <div className="text-center">
                     <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4">
                        <ShieldCheck className="h-8 w-8 text-primary" />
                    </div>
                    <h1 className="font-headline text-3xl font-bold">Super User Dashboard</h1>
                    <p className="text-muted-foreground">
                        Access to administrative actions. Use with caution.
                    </p>
                </div>
                
                <CreateAdminForm />

                <Card>
                     <CardHeader>
                        <CardTitle className="flex items-center gap-2"><RefreshCcw /> System Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" className="w-full" disabled={isPending}>
                                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Reset All Demo Data
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will permanently delete all data. This cannot be undone.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleResetDemo}>Yes, Reset</AlertDialogAction>
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
        </div>
    );
}
