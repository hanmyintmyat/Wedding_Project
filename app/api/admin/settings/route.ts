import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { dressColorSchema, sectionSchema } from "@/lib/validations";
import { saveContent, saveTheme, saveWeddingSettings } from "@/lib/settings";

export async function PATCH(request: Request) {
  await requireAdmin();
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const body = await request.json();

  if (type === "event") return Response.json(await saveWeddingSettings(body));
  if (type === "content") return Response.json(await saveContent(body));
  if (type === "theme") return Response.json(await saveTheme(body));
  if (type === "colors") {
    const result = z.array(dressColorSchema.extend({ id: z.string().min(1) })).min(1).safeParse(body);
    if (!result.success) return Response.json({ error: "Add at least one color. Each color needs a name, valid hex value, and a whole-number order of zero or more." }, { status: 400 });
    const colors = result.data;
    const ids = colors.map((color) => color.id);
    if (new Set(ids).size !== ids.length) return Response.json({ error: "Each color must have a unique ID." }, { status: 400 });
    await prisma.$transaction(async (tx) => {
      for (const color of colors) {
        await tx.dressCodeColor.upsert({ where: { id: color.id }, update: color, create: color });
      }
      await tx.dressCodeColor.deleteMany({ where: { id: { notIn: ids } } });
    });
    return Response.json(await prisma.dressCodeColor.findMany({ orderBy: { sortOrder: "asc" } }));
  }
  if (type === "color") {
    const color = dressColorSchema.parse(body);
    if (color.id) {
      return Response.json(await prisma.dressCodeColor.upsert({ where: { id: color.id }, update: color, create: color }));
    }
    const data = { name: color.name, hex: color.hex, sortOrder: color.sortOrder };
    return Response.json(await prisma.dressCodeColor.create({ data }), { status: 201 });
  }
  if (type === "section") {
    const section = sectionSchema.parse(body);
    return Response.json(
      await prisma.sectionSetting.upsert({
        where: { sectionKey: section.sectionKey },
        update: section,
        create: section
      })
    );
  }

  return Response.json({ error: "Unknown settings type." }, { status: 400 });
}
