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
import { deleteUser, setSuperUserClaim, listAuthUsers } from "@/app/actions/auth-actions";
import { useAuth } from "@/firebase";
import { format } from "date-fns";
import type { UserRecord } from "firebase-admin/auth";


function UserList() {
    const { toast } = useToast();
    const [users, setUsers] = useState<UserRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const auth = useAuth();
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
        if (!auth.currentUser) return;
        fetchUsers();
    }, [auth.currentUser, fetchUsers]);
    
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
            toast({ title: "Superuser Set", description: "User has been granted superuser privileges. Please log out and log back in." });
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
                <CardTitle className="flex items-center gap-2"><Users /> Firebase Auth Users</CardTitle>
                <CardDescription>List of all users in Firebase Authentication. Create users in the Firebase Console, then promote them here.</CardDescription>
            </CardHeader>
            <CardContent>
                {users.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center">No users found in Firebase Authentication.</p>
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
        </div>
    );
}
