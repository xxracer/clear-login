
'use client';

import { getCandidates as getAllCandidates, getInterviewCandidates as getAllInterviewCandidates } from "./client-actions";

export async function getNewCandidates() {
    const candidates = await getAllCandidates();
    return candidates.filter(c => c.status === 'candidate');
}

export async function getCombinedCandidates() {
    const candidates = await getAllCandidates();
    const interviewCandidates = await getAllInterviewCandidates();
    return [...candidates, ...interviewCandidates].sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime());
}
