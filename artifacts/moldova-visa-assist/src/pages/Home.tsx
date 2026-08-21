import { Link } from "wouter";
import { ArrowRight, CheckCircle2, Globe, Shield, Users, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGetSiteStats, useListJobs, getGetSiteStatsQueryKey, getListJobsQueryKey } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/lib/i18n";
import { useEffect, useState } from "react";

const heroImages = [
  "https://raw.githubusercontent.com/ciobanuceba/moldova-visa-backup/main/moldova-visa/public/IMG_20260821_120344_640.png",
  "https://raw.githubusercontent.com/ciobanuceba/moldova-visa-backup/main/moldova-visa/public/IMG_20260821_120408_084.png",
  "https://raw.githubusercontent.com/ciobanuceba/moldova-visa-backup/main/moldova-visa/public/IMG_20260821_120429_892.png",
  "https://raw.githubusercontent.com/ciobanuceba/moldova-visa-backup/main/moldova-visa/public/IMG_20260821_120448_798.png",
  "https://raw.githubusercontent.com/ciobanuceba/moldova-visa-backup/main/moldova-visa/public/IMG_20260821_120518_669.png",
  "https://raw.githubusercontent.com/ciobanuceba/moldova-visa-backup/main/moldova-visa/public/IMG_20260821_120629_594.png",
];

export default function Home() {
  const { t } = useI18n();
  const [heroIndex, setHeroIndex] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setHeroIndex((i) => (i + 1) % heroImages.length), 5000);
    return () => window.clearInterval(timer);
  }, []);

  const { data: stats, isLoading: statsLoading } = useGetSiteStats({ query: { queryKey: getGetSiteStatsQueryKey() } });
  const { data: jobs, isLoading: jobsLoading } = useListJobs(undefined, { query: { queryKey: getListJobsQueryKey() } });
  const featuredJobs = jobs?.slice(0, 3) || [];
  const features = [
    { icon: <CheckCircle2 className="h-7 w-7 text-secondary" />, title: t.home.feature1Title, desc: t.home.feature1Desc },
    { icon: <Shield className="h-7 w-7 text-secondary" />, title: t.home.feature2Title, desc: t.home.feature2Desc },
    { icon: <Globe className="h-7 w-7 text-secondary" />, title: t.home.feature3Title, desc: t.home.feature3Desc },
    { icon: <Users className="h-7 w-7 text-secondary" />, title: t.home.feature4Title, desc: t.home.feature4Desc },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <section className="relative bg-primary pt-16 pb-24 overflow-hidden">
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-primary via-primary to-primary/90" />
        <div className="container mx-auto px-4 md:px-8 relative z-10">
          <div className="max-w-5xl mx-auto">
            <div className="relative w-full aspect-[16/9] md:aspect-[2/1] overflow-hidden rounded-3xl border border-white/20 shadow-2xl bg-black/20">
              {heroImages.map((src, index) => (
                <img
                  key={src}
                  src={src}
                  alt={`Moldova vineyard worker ${index + 1}`}
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${index === heroIndex ? "opacity-100" : "opacity-0"}`}
                />
              ))}
              <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 z-10" aria-label="Hero slideshow controls">
                {heroImages.map((_, index) => (
                  <button key={index} type="button" onClick={() => setHeroIndex(index)} aria-label={`Show slide ${index + 1}`} className={`h-2.5 rounded-full transition-all ${index === heroIndex ? "w-9 bg-secondary" : "w-2.5 bg-white/70"}`} />
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
              <Button size="lg" variant="secondary" className="font-semibold px-8" asChild>
                <Link href="/jobs">{t.home.browseJobs} <ArrowRight className="ml-2 h-5 w-5" /></Link>
              </Button>
              <Button size="lg" variant="outline" className="font-semibold bg-white/10 text-white border-white/20 hover:bg-white/20" asChild>
                <Link href="/services">{t.home.learnVisa}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 bg-card border-b border-border"><div className="container mx-auto px-4 md:px-8"><div className="grid grid-cols-2 md:grid-cols-4 gap-8">{statsLoading ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="flex flex-col items-center justify-center p-4"><Skeleton className="h-10 w-24 mb-2" /><Skeleton className="h-4 w-32" /></div>) : <><StatCard value={`${stats?.totalJobs ?? 0}+`} label={t.home.statsJobs} /><StatCard value={`${stats?.totalApplications ?? 0}+`} label={t.home.statsPlaced} /><StatCard value={`${stats?.countriesServed ?? 0}+`} label={t.home.statsPartners} /><StatCard value="98%" label={t.home.statsSuccess} /></>}</div></div></section>

      <section className="py-20 bg-background"><div className="container mx-auto px-4 md:px-8"><div className="text-center mb-14"><h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-4">{t.home.whyChoose}</h2><p className="text-muted-foreground max-w-2xl mx-auto">{t.home.whyDesc}</p></div><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">{features.map((f) => <div key={f.title} className="bg-card border border-border rounded-2xl p-6 hover:shadow-md transition-shadow"><div className="mb-4">{f.icon}</div><h3 className="font-serif font-bold text-foreground mb-2">{f.title}</h3><p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p></div>)}</div></div></section>

      <section className="py-20 bg-muted/40 border-y border-border"><div className="container mx-auto px-4 md:px-8"><div className="flex items-center justify-between mb-10"><div><h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-2">{t.home.featuredJobs}</h2><p className="text-muted-foreground">{t.home.featuredDesc}</p></div><Button variant="outline" asChild className="hidden md:flex"><Link href="/jobs">{t.home.viewAll} <ArrowRight className="ml-2 h-4 w-4" /></Link></Button></div><div className="grid grid-cols-1 md:grid-cols-3 gap-6">{jobsLoading ? Array.from({ length: 3 }).map((_, i) => <div key={i} className="bg-card border border-border rounded-2xl p-6 space-y-3"><Skeleton className="h-5 w-24" /><Skeleton className="h-7 w-3/4" /><Skeleton className="h-4 w-1/2" /><Skeleton className="h-20 w-full" /></div>) : featuredJobs.length > 0 ? featuredJobs.map((job) => <div key={job.id} className="group bg-card border border-border rounded-2xl p-6 flex flex-col hover:border-secondary/50 hover:shadow-md transition-all"><div className="flex items-center gap-2 mb-3"><span className="text-xs font-medium px-2.5 py-1 bg-secondary/10 text-secondary rounded-full">{job.category}</span><span className="text-xs text-muted-foreground px-2 py-1 bg-muted rounded-full">{job.type}</span></div><h3 className="font-serif font-bold text-lg text-foreground mb-1 leading-snug">{job.title}</h3><div className="flex items-center gap-1 text-sm text-muted-foreground mb-4"><Briefcase className="h-3.5 w-3.5" /><span>{job.location}</span></div><p className="text-muted-foreground text-sm line-clamp-3 mb-6 flex-1">{job.description}</p><div className="pt-4 border-t border-border mt-auto flex items-center justify-between"><span className="font-semibold text-primary text-sm">{job.salary}</span><Button variant="ghost" size="sm" className="group-hover:bg-primary group-hover:text-white transition-colors" asChild><Link href={`/jobs/${job.id}`}>{t.jobs.viewDetails}</Link></Button></div></div>) : <div className="col-span-3 text-center py-12 text-muted-foreground border border-dashed rounded-xl">{t.jobs.noResults}</div>}</div><div className="text-center md:hidden mt-8"><Button variant="outline" asChild className="w-full"><Link href="/jobs">{t.home.viewAll}</Link></Button></div></div></section>
    </div>
  );
}

function StatCard({ value, label }: { value: string; label: string }) { return <div className="text-center"><div className="text-3xl md:text-4xl font-bold text-primary">{value}</div><div className="text-sm text-muted-foreground mt-1">{label}</div></div>; }
