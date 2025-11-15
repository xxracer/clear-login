
'use client';

import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowRight, File, Folder, Files, Info } from "lucide-react";

export default function MiscDocumentsPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
              <h1 className="text-3xl font-headline font-bold text-foreground flex items-center gap-3"><Files className="h-8 w-8" />Miscellaneous Documents</h1>
              <span className="font-medium text-amber-500 bg-amber-500/10 px-2 py-1 rounded-full text-xs">Available Soon</span>
          </div>
          <div className="flex items-center gap-2 text-primary animate-pulse">
              <p className="text-sm font-medium">Click here first!</p>
              <ArrowRight className="h-4 w-4" />
               <AlertDialog>
                  <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7"><Info className="h-5 w-5 text-muted-foreground" /></Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                      <AlertDialogHeader>
                          <AlertDialogTitle>Coming Soon: Miscellaneous Documents</AlertDialogTitle>
                          <AlertDialogDescription>
                              This section will serve as a central repository for all other company documents that are not tied to a specific employee's onboarding, such as company policies, handbooks, and general forms.
                          </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                          <AlertDialogAction>Got it!</AlertDialogAction>
                      </AlertDialogFooter>
                  </AlertDialogContent>
              </AlertDialog>
          </div>
      </div>

      <div className="relative pointer-events-none opacity-50">
        <div className="absolute inset-0 bg-background/50 z-10"></div>
        <div className="border rounded-lg">
             <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Last Modified</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    <TableRow className="font-medium">
                        <TableCell><div className="flex items-center gap-2"><Folder /> <span>Company Policies</span></div></TableCell>
                        <TableCell>Folder</TableCell>
                        <TableCell>June 15, 2024</TableCell>
                    </TableRow>
                     <TableRow className="font-medium">
                        <TableCell><div className="flex items-center gap-2"><Folder /> <span>HR Forms</span></div></TableCell>
                        <TableCell>Folder</TableCell>
                        <TableCell>May 30, 2024</TableCell>
                    </TableRow>
                     <TableRow>
                        <TableCell><div className="flex items-center gap-2"><File /> <span>Employee_Handbook_2024.pdf</span></div></TableCell>
                        <TableCell>PDF Document</TableCell>
                        <TableCell>June 15, 2024</TableCell>
                    </TableRow>
                     <TableRow>
                        <TableCell><div className="flex items-center gap-2"><File /> <span>IT_Security_Guidelines.pdf</span></div></TableCell>
                        <TableCell>PDF Document</TableCell>
                        <TableCell>April 22, 2024</TableCell>
                    </TableRow>
                      <TableRow>
                        <TableCell><div className="flex items-center gap-2"><File /> <span>Holiday_Schedule.pdf</span></div></TableCell>
                        <TableCell>PDF Document</TableCell>
                        <TableCell>January 5, 2024</TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </div>
      </div>
    </div>
  );
}
