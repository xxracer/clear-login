
'use client';

import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, BookOpenCheck, Info } from "lucide-react";

export default function InServicesPage() {
  return (
    <div className="space-y-4">
       <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
              <h1 className="text-3xl font-headline font-bold text-foreground flex items-center gap-3"><BookOpenCheck className="h-8 w-8" />In-Services</h1>
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
                          <AlertDialogTitle>Coming Soon: In-Services</AlertDialogTitle>
                          <AlertDialogDescription>
                              This page will be used to manage and track employee in-service training and required certifications. You'll be able to assign courses, monitor progress, and maintain compliance records.
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
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>Required Annual Training</CardTitle>
                    <CardDescription>All employees must complete these courses by the end of the year.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="p-3 rounded-md border bg-background/30">
                        <div className="flex justify-between items-center mb-1">
                            <h4 className="font-semibold">HIPAA Compliance Training</h4>
                            <span className="text-sm font-medium text-muted-foreground">85% Complete</span>
                        </div>
                        <Progress value={85} />
                    </div>
                     <div className="p-3 rounded-md border bg-background/30">
                        <div className="flex justify-between items-center mb-1">
                            <h4 className="font-semibold">Workplace Safety Essentials</h4>
                            <span className="text-sm font-medium text-muted-foreground">100% Complete</span>
                        </div>
                        <Progress value={100} />
                    </div>
                     <div className="p-3 rounded-md border bg-background/30">
                        <div className="flex justify-between items-center mb-1">
                            <h4 className="font-semibold">Customer Service Excellence</h4>
                             <span className="text-sm font-medium text-muted-foreground">40% Complete</span>
                        </div>
                        <Progress value={40} />
                    </div>
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle>Role-Specific Certifications</CardTitle>
                    <CardDescription>Training assigned based on employee roles.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="p-3 rounded-md border bg-background/30">
                        <div className="flex justify-between items-center mb-1">
                            <h4 className="font-semibold">Advanced First Aid (PCA/HHA)</h4>
                            <span className="text-sm font-medium text-muted-foreground">75% Complete</span>
                        </div>
                        <Progress value={75} />
                    </div>
                     <div className="p-3 rounded-md border bg-background/30">
                        <div className="flex justify-between items-center mb-1">
                            <h4 className="font-semibold">Defensive Driving (Drivers)</h4>
                            <span className="text-sm font-medium text-muted-foreground">90% Complete</span>
                        </div>
                        <Progress value={90} />
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>

    </div>
  );
}
