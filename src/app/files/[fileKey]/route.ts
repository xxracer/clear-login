
// This file is no longer used and can be deleted.
// The new route is /app/employees/[employeeId]/file/[fileKey]/route.ts

import { NextRequest } from "next/server";

export async function GET(
    request: NextRequest,
    { params }: { params: { fileKey: string } }
) {
    return new Response('This route is deprecated.', { status: 410 });
}
