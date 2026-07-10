import { useState } from "react";
import { Link } from "wouter";
import { Building2, Search, MapPin, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useListJobs, getListJobsQueryKey } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Jobs() {
  const [category, setCategory] = useState<string>("all");
  const [location, setLocation] = useState<string>("all");
  const [search, setSearch] = useState("");

  const { data: jobs, isLoading } = useListJobs(
    { 
      ...(category !== "all" && { category }),
      ...(location !== "all" && { location }) 
    },
    { query: { queryKey: getListJobsQueryKey({ category: category !== "all" ? category : undefined, location: location !== "all" ? location : undefined }) } }
  );

  // Filter by search term client-side since API doesn't support text search
  const filteredJobs = jobs?.filter(job => 
    job.title.toLowerCase().includes(search.toLowerCase()) || 
    job.description.toLowerCase().includes(search.toLowerCase())
  ) || [];

  // Static industry list — always visible regardless of live job count
  const allCategories = [
    "Construction",
    "Healthcare",
    "Hospitality & Tourism",
    "Information Technology",
    "Manufacturing",
    "Agriculture",
    "Transportation & Logistics",
    "Retail & Sales",
    "Education",
    "Finance & Banking",
    "Engineering",
    "Cleaning & Maintenance",
  ];

  // Locations: merge static EU countries with any locations from live jobs
  const staticLocations = [
    "Germany",
    "France",
    "Italy",
    "Netherlands",
    "Belgium",
    "Austria",
    "Sweden",
    "Denmark",
    "Poland",
    "Czech Republic",
    "Romania",
    "Portugal",
  ];
  const allLocations = Array.from(new Set([...staticLocations, ...(jobs?.map(j => j.location) || [])]));

  return (
    <div className="min-h-screen bg-muted/20 pb-24">
      {/* Header */}
      <div className="bg-primary text-white py-16">
        <div className="container mx-auto px-4 md:px-8">
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">Open Opportunities</h1>
          <p className="text-primary-foreground/80 text-lg max-w-2xl">
            Browse verified job listings from our trusted partners across Europe. We provide full visa and relocation support for all positions.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-8 -mt-8 relative z-10">
        {/* Filters */}
        <div className="bg-card rounded-xl shadow-md border p-6 mb-10 flex flex-col md:flex-row gap-4 items-end">
          <div className="w-full md:w-1/3 space-y-2">
            <label className="text-sm font-medium text-muted-foreground flex items-center">
              <Search className="w-4 h-4 mr-2" /> Search Roles
            </label>
            <Input 
              placeholder="e.g. Software Engineer, Construction..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-muted/50"
            />
          </div>
          
          <div className="w-full md:w-1/4 space-y-2">
            <label className="text-sm font-medium text-muted-foreground flex items-center">
              <Briefcase className="w-4 h-4 mr-2" /> Industry
            </label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="bg-muted/50">
                <SelectValue placeholder="All Industries" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Industries</SelectItem>
                {allCategories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full md:w-1/4 space-y-2">
            <label className="text-sm font-medium text-muted-foreground flex items-center">
              <MapPin className="w-4 h-4 mr-2" /> Location
            </label>
            <Select value={location} onValueChange={setLocation}>
              <SelectTrigger className="bg-muted/50">
                <SelectValue placeholder="All Locations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {allLocations.map(loc => (
                  <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full md:w-auto mt-4 md:mt-0">
            <Button 
              variant="outline" 
              className="w-full md:w-auto"
              onClick={() => { setCategory("all"); setLocation("all"); setSearch(""); }}
            >
              Clear Filters
            </Button>
          </div>
        </div>

        {/* Job Listings */}
        <div className="space-y-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-primary">
              {isLoading ? "Loading jobs..." : `${filteredJobs.length} Job${filteredJobs.length !== 1 ? 's' : ''} Found`}
            </h2>
          </div>

          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-card border rounded-xl p-6 flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-4">
                  <Skeleton className="h-6 w-1/3" />
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-20 w-full" />
                </div>
                <div className="md:w-48 flex flex-col justify-between">
                  <Skeleton className="h-8 w-24 ml-auto" />
                  <Skeleton className="h-10 w-full mt-4" />
                </div>
              </div>
            ))
          ) : filteredJobs.length > 0 ? (
            filteredJobs.map(job => (
              <div key={job.id} className="bg-card hover:shadow-md transition-shadow border rounded-xl p-6 flex flex-col md:flex-row gap-6 group">
                <div className="flex-1">
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="bg-primary/5 text-primary text-xs font-semibold px-3 py-1 rounded-full">
                      {job.category}
                    </span>
                    <span className="bg-muted text-muted-foreground text-xs font-medium px-3 py-1 rounded-full">
                      {job.type}
                    </span>
                  </div>
                  
                  <h3 className="text-2xl font-bold text-primary mb-2 group-hover:text-secondary transition-colors">
                    <Link href={`/jobs/${job.id}`}>{job.title}</Link>
                  </h3>
                  
                  <div className="flex flex-wrap items-center text-muted-foreground mb-4 text-sm gap-4">
                    <div className="flex items-center">
                      <Building2 className="w-4 h-4 mr-1" />
                      {job.location}
                    </div>
                    <div className="hidden md:block w-1 h-1 rounded-full bg-border"></div>
                    <div className="font-medium text-primary">
                      {job.salary}
                    </div>
                  </div>
                  
                  <p className="text-muted-foreground text-sm line-clamp-2 md:line-clamp-3">
                    {job.description}
                  </p>
                </div>
                
                <div className="md:w-48 flex flex-col justify-end gap-3 mt-4 md:mt-0 border-t md:border-t-0 pt-4 md:pt-0">
                  <Button variant="outline" className="w-full" asChild>
                    <Link href={`/jobs/${job.id}`}>View Details</Link>
                  </Button>
                  <Button className="w-full bg-secondary hover:bg-secondary/90 text-primary font-semibold" asChild>
                    <Link href={`/apply/${job.id}`}>Apply Now</Link>
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-20 bg-card rounded-xl border border-dashed">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold text-primary mb-2">No jobs match your criteria</h3>
              <p className="text-muted-foreground mb-6">Try adjusting your filters or search term to find more opportunities.</p>
              <Button 
                variant="outline" 
                onClick={() => { setCategory("all"); setLocation("all"); setSearch(""); }}
              >
                Clear All Filters
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
