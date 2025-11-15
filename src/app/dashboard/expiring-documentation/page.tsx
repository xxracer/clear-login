
'use client';

import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, ArrowRight, FileClock, Info } from "lucide-react";

export default function ExpiringDocumentationPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
              <h1 className="text-3xl font-headline font-bold text-foreground flex items-center gap-3"><FileClock className="h-8 w-8" />Expiring Documentation</h1>
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
                          <AlertDialogTitle>Coming Soon: Expiring Documentation</AlertDialogTitle>
                          <AlertDialogDescription>
                              This page will automatically track and flag all time-sensitive employee documents, such as driver's licenses, certifications, and work permits. You will receive notifications and be able to manage renewals directly from here.
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
        <Card>
          <CardContent className="p-0">
              <Table>
                  <TableHeader>
                      <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Document</TableHead>
                          <TableHead>Expiration Date</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                        <TableRow className="bg-destructive/10">
                            <TableCell className="font-medium flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-destructive" />
                                John Smith
                            </TableCell>
                            <TableCell className="capitalize">Active</TableCell>
                            <TableCell>Driver's License</TableCell>
                            <TableCell>July 1, 2024</TableCell>
                            <TableCell className="text-right space-x-2">
                               <Button variant="secondary" size="sm" disabled>Update</Button>
                               <Button variant="outline" size="sm" disabled>Notify</Button>
                            </TableCell>
                        </TableRow>
                         <TableRow className="bg-yellow-100/50 dark:bg-yellow-900/20">
                            <TableCell className="font-medium flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                                Maria Garcia
                            </TableCell>
                            <TableCell className="capitalize">Active</TableCell>
                            <TableCell>PCA Certification</TableCell>
                            <TableCell>August 15, 2024</TableCell>
                            <TableCell className="text-right space-x-2">
                                <Button variant="secondary" size="sm" disabled>Update</Button>
                                <Button variant="outline" size="sm" disabled>Notify</Button>
                            </TableCell>
                        </TableRow>
                         <TableRow>
                            <TableCell className="font-medium flex items-center gap-2">
                                David Johnson
                            </TableCell>
                            <TableCell className="capitalize">Active</TableCell>
                            <TableCell>Driver's License</TableCell>
                            <TableCell>October 20, 2025</TableCell>
                            <TableCell className="text-right space-x-2">
                               <Button variant="secondary" size="sm" disabled>Update</Button>
                               <Button variant="outline" size="sm" disabled>Notify</Button>
                            </TableCell>
                        </TableRow>
                  </TableBody>
              </Table>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
