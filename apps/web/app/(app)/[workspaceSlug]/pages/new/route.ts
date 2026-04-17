import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { pages, workspaces } from "@syncspace/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { generateId } from "@/lib/utils";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ workspaceSlug: string }> }
) {
  const { workspaceSlug } = await params;

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  const workspace = await db.query.workspaces.findFirst({
    where: eq(workspaces.slug, workspaceSlug),
  });
  if (!workspace) {
    return new NextResponse("Workspace not found", { status: 404 });
  }

  const pageId = generateId();
  await db.insert(pages).values({
    id: pageId,
    workspaceId: workspace.id,
    title: "Untitled",
    createdById: session.user.id,
  });

  revalidatePath(`/${workspaceSlug}`, "layout");

  return NextResponse.redirect(
    new URL(`/${workspaceSlug}/pages/${pageId}`, req.url)
  );
}
