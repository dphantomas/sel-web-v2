import { getServerSession } from "next-auth";
import { authOptions } from "@/modules/auth/auth";
import { getDictionary, Locale } from "@/i18n/dictionaries";
import { getPublishedPosts } from "@/modules/blog/services";
import { prisma } from "@/lib/prisma";

import { HeroSection } from "@/components/home/HeroSection";
import { ProcessSection } from "@/components/home/ProcessSection";
import { FacilitatorsSection } from "@/components/home/FacilitatorsSection";
import { TestimonialsSection } from "@/components/home/TestimonialsSection";
import { VideosSection } from "@/components/home/VideosSection";
import { BlogSection } from "@/components/home/BlogSection";
import { CtaSection } from "@/components/home/CtaSection";

export const dynamic = "force-dynamic";

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const session = await getServerSession(authOptions);
  const dict = await getDictionary(lang as Locale);
  
  let posts: any[] = [];
  try {
    posts = await getPublishedPosts(lang);
    posts = posts.slice(0, 3);
  } catch (error) {
    console.error("Error fetching blog posts for home:", error);
  }

  let phrases: { id: string; textEs: string; textEn: string }[] = [];
  try {
    phrases = await prisma.homePhrase.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
    });
  } catch (error) {
    console.error("Error fetching home phrases:", error);
  }

  const homeDict = dict.home;

  return (
    <div className="flex flex-col min-h-screen bg-white font-sans">
      <HeroSection dict={homeDict} lang={lang} session={session} />
      <ProcessSection dict={homeDict} lang={lang} phrases={phrases} />
      <FacilitatorsSection dict={homeDict} lang={lang} />
      <TestimonialsSection dict={homeDict} lang={lang} />
      <VideosSection dict={homeDict} lang={lang} />
      <BlogSection dict={homeDict} lang={lang} posts={posts} />
      <CtaSection dict={homeDict} lang={lang} />
    </div>
  );
}
