import { prisma } from "@/lib/prisma";
import logger from "@/lib/logger";
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

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.checks.database = "ok";
    logger.info({ checks }, "Health check: All systems operational");
  } catch (error) {
    checks.checks.database = "error";
    checks.status = "degraded";
    logger.warn(
      { 
        error: error instanceof Error ? error.message : String(error),
        checks 
      },
      "Health check: Database connection failed"
    );
  }

  return NextResponse.json(checks, {
    status: checks.status === "ok" ? 200 : 503,
  });
}
