import { prisma } from "@/lib/prisma";

export async function getPublishedPosts(language: string) {
  return prisma.post.findMany({
    where: {
      published: true,
      language: language,
    },
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      author: {
        select: {
          firstName: true,
          lastName: true,
          image: true,
        },
      },
    },
  });
}

export async function getPostBySlug(slug: string, language: string) {
  return prisma.post.findFirst({
    where: {
      slug: slug,
      language: language,
      published: true,
    },
    include: {
      author: {
        select: {
          firstName: true,
          lastName: true,
          image: true,
        },
      },
    },
  });
}
