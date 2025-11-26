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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createAdminUser, deleteUser, setSuperUserClaim } from "@/app/actions/auth-actions";
import { getFirestore, collection, onSnapshot, QuerySnapshot, DocumentData } from "firebase/firestore";
import { useFirestore, errorEmitter, FirestorePermissionError, useAuth } from "@/firebase";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";


function CreateAdminForm({ onAdminCreated }: { onAdminCreated: () => void}) {
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [startDate, setStartDate] = useState<Date>();
    const [endDate, setEndDate] = useState<Date>();

    const handleCreateAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password || !companyName) {
            toast({ variant: "destructive", title: "Missing fields", description: "Please fill out all fields." });
            return;
        }

        startTransition(async () => {
            const companyId = companyName.toLowerCase().replace(/\s+/g, '-');
            const result = await createAdminUser(email, password, companyId, startDate, endDate);
            if (result.success) {
                toast({ title: "Admin User Created", description: `User ${email} for company ${companyName} created.` });
                setEmail('');
                setPassword('');
                setCompanyName('');
                setStartDate(undefined);
                setEndDate(undefined);
                onAdminCreated();
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                         <div className="space-y-2">
                            <Label htmlFor="start-date">Subscription Start</Label>
                             <Popover>
                                <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                                </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="end-date">Subscription End</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn("w-full justify-start text-left font-normal", !endDate && "text-muted-foreground")}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                                </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
                                </PopoverContent>
                            </Popover>
                        </div>
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

interface UserProfile {
    uid: string;
    email: string;
    companyId: string;
    subscriptionStartDate?: string;
    subscriptionEndDate?: string;
}

function UserList() {
    const { toast } = useToast();
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const firestore = useFirestore();
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [isClaiming, setIsClaiming] = useState<string | null>(null);
    const auth = useAuth();

    useEffect(() => {
        if (!firestore || !auth.currentUser) {
            // Wait for user to be authenticated
            return;
        };

        setLoading(true);
        const usersRef = collection(firestore, 'users');
        const unsubscribe = onSnapshot(usersRef, (snapshot: QuerySnapshot<DocumentData>) => {
            const userList = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
            setUsers(userList);
            setLoading(false);
        }, (serverError) => {
            const permissionError = new FirestorePermissionError({
                path: usersRef.path,
                operation: 'list',
            });
            errorEmitter.emit('permission-error', permissionError);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [firestore, auth.currentUser, toast]);
    
    const handleDeleteUser = async (uid: string) => {
        setIsDeleting(uid);
        const result = await deleteUser(uid);
        if (result.success) {
            toast({ title: "User Deleted", description: "The user has been successfully removed."});
        } else {
            toast({ variant: "destructive", title: "Deletion Failed", description: result.error });
        }
        setIsDeleting(null);
    }
    
    const handleSetSuperuser = async (uid: string) => {
        setIsClaiming(uid);
        const result = await setSuperUserClaim(uid);
        if (result.success) {
            toast({ title: "Superuser Set", description: "User has been granted superuser privileges. Please log out and log back in." });
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
                                    <p className="text-sm text-muted-foreground">Company: {user.companyId}</p>
                                    <p className="text-xs text-muted-foreground">
                                        Subscribed: {user.subscriptionStartDate ? format(new Date(user.subscriptionStartDate), 'P') : 'N/A'}
                                        {' - '}
                                        {user.subscriptionEndDate ? format(new Date(user.subscriptionEndDate), 'P') : 'N/A'}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                     <Button variant="outline" size="sm" onClick={() => handleSetSuperuser(user.uid)} disabled={isClaiming === user.uid} title="Promote to Superuser">
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


export default function SuperUserDashboardPage() {
    const [isResetting, startResetTransition] = useTransition();
    const router = useRouter();
    const auth = useAuth();
    const { toast } = useToast();
    // This state is to force a re-render of UserList when a user is created
    const [userListVersion, setUserListVersion] = useState(0);

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
        await auth.signOut();
        router.push('/superuser/login');
    };
    
    const refreshUserList = useCallback(() => {
        setUserListVersion(v => v + 1);
    }, []);

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
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
                
                <CreateAdminForm onAdminCreated={refreshUserList} />

                <UserList key={userListVersion} />

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
        </div>
    );
}
