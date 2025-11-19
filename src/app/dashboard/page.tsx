
'use client';

import { useEffect, useState } from 'react';
import { CandidateView } from "@/components/dashboard/candidate-view";
import { Settings, Loader2, Link as LinkIcon, Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { getCompanies } from '../actions/company-actions';
import { type Company } from '@/lib/company-schemas';
import { CopyApplicationLink } from '@/components/dashboard/copy-link';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";


export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<Company | null>(null);

  useEffect(() => {
    async function checkConfiguration() {
        setLoading(true);
        try {
            const companies = await getCompanies();
            setCompany(companies[0] || null);
        } catch (error) {
            console.error("Failed to load company data", error);
            setCompany(null);
        } finally {
            setLoading(false);
        }
    }
    checkConfiguration();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-12 w-12 text-muted-foreground animate-spin" />
        <p className="ml-4 text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  if (!company) {
    return (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm h-full">
            <Card className="w-full max-w-2xl text-left">
                <CardHeader>
                    <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted shrink-0">
                            <Settings className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <div>
                            <CardTitle className="font-headline text-2xl mt-1">Welcome to ClearComplyHR!</CardTitle>
                            <CardDescription className="mt-1">
                                Your all-in-one solution for effortless onboarding and applicant/employee management.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        We’re excited to help you streamline your HR process, stay compliant, and eliminate manual paperwork — all from one secure dashboard.
                    </p>
                    <div className="text-sm p-4 border bg-muted/50 rounded-lg space-y-2">
                        <p className="font-semibold">Here’s what you can do inside ClearComplyHR:</p>
                        <ul className="list-none space-y-2 text-muted-foreground">
                            <li><span className="text-green-500 mr-2">✅</span><strong>Automated Onboarding (No Logins Needed)</strong> – Send, track, and manage employee forms digitally and effortlessly — no logins required for staff or applicants.</li>
                            <li><span className="text-green-500 mr-2">✅</span><strong>Compliance Monitoring</strong> – Stay audit-ready with automatic OIG, license, and exclusion checks.</li>
                            <li><span className="text-green-500 mr-2">✅</span><strong>Document Management</strong> – Securely store and organize all employee files in one place.</li>
                            <li><span className="text-green-500 mr-2">✅</span><strong>Background & Training Tracking</strong> – Stay ahead of expiring credentials, in-services, and renewals.</li>
                            <li><span className="text-green-500 mr-2">✅</span><strong>Admin Dashboard</strong> – Get a real-time view of employee status, compliance gaps, and pending tasks.</li>
                            <li><span className="text-green-500 mr-2">✅</span><strong>Custom Branding</strong> – Personalize your candidate portal with your company’s name and logo.</li>
                        </ul>
                    </div>
                     <div className="text-center pt-4">
                        <p className="font-semibold mb-2">Next Step:</p>
                        <p className="text-sm text-muted-foreground mb-4">Let’s set up your company profile to personalize your onboarding experience and activate your ClearComplyHR dashboard.</p>
                        <Button asChild>
                            <Link href="/dashboard/settings">Go to Settings</Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
  }

  const onboardingProcesses = company.onboardingProcesses || [];

  return (
    <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
                <div className="flex items-center gap-2">
                    <h1 className="text-3xl font-headline font-bold text-foreground">Welcome to the Onboard Panel</h1>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7"><Info className="h-4 w-4 text-muted-foreground" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Dashboard Overview</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This is your main dashboard. From here, you can see your active candidate pipeline and quickly access application links to share with potential candidates.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogAction>Got it!</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
                <p className="text-muted-foreground">
                    Manage candidates or share application links to start onboarding.
                </p>
            </div>
        </div>

        {onboardingProcesses.length > 0 && (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <LinkIcon className="h-5 w-5" />
                        Application Links
                    </CardTitle>
                    <CardDescription>
                        Share these links with candidates to start a specific onboarding process.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                    {onboardingProcesses.map(process => (
                        <div key={process.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                            <span className="font-medium">{process.name}</span>
                            <CopyApplicationLink 
                                processId={process.id}
                                processName={process.name}
                            />
                        </div>
                    ))}
                    {onboardingProcesses.length > 1 && (
                         <div className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 border-t mt-2 pt-3">
                            <span className="font-medium text-muted-foreground">Generic Application</span>
                             <CopyApplicationLink />
                         </div>
                    )}
                </CardContent>
            </Card>
        )}

        {onboardingProcesses.length === 0 && (
            <div className="flex items-center justify-between rounded-lg border p-4">
                 <div>
                    <p className="font-medium">Generic Application Link</p>
                    <p className="text-sm text-muted-foreground">
                        No onboarding processes configured. This link uses the default application.
                    </p>
                 </div>
                 <CopyApplicationLink />
            </div>
        )}

        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-2xl">
                    Active Candidate Pipeline
                </CardTitle>
                 <CardDescription>
                    Track candidates currently in the interview or documentation phase.
                </CardDescription>
            </CardHeader>
             <CardContent>
                <CandidateView />
            </CardContent>
        </Card>
    </div>
  );
}
