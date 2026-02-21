import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateUploadUrl, buildSchematicKey } from "@/lib/s3";

// Tier-based file size limits (in bytes)
const TIER_LIMITS: Record<string, { maxFileSize: number; maxSchematics: number }> = {
  FREE: { maxFileSize: 10 * 1024 * 1024, maxSchematics: 50 },         // 10 MB
  BASIC: { maxFileSize: 50 * 1024 * 1024, maxSchematics: 500 },       // 50 MB
  PROFESSIONAL: { maxFileSize: 100 * 1024 * 1024, maxSchematics: 5000 }, // 100 MB
  TEAM: { maxFileSize: 200 * 1024 * 1024, maxSchematics: Infinity },   // 200 MB
};

/**
 * POST /api/upload
 * Creates a schematic record and returns a presigned upload URL.
 *
 * Body: { fileName: string, fileSize: number, contentType: string }
 * Returns: { uploadUrl: string, schematicId: string }
 */
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { fileName, fileSize, contentType } = await req.json();

    // Validate input
    if (!fileName || !fileSize) {
      return NextResponse.json(
        { error: "fileName and fileSize are required" },
        { status: 400 }
      );
    }

    if (contentType !== "application/pdf") {
      return NextResponse.json(
        { error: "Only PDF files are accepted" },
        { status: 400 }
      );
    }

    // Get user tier
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { tier: true },
    });

    const tier = user?.tier || "FREE";
    const limits = TIER_LIMITS[tier];

    // Check file size limit
    if (fileSize > limits.maxFileSize) {
      const maxMB = Math.round(limits.maxFileSize / (1024 * 1024));
      return NextResponse.json(
        { error: `File size exceeds ${maxMB} MB limit for your ${tier} plan` },
        { status: 413 }
      );
    }

    // Check schematic count limit
    const schematicCount = await prisma.schematic.count({
      where: { userId: session.user.id },
    });

    if (schematicCount >= limits.maxSchematics) {
      return NextResponse.json(
        { error: `You have reached the ${limits.maxSchematics} schematic limit for your ${tier} plan` },
        { status: 403 }
      );
    }

    // Create schematic record
    const schematic = await prisma.schematic.create({
      data: {
        userId: session.user.id,
        fileName,
        fileUrl: "", // Will be set after upload completes
        fileSize,
        status: "UPLOADED",
      },
    });

    // Build S3 key and generate presigned URL
    const key = buildSchematicKey(session.user.id, schematic.id, fileName);
    const uploadUrl = await generateUploadUrl(key, contentType);

    // Update schematic with file URL
    await prisma.schematic.update({
      where: { id: schematic.id },
      data: { fileUrl: key },
    });

    return NextResponse.json(
      {
        uploadUrl,
        schematicId: schematic.id,
        key,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
