'use client';

import { useState, useTransition, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { RefreshCcw, LogOut, ShieldCheck, Loader2, UserPlus, Users, Trash2, Calendar as CalendarIcon, Star } from "lucide-react";
import { deleteAllCompanies } from "@/app/actions/company-actions";
import { resetDemoData } from "@/app/actions/client-actions";
import { createAdminUser, deleteUser, setSuperUserClaim, listAuthUsers } from "@/app/actions/auth-actions";
import { useUser } from "@/firebase";
import type { UserRecord } from "firebase-admin/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";


function CreateAdminForm() {
    const { toast } = useToast();
    const [companyName, setCompanyName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [startDate, setStartDate] = useState<Date | undefined>();
    const [endDate, setEndDate] = useState<Date | undefined>();
    const [isCreating, setIsCreating] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!companyName || !email || !password) {
            toast({ variant: "destructive", title: "Missing fields", description: "Please fill all required fields." });
            return;
        }
        setIsCreating(true);
        const result = await createAdminUser(email, password, companyName, startDate, endDate);
        setIsCreating(false);

        if (result.success) {
            toast({ title: "Admin Created", description: `User ${email} created successfully.` });
            // Optionally clear the form
            setCompanyName('');
            setEmail('');
            setPassword('');
            setStartDate(undefined);
            setEndDate(undefined);
            // You might want to trigger a refresh of the user list here
            window.dispatchEvent(new Event('user-created'));
        } else {
            toast({ variant: "destructive", title: "Creation Failed", description: result.error });
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><UserPlus /> Create Company Admin</CardTitle>
                <CardDescription>Create the first admin user for a new client company.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="companyName">Company Name</Label>
                        <Input id="companyName" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="New Client Inc." required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="adminEmail">Admin Email</Label>
                        <Input id="adminEmail" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@newclient.com" required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="initialPassword">Initial Password</Label>
                        <Input id="initialPassword" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Subscription Start</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}>
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus /></PopoverContent>
                            </Popover>
                        </div>
                        <div className="space-y-2">
                            <Label>Subscription End</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !endDate && "text-muted-foreground")}>
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus /></PopoverContent>
                            </Popover>
                        </div>
                    </div>
                    <Button type="submit" disabled={isCreating} className="w-full">
                        {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Create Admin
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}


function UserList() {
    const { toast } = useToast();
    const [users, setUsers] = useState<UserRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [isClaiming, setIsClaiming] = useState<string | null>(null);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const userList = await listAuthUsers();
            if (userList.success && userList.users) {
                setUsers(userList.users);
            } else {
                 toast({ variant: "destructive", title: "Failed to load users", description: userList.error });
            }
        } catch (error: any) {
             toast({ variant: "destructive", title: "Error fetching users", description: error.message });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchUsers();
        
        const handleUserCreated = () => fetchUsers();
        window.addEventListener('user-created', handleUserCreated);
        return () => window.removeEventListener('user-created', handleUserCreated);

    }, [fetchUsers]);
    
    const handleDeleteUser = async (uid: string) => {
        setIsDeleting(uid);
        const result = await deleteUser(uid);
        if (result.success) {
            toast({ title: "User Deleted", description: "The user has been successfully removed."});
            fetchUsers(); // Refresh list
        } else {
            toast({ variant: "destructive", title: "Deletion Failed", description: result.error });
        }
        setIsDeleting(null);
    }
    
    const handleSetSuperuser = async (uid: string) => {
        setIsClaiming(uid);
        const result = await setSuperUserClaim(uid);
        if (result.success) {
            toast({ title: "Superuser Set", description: "User has been granted superuser privileges." });
            fetchUsers(); // Refresh list to show new custom claims if available
        } else {
            toast({ variant: "destructive", title: "Failed to Set Claim", description: result.error });
        }
        setIsClaiming(null);
    }

    if (loading) {
        return <div className="flex justify-center p-4"><Loader2 className="h-6 w-6 animate-spin" /></div>
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Users /> Company Admins</CardTitle>
                <CardDescription>List of all created company administrator accounts.</CardDescription>
            </CardHeader>
            <CardContent>
                {users.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center">No admin users created yet.</p>
                ) : (
                    <div className="space-y-2">
                        {users.map(user => (
                            <div key={user.uid} className="flex items-center justify-between p-3 rounded-md border">
                                <div>
                                    <p className="font-semibold">{user.email}</p>
                                    <p className="text-xs text-muted-foreground">UID: {user.uid}</p>
                                    {user.customClaims?.superuser && (
                                        <div className="mt-1 flex items-center gap-1 text-xs text-amber-500 font-medium">
                                            <Star className="h-3 w-3" />
                                            <span>Super User</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                     <Button variant="outline" size="sm" onClick={() => handleSetSuperuser(user.uid)} disabled={isClaiming === user.uid || user.customClaims?.superuser} title="Promote to Superuser">
                                        {isClaiming === user.uid ? <Loader2 className="h-4 w-4 animate-spin" /> : <Star className="h-4 w-4" />}
                                    </Button>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="destructive" size="icon" disabled={isDeleting === user.uid} title="Delete User">
                                                {isDeleting === user.uid ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                <AlertDialogDescription>This will permanently delete the user <span className="font-bold">{user.email}</span>. This action cannot be undone.</AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDeleteUser(user.uid)}>Delete</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

function SuperUserDashboard() {
    const [isResetting, startResetTransition] = useTransition();
    const { signOut } = useUser();
    const router = useRouter();
    const { toast } = useToast();

    const handleResetDemo = async () => {
        startResetTransition(async () => {
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

    const handleLogout = async () => {
        await signOut();
        router.push('/superuser/login');
    };

    return (
        <div className="w-full max-w-2xl space-y-8">
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
            <UserList />

            <Card>
                 <CardHeader>
                    <CardTitle className="flex items-center gap-2"><RefreshCcw /> System Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" className="w-full" disabled={isResetting}>
                                {isResetting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
    );
}

export default function SuperUserDashboardPage() {
    const { user, isUserLoading } = useUser();
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        if (isUserLoading) {
            return; // Wait until user object is loaded
        }
        if (!user) {
            router.replace('/superuser/login');
            return;
        }

        user.getIdTokenResult().then((idTokenResult) => {
            if (idTokenResult.claims.superuser) {
                setIsAuthorized(true);
            } else {
                router.replace('/login'); // Not a superuser, redirect to normal login
            }
        });

    }, [user, isUserLoading, router]);

    if (isUserLoading || !isAuthorized) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }
    
    return (
         <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 md:py-12">
            <SuperUserDashboard />
        </div>
    );
}
