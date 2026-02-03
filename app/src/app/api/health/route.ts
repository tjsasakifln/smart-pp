import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const checks = {
    status: "ok" as "ok" | "degraded" | "error",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    checks: {
      database: "unknown" as "ok" | "error" | "unknown",
    },
  };

  // Database check
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.checks.database = "ok";
  } catch {
    checks.checks.database = "error";
    checks.status = "degraded";
  }

  return NextResponse.json(checks, {
    status: checks.status === "ok" ? 200 : 503,
  });
}
