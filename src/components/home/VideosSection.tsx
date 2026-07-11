"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Play } from "lucide-react";

interface VideosSectionProps {
  dict: any;
  lang: string;
}

export function VideosSection({ dict, lang }: VideosSectionProps) {
  const [latestVideo, setLatestVideo] = useState<any>(null);

  useEffect(() => {
    fetch('/api/videos')
      .then(res => res.json())
      .then(data => {
        if (data?.videos?.length > 0) {
          setLatestVideo(data.videos[0]);
        }
      })
      .catch(console.error);
  }, []);

  const getLocalizedUrl = (path: string) => (lang === "es" ? path : `/${lang}${path}`);

  return (
    <section className="py-16 bg-[#33275f] text-white">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-4" style={{ fontFamily: "'Lato', sans-serif" }}>
          {dict.videosTitle}
        </h2>
        <div className="w-12 h-1 bg-[#c2a2e8] mx-auto mb-10"></div>
        
        <div className="max-w-2xl mx-auto relative rounded-2xl overflow-hidden shadow-2xl mb-8">
          {latestVideo ? (
            <div className="aspect-video w-full bg-black">
              <iframe 
                width="100%" 
                height="100%" 
                src={`https://www.youtube.com/embed/${latestVideo.id}`} 
                title={latestVideo.title}
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
              ></iframe>
            </div>
          ) : (
            <Link href={getLocalizedUrl("/videos")} className="block relative aspect-video w-full bg-black/50 group">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Play className="w-8 h-8 text-white ml-1" fill="white" />
                </div>
              </div>
            </Link>
          )}
        </div>

        <Link
          href={getLocalizedUrl("/videos")}
          className="inline-block border-2 border-[#c2a2e8] text-[#c2a2e8] hover:bg-[#c2a2e8] hover:text-[#33275f] px-6 py-2 rounded-full font-bold transition-all duration-300"
        >
          {dict.videosBtn}
        </Link>
      </div>
    </section>
  );
}
