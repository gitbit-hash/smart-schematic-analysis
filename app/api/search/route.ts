import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/search?q=...&type=...&page=1&limit=20
 * Search components and text across user's schematics.
 */
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";
    const type = searchParams.get("type") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    if (!query && !type) {
      return NextResponse.json({ results: [], total: 0 });
    }

    // Build component filter
    const componentWhere: Record<string, unknown> = {
      schematic: { userId: session.user.id },
    };

    if (type) {
      componentWhere.type = type;
    }

    if (query) {
      componentWhere.OR = [
        { refDesignator: { contains: query, mode: "insensitive" } },
        { value: { contains: query, mode: "insensitive" } },
        { type: { contains: query, mode: "insensitive" } },
      ];
    }

    const [components, totalComponents] = await Promise.all([
      prisma.component.findMany({
        where: componentWhere,
        include: {
          schematic: { select: { id: true, fileName: true } },
          page: { select: { pageNumber: true } },
        },
        skip,
        take: limit,
        orderBy: { confidence: "desc" },
      }),
      prisma.component.count({ where: componentWhere }),
    ]);

    // Also search text blocks if we have a query
    let textResults: unknown[] = [];
    let totalText = 0;

    if (query) {
      const textWhere = {
        page: { schematic: { userId: session.user.id } },
        text: { contains: query, mode: "insensitive" as const },
      };

      [textResults, totalText] = await Promise.all([
        prisma.textBlock.findMany({
          where: textWhere,
          include: {
            page: {
              select: {
                pageNumber: true,
                schematic: { select: { id: true, fileName: true } },
              },
            },
          },
          take: 10,
          orderBy: { confidence: "desc" },
        }),
        prisma.textBlock.count({ where: textWhere }),
      ]);
    }

    return NextResponse.json({
      components: components.map((c) => ({
        id: c.id,
        type: c.type,
        refDesignator: c.refDesignator,
        value: c.value,
        confidence: c.confidence,
        schematicId: c.schematic.id,
        schematicName: c.schematic.fileName,
        pageNumber: c.page.pageNumber,
      })),
      textBlocks: textResults,
      pagination: {
        page,
        limit,
        totalComponents,
        totalText,
      },
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
