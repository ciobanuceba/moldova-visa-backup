import { useParams, Link } from "wouter";
import { ArrowLeft, Building2, MapPin, Briefcase, Clock, Calendar, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGetJob, getGetJobQueryKey } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

export default function JobDetail() {
  const { id } = useParams<{ id: string }>();
  const jobId = parseInt(id || "0");

  const { data: job, isLoading, error } = useGetJob(jobId, {
    query: { 
      enabled: !isNaN(jobId) && jobId > 0,
      queryKey: getGetJobQueryKey(jobId) 
    }
  });

  if (error || (!isLoading && !job)) {
    return (
      <div className="min-h-screen bg-muted/20 flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mb-6">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-primary mb-2">Job Not Found</h1>
        <p className="text-muted-foreground mb-6 text-center max-w-md">
          The position you are looking for may have been filled or no longer exists.
        </p>
        <Button asChild>
          <Link href="/jobs">Browse Other Opportunities</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20 pb-24">
      {/* Header */}
      <div className="bg-primary text-white pt-12 pb-24">
        <div className="container mx-auto px-4 md:px-8">
          <Link href="/jobs" className="inline-flex items-center text-primary-foreground/70 hover:text-white mb-8 transition-colors text-sm font-medium">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Jobs
          </Link>
          
          {isLoading ? (
            <div className="space-y-4 max-w-3xl">
              <Skeleton className="h-8 w-32 bg-white/20" />
              <Skeleton className="h-12 w-3/4 bg-white/20" />
              <Skeleton className="h-6 w-1/2 bg-white/20 mt-6" />
            </div>
          ) : job ? (
            <div className="max-w-4xl">
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="bg-secondary/20 text-secondary border border-secondary/30 text-xs font-semibold px-3 py-1 rounded-full">
                  {job.category}
                </span>
                {job.isActive ? (
                  <span className="bg-green-500/20 text-green-300 border border-green-500/30 text-xs font-semibold px-3 py-1 rounded-full flex items-center">
                    <span className="w-2 h-2 rounded-full bg-green-400 mr-2 animate-pulse"></span>
                    Actively Hiring
                  </span>
                ) : (
                  <span className="bg-white/10 text-white/70 text-xs font-semibold px-3 py-1 rounded-full">
                    Closed
                  </span>
                )}
              </div>
              
              <h1 className="text-4xl md:text-5xl font-serif font-bold mb-6 leading-tight">
                {job.title}
              </h1>
              
              <div className="flex flex-wrap items-center gap-6 text-primary-foreground/80 text-sm md:text-base">
                <div className="flex items-center">
                  <MapPin className="w-5 h-5 mr-2 text-secondary" />
                  {job.location}
                </div>
                <div className="flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-secondary" />
                  {job.type}
                </div>
                <div className="flex items-center">
                  <Briefcase className="w-5 h-5 mr-2 text-secondary" />
                  {job.salary}
                </div>
                <div className="flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-secondary" />
                  Posted {format(new Date(job.createdAt), "MMM d, yyyy")}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 md:px-8 -mt-12 relative z-10">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Main Content */}
          <div className="flex-1 bg-card rounded-xl shadow-sm border p-6 md:p-10">
            {isLoading ? (
              <div className="space-y-8">
                <Skeleton className="h-8 w-1/3" />
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
                <Skeleton className="h-8 w-1/3" />
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
              </div>
            ) : job ? (
              <div className="prose prose-blue max-w-none prose-headings:font-serif prose-headings:text-primary prose-a:text-secondary">
                <h2 className="text-2xl font-bold border-b pb-4 mb-6">About the Role</h2>
                <div className="whitespace-pre-wrap text-muted-foreground leading-relaxed mb-10">
                  {job.description}
                </div>

                <h2 className="text-2xl font-bold border-b pb-4 mb-6">Requirements</h2>
                <div className="whitespace-pre-wrap text-muted-foreground leading-relaxed mb-10">
                  {job.requirements}
                </div>

                {job.benefits && (
                  <>
                    <h2 className="text-2xl font-bold border-b pb-4 mb-6">Benefits & Support</h2>
                    <div className="whitespace-pre-wrap text-muted-foreground leading-relaxed">
                      {job.benefits}
                    </div>
                  </>
                )}
              </div>
            ) : null}
          </div>
          
          {/* Sidebar */}
          <div className="w-full lg:w-80 flex flex-col gap-6">
            <div className="bg-card rounded-xl shadow-sm border p-6 sticky top-24">
              <h3 className="font-bold text-lg text-primary mb-4">Interested in this role?</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Submit your application today. Our team will review your profile and contact you regarding the next steps, including visa procedures.
              </p>
              
              <Button 
                className="w-full mb-4 bg-secondary hover:bg-secondary/90 text-primary font-bold text-lg h-12" 
                disabled={!job?.isActive}
                asChild={job?.isActive}
              >
                {job?.isActive ? (
                  <Link href={`/apply/${job.id}`}>Apply Now</Link>
                ) : (
                  <span>Position Closed</span>
                )}
              </Button>
              
              <div className="text-xs text-center text-muted-foreground space-y-2 mt-4 pt-4 border-t">
                <div className="flex items-center justify-center">
                  <CheckCircle2 className="w-3 h-3 mr-1 text-green-500" /> Free application review
                </div>
                <div className="flex items-center justify-center">
                  <CheckCircle2 className="w-3 h-3 mr-1 text-green-500" /> Visa support included
                </div>
                <div className="flex items-center justify-center">
                  <CheckCircle2 className="w-3 h-3 mr-1 text-green-500" /> Direct employer connection
                </div>
              </div>
            </div>
            
            <div className="bg-primary/5 rounded-xl border border-primary/10 p-6">
              <h3 className="font-bold text-primary mb-2 flex items-center">
                <Building2 className="w-5 h-5 mr-2 text-secondary" /> Need Help?
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Not sure if you qualify? Contact our advisors for a free consultation.
              </p>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/contact">Contact Support</Link>
              </Button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
