import { invalidateWeddingContent } from "@/lib/revalidate";
import { apiError } from "@/lib/api-errors";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { getPrismaClient } from "@/lib/db";
import { dressColorSchema, sectionSchema } from "@/lib/validations";
import { saveContent, saveTheme, saveWeddingSettings } from "@/lib/settings";

export async function PATCH(request: Request) {
  try {
    const save = async () => {
  await requireAdmin(request);
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const body = await request.json();

  if (type === "event") return Response.json(await saveWeddingSettings(body));
  if (type === "content") return Response.json(await saveContent(body));
  if (type === "theme") return Response.json(await saveTheme(body));
  if (type === "colors") {
    const result = z.array(dressColorSchema.extend({ id: z.string().min(1) })).max(12).safeParse(body);
    if (!result.success) return Response.json({ error: "Please check the colors. Each color needs a name, valid hex value, and a whole-number order of zero or more." }, { status: 400 });
    const colors = result.data;
    const ids = colors.map((color) => color.id);
    if (new Set(ids).size !== ids.length) return Response.json({ error: "Each color must have a unique ID." }, { status: 400 });
    await getPrismaClient().$transaction(async (tx) => {
      for (const color of colors) {
        await tx.dressCodeColor.upsert({ where: { id: color.id }, update: color, create: color });
      }
      await tx.dressCodeColor.deleteMany({ where: { id: { notIn: ids } } });
    });
    return Response.json(await getPrismaClient().dressCodeColor.findMany({ orderBy: { sortOrder: "asc" } }));
  }
  if (type === "color") {
    const color = dressColorSchema.parse(body);
    if (color.id) {
      return Response.json(await getPrismaClient().dressCodeColor.upsert({ where: { id: color.id }, update: color, create: color }));
    }
    const data = { name: color.name, hex: color.hex, sortOrder: color.sortOrder };
    return Response.json(await getPrismaClient().dressCodeColor.create({ data }), { status: 201 });
  }
  if (type === "section") {
    const section = sectionSchema.parse(body);
    return Response.json(
      await getPrismaClient().sectionSetting.upsert({
        where: { sectionKey: section.sectionKey },
        update: section,
        create: section
      })
    );
  }

  return Response.json({ error: "Unknown settings type." }, { status: 400 });

    };
    const response = await save();
    if (response.ok) invalidateWeddingContent();
    return response;
  } catch (error) { return apiError(error); }
}
