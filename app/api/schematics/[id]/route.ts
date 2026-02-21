import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteFile } from "@/lib/s3";

/**
 * GET /api/schematics/[id]
 * Get a single schematic with full details.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const schematic = await prisma.schematic.findFirst({
      where: { id, userId: session.user.id },
      include: {
        pages: {
          orderBy: { pageNumber: "asc" },
        },
        components: true,
        bomItems: true,
        _count: {
          select: {
            components: true,
            pages: true,
            bomItems: true,
          },
        },
      },
    });

    if (!schematic) {
      return NextResponse.json(
        { error: "Schematic not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(schematic);
  } catch (error) {
    console.error("Get schematic error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/schematics/[id]
 * Delete a schematic and its S3 file.
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const schematic = await prisma.schematic.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!schematic) {
      return NextResponse.json(
        { error: "Schematic not found" },
        { status: 404 }
      );
    }

    // Delete file from S3
    if (schematic.fileUrl) {
      try {
        await deleteFile(schematic.fileUrl);
      } catch (err) {
        console.error("S3 delete error:", err);
        // Continue with DB deletion even if S3 fails
      }
    }

    // Delete from database (cascade will remove pages, components, etc.)
    await prisma.schematic.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete schematic error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
