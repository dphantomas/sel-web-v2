"use client";

import Link from "next/link";
import { BlogGrid } from "./BlogGrid";

interface BlogSectionProps {
  dict: any;
  lang: string;
  posts?: any[];
}

export function BlogSection({ dict, lang, posts }: BlogSectionProps) {
  const getLocalizedUrl = (path: string) => (lang === "es" ? path : `/${lang}${path}`);

  return (
    <section className="py-16 bg-[#f9f9f9]">
      <div className="max-w-5xl mx-auto px-6 mb-10 text-center">
        <h2 className="text-2xl md:text-3xl text-[#33275f] font-bold mb-4" style={{ fontFamily: "'Lato', sans-serif" }}>
          {dict.blogTitle}
        </h2>
        <div className="w-12 h-1 bg-[#c2a2e8] mx-auto"></div>
      </div>
      
      <div className="pb-8">
        <BlogGrid lang={lang} limit={3} dynamicPosts={posts} />
      </div>

      <div className="text-center mt-2">
        <Link
          href={getLocalizedUrl("/blog")}
          className="inline-block border-2 border-[#6E678D] text-[#6E678D] hover:bg-[#6E678D] hover:text-white px-6 py-2 rounded-full font-bold transition-all duration-300"
        >
          {dict.blogBtn}
        </Link>
      </div>
    </section>
  );
}
