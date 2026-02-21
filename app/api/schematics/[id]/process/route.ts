import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/schematics/[id]/process
 * Trigger AI processing of a schematic.
 * For development: creates mock analysis data.
 */
export async function POST(
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
      return NextResponse.json({ error: "Schematic not found" }, { status: 404 });
    }

    if (schematic.status === "PROCESSING") {
      return NextResponse.json({ error: "Already processing" }, { status: 409 });
    }

    // Update status to PROCESSING
    await prisma.schematic.update({
      where: { id },
      data: { status: "PROCESSING" },
    });

    // --- MOCK MODE: Generate fake analysis data ---
    const useMock = process.env.AI_SERVICE_URL === "http://localhost:8000" || !process.env.AI_SERVICE_URL;

    if (useMock) {
      await generateMockData(id, schematic.userId);
    } else {
      // TODO: Call real AI service
      // const { triggerProcessing } = await import("@/lib/ai-service");
      // await triggerProcessing({ schematicId: id, fileUrl: schematic.fileUrl });
    }

    return NextResponse.json({ status: "processing", schematicId: id });
  } catch (error) {
    console.error("Process error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * Generate mock analysis data for development/demo purposes.
 */
async function generateMockData(schematicId: string, userId: string) {
  const pageCount = 3;

  // Create mock pages
  const pages = [];
  for (let i = 1; i <= pageCount; i++) {
    const page = await prisma.schematicPage.create({
      data: {
        schematicId,
        pageNumber: i,
        imageUrl: `mock://page-${i}.png`,
        width: 2480,
        height: 3508,
        connections: {
          nodes: [`R${i}`, `C${i}`, `U${i}`],
          edges: [
            { from: `R${i}`, to: `U${i}`, pin: "VCC" },
            { from: `C${i}`, to: `U${i}`, pin: "GND" },
          ],
        },
      },
    });
    pages.push(page);
  }

  // Mock component types with realistic data
  const componentTemplates = [
    { type: "resistor", prefix: "R", values: ["10kΩ", "4.7kΩ", "100Ω", "1MΩ", "330Ω", "220Ω"] },
    { type: "capacitor", prefix: "C", values: ["100nF", "10µF", "22pF", "1µF", "470µF"] },
    { type: "ic", prefix: "U", values: ["LM7805", "ATmega328P", "NE555", "LM358", "CD4017"] },
    { type: "diode", prefix: "D", values: ["1N4148", "1N4007", "LED Red", "LED Green"] },
    { type: "transistor", prefix: "Q", values: ["2N2222", "BC547", "IRF540N", "2N3904"] },
    { type: "inductor", prefix: "L", values: ["10µH", "100µH", "1mH"] },
    { type: "connector", prefix: "J", values: ["USB-C", "2-pin Header", "RJ45", "DC Jack"] },
  ];

  let compIndex = 0;

  for (const page of pages) {
    // Generate 5-10 components per page
    const numComponents = 5 + Math.floor(Math.random() * 6);

    for (let j = 0; j < numComponents; j++) {
      const template = componentTemplates[Math.floor(Math.random() * componentTemplates.length)];
      compIndex++;

      await prisma.component.create({
        data: {
          schematicId,
          pageId: page.id,
          type: template.type,
          refDesignator: `${template.prefix}${compIndex}`,
          value: template.values[Math.floor(Math.random() * template.values.length)],
          confidence: 0.75 + Math.random() * 0.25,
          bbox: {
            x: 100 + Math.random() * 2000,
            y: 100 + Math.random() * 3000,
            width: 80 + Math.random() * 120,
            height: 60 + Math.random() * 100,
          },
          attributes: {
            footprint: `${template.type.toUpperCase()}_SMD`,
          },
        },
      });
    }

    // Generate text blocks per page
    const textTemplates = [
      { text: "VCC", category: "PIN" as const },
      { text: "GND", category: "PIN" as const },
      { text: `Page ${page.pageNumber}`, category: "TITLE" as const },
      { text: "Rev 2.1", category: "NOTE" as const },
      { text: "10kΩ", category: "VALUE" as const },
      { text: "R1", category: "LABEL" as const },
      { text: "Power Supply", category: "TITLE" as const },
      { text: "Do not populate", category: "NOTE" as const },
    ];

    const numTexts = 4 + Math.floor(Math.random() * 5);
    for (let j = 0; j < numTexts; j++) {
      const tmpl = textTemplates[Math.floor(Math.random() * textTemplates.length)];

      await prisma.textBlock.create({
        data: {
          pageId: page.id,
          text: tmpl.text,
          confidence: 0.8 + Math.random() * 0.2,
          bbox: {
            x: 50 + Math.random() * 2200,
            y: 50 + Math.random() * 3200,
            width: 40 + Math.random() * 100,
            height: 15 + Math.random() * 25,
          },
          category: tmpl.category,
        },
      });
    }
  }

  // Generate BOM items from components
  const components = await prisma.component.findMany({
    where: { schematicId },
  });

  // Group by type+value to create BOM
  const bomGroups = new Map<string, { type: string; ref: string[]; value: string | null }>();
  for (const comp of components) {
    const key = `${comp.type}_${comp.value}`;
    const existing = bomGroups.get(key);
    if (existing) {
      existing.ref.push(comp.refDesignator || "");
    } else {
      bomGroups.set(key, {
        type: comp.type,
        ref: [comp.refDesignator || ""],
        value: comp.value,
      });
    }
  }

  for (const [, group] of bomGroups) {
    await prisma.bomItem.create({
      data: {
        schematicId,
        refDesignator: group.ref.join(", "),
        componentType: group.type,
        value: group.value,
        quantity: group.ref.length,
        footprint: `${group.type.toUpperCase()}_SMD`,
        partNumber: `MFR-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        price: parseFloat((0.05 + Math.random() * 10).toFixed(2)),
        inStock: Math.random() > 0.2,
      },
    });
  }

  // Update schematic
  await prisma.schematic.update({
    where: { id: schematicId },
    data: {
      status: "COMPLETED",
      pageCount,
    },
  });
}
