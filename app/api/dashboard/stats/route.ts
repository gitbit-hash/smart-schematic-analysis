import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/dashboard/stats
 * Aggregated stats for the authenticated user's dashboard.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const [
      totalSchematics,
      totalComponents,
      totalPages,
      recentSchematics,
      user,
    ] = await Promise.all([
      prisma.schematic.count({ where: { userId } }),
      prisma.component.count({
        where: { schematic: { userId } },
      }),
      prisma.schematicPage.count({
        where: { schematic: { userId } },
      }),
      prisma.schematic.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          fileName: true,
          status: true,
          createdAt: true,
          _count: { select: { components: true } },
        },
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { tier: true },
      }),
    ]);

    // Tier limits
    const tierLimits: Record<string, number> = {
      FREE: 50,
      BASIC: 500,
      PROFESSIONAL: 5000,
      TEAM: Infinity,
    };

    return NextResponse.json({
      totalSchematics,
      totalComponents,
      totalPages,
      searches: 0, // TODO: track searches
      tier: user?.tier || "FREE",
      schematicLimit: tierLimits[user?.tier || "FREE"],
      recentSchematics,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
