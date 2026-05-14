import { prisma } from "@/lib/prisma";

export async function GET() {
  const users = await prisma.user.findMany({
    orderBy: { slug: "asc" },
  });
  return Response.json(users);
}
