import type { QueryKey, UseMutationOptions, UseMutationResult, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import type { Application, ApplicationInput, ContactInput, ContactInquiry, HealthStatus, Job, JobInput, ListJobsParams, SiteStats } from './api.schemas';
import { customFetch } from '../custom-fetch';
import type { ErrorType, BodyType } from '../custom-fetch';
type AwaitedInput<T> = PromiseLike<T> | T;
type Awaited<O> = O extends AwaitedInput<infer T> ? T : never;
type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];
export declare const getHealthCheckUrl: () => string;
/**
 * Returns server health status
 * @summary Health check
 */
export declare const healthCheck: (options?: RequestInit) => Promise<HealthStatus>;
export declare const getHealthCheckQueryKey: () => readonly ["/api/healthz"];
export declare const getHealthCheckQueryOptions: <TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData> & {
    queryKey: QueryKey;
};
export type HealthCheckQueryResult = NonNullable<Awaited<ReturnType<typeof healthCheck>>>;
export type HealthCheckQueryError = ErrorType<unknown>;
/**
 * @summary Health check
 */
export declare function useHealthCheck<TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getListJobsUrl: (params?: ListJobsParams) => string;
/**
 * @summary List all job openings
 */
export declare const listJobs: (params?: ListJobsParams, options?: RequestInit) => Promise<Job[]>;
export declare const getListJobsQueryKey: (params?: ListJobsParams) => readonly ["/api/jobs", ...ListJobsParams[]];
export declare const getListJobsQueryOptions: <TData = Awaited<ReturnType<typeof listJobs>>, TError = ErrorType<unknown>>(params?: ListJobsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listJobs>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listJobs>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListJobsQueryResult = NonNullable<Awaited<ReturnType<typeof listJobs>>>;
export type ListJobsQueryError = ErrorType<unknown>;
/**
 * @summary List all job openings
 */
export declare function useListJobs<TData = Awaited<ReturnType<typeof listJobs>>, TError = ErrorType<unknown>>(params?: ListJobsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listJobs>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getCreateJobUrl: () => string;
/**
 * @summary Create a new job listing
 */
export declare const createJob: (jobInput: JobInput, options?: RequestInit) => Promise<Job>;
export declare const getCreateJobMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createJob>>, TError, {
        data: BodyType<JobInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createJob>>, TError, {
    data: BodyType<JobInput>;
}, TContext>;
export type CreateJobMutationResult = NonNullable<Awaited<ReturnType<typeof createJob>>>;
export type CreateJobMutationBody = BodyType<JobInput>;
export type CreateJobMutationError = ErrorType<unknown>;
/**
* @summary Create a new job listing
*/
export declare const useCreateJob: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createJob>>, TError, {
        data: BodyType<JobInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createJob>>, TError, {
    data: BodyType<JobInput>;
}, TContext>;
export declare const getGetJobUrl: (id: number) => string;
/**
 * @summary Get a specific job
 */
export declare const getJob: (id: number, options?: RequestInit) => Promise<Job>;
export declare const getGetJobQueryKey: (id: number) => readonly [`/api/jobs/${number}`];
export declare const getGetJobQueryOptions: <TData = Awaited<ReturnType<typeof getJob>>, TError = ErrorType<void>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getJob>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getJob>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetJobQueryResult = NonNullable<Awaited<ReturnType<typeof getJob>>>;
export type GetJobQueryError = ErrorType<void>;
/**
 * @summary Get a specific job
 */
export declare function useGetJob<TData = Awaited<ReturnType<typeof getJob>>, TError = ErrorType<void>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getJob>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getListApplicationsUrl: () => string;
/**
 * @summary List all applications
 */
export declare const listApplications: (options?: RequestInit) => Promise<Application[]>;
export declare const getListApplicationsQueryKey: () => readonly ["/api/applications"];
export declare const getListApplicationsQueryOptions: <TData = Awaited<ReturnType<typeof listApplications>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listApplications>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listApplications>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListApplicationsQueryResult = NonNullable<Awaited<ReturnType<typeof listApplications>>>;
export type ListApplicationsQueryError = ErrorType<unknown>;
/**
 * @summary List all applications
 */
export declare function useListApplications<TData = Awaited<ReturnType<typeof listApplications>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listApplications>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getSubmitApplicationUrl: () => string;
/**
 * @summary Submit a job application
 */
export declare const submitApplication: (applicationInput: ApplicationInput, options?: RequestInit) => Promise<Application>;
export declare const getSubmitApplicationMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof submitApplication>>, TError, {
        data: BodyType<ApplicationInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof submitApplication>>, TError, {
    data: BodyType<ApplicationInput>;
}, TContext>;
export type SubmitApplicationMutationResult = NonNullable<Awaited<ReturnType<typeof submitApplication>>>;
export type SubmitApplicationMutationBody = BodyType<ApplicationInput>;
export type SubmitApplicationMutationError = ErrorType<unknown>;
/**
* @summary Submit a job application
*/
export declare const useSubmitApplication: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof submitApplication>>, TError, {
        data: BodyType<ApplicationInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof submitApplication>>, TError, {
    data: BodyType<ApplicationInput>;
}, TContext>;
export declare const getGetSiteStatsUrl: () => string;
/**
 * @summary Get site-wide statistics
 */
export declare const getSiteStats: (options?: RequestInit) => Promise<SiteStats>;
export declare const getGetSiteStatsQueryKey: () => readonly ["/api/stats"];
export declare const getGetSiteStatsQueryOptions: <TData = Awaited<ReturnType<typeof getSiteStats>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getSiteStats>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getSiteStats>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetSiteStatsQueryResult = NonNullable<Awaited<ReturnType<typeof getSiteStats>>>;
export type GetSiteStatsQueryError = ErrorType<unknown>;
/**
 * @summary Get site-wide statistics
 */
export declare function useGetSiteStats<TData = Awaited<ReturnType<typeof getSiteStats>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getSiteStats>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getSubmitContactUrl: () => string;
/**
 * @summary Submit a contact inquiry
 */
export declare const submitContact: (contactInput: ContactInput, options?: RequestInit) => Promise<ContactInquiry>;
export declare const getSubmitContactMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof submitContact>>, TError, {
        data: BodyType<ContactInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof submitContact>>, TError, {
    data: BodyType<ContactInput>;
}, TContext>;
export type SubmitContactMutationResult = NonNullable<Awaited<ReturnType<typeof submitContact>>>;
export type SubmitContactMutationBody = BodyType<ContactInput>;
export type SubmitContactMutationError = ErrorType<unknown>;
/**
* @summary Submit a contact inquiry
*/
export declare const useSubmitContact: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof submitContact>>, TError, {
        data: BodyType<ContactInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof submitContact>>, TError, {
    data: BodyType<ContactInput>;
}, TContext>;
export {};
//# sourceMappingURL=api.d.ts.map