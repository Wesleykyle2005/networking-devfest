import { notFound, redirect } from "next/navigation";

import { DirectoryControls } from "@/components/directory/directory-controls";
import { DirectoryCard } from "@/components/directory/directory-card";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { getEventConfig } from "@/lib/env-config";

const PAGE_SIZE = 24;

interface DirectoryPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

function getVisiblePages(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 6) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  if (current <= 3) {
    return [1, 2, 3, 4, "ellipsis", total];
  }

  if (current >= total - 2) {
    return [1, "ellipsis", total - 3, total - 2, total - 1, total];
  }

  return [1, "ellipsis", current - 1, current, current + 1, "ellipsis", total];
}

export const dynamic = "force-dynamic";

export default async function DirectoryPage({ searchParams }: DirectoryPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const event = getEventConfig();
  if (!event.id) {
    notFound();
  }

  const resolvedSearchParams = await searchParams;
  const query = typeof resolvedSearchParams?.query === "string" ? resolvedSearchParams.query.trim() : "";
  const companyFilter = typeof resolvedSearchParams?.company === "string" ? resolvedSearchParams.company.trim() : "";
  const titleFilter = typeof resolvedSearchParams?.title === "string" ? resolvedSearchParams.title.trim() : "";
  const pageParam = typeof resolvedSearchParams?.page === "string" ? Number.parseInt(resolvedSearchParams.page, 10) : 1;
  const currentPage = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
  const offset = (currentPage - 1) * PAGE_SIZE;

  let builder = supabase
    .from("profiles")
    .select(
      "id, slug_uuid, name, headline, company, job_title, location, avatar_url",
      { count: "exact" },
    )
    .eq("event_id", event.id);

  if (query) {
    const sanitized = query.replace(/[%_]/g, (match) => `\\${match}`);
    builder = builder.or(
      `name.ilike.%${sanitized}%,company.ilike.%${sanitized}%,job_title.ilike.%${sanitized}%`,
    );
  }

  if (companyFilter) {
    const sanitized = companyFilter.replace(/[%_]/g, (match) => `\\${match}`);
    builder = builder.ilike("company", `%${sanitized}%`);
  }

  if (titleFilter) {
    const sanitized = titleFilter.replace(/[%_]/g, (match) => `\\${match}`);
    builder = builder.ilike("job_title", `%${sanitized}%`);
  }

  const { data: rows, count, error } = await builder
    .order("name", { ascending: true })
    .range(offset, offset + PAGE_SIZE - 1);

  if (error) {
    console.error("[directorio]", error);
    return (
      <div className="space-y-6">
        <header className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Directorio de asistentes</h1>
          <p className="text-muted-foreground">
            Hubo un problema al cargar el directorio. Intenta nuevamente en unos segundos.
          </p>
        </header>
      </div>
    );
  }

  const totalResults = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalResults / PAGE_SIZE));
  const visiblePages = getVisiblePages(Math.min(currentPage, totalPages), totalPages);

  const profiles = (rows ?? []).map((profile) => ({
    id: profile.id,
    slug: profile.slug_uuid,
    name: profile.name,
    headline: profile.headline,
    company: profile.company,
    jobTitle: profile.job_title,
    location: profile.location,
    avatarUrl: profile.avatar_url,
  }));

  const buildPageHref = (page: number) => {
    const params = new URLSearchParams();
    if (query) params.set("query", query);
    if (companyFilter) params.set("company", companyFilter);
    if (titleFilter) params.set("title", titleFilter);
    if (page > 1) params.set("page", page.toString());
    const search = params.toString();
    return search ? `?${search}` : "";
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <header className="space-y-3">
        <p className="text-xs sm:text-sm uppercase tracking-wider text-muted-foreground">Explora asistentes</p>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Directorio DevFest Managua 2025</h1>
        <p className="max-w-2xl text-sm sm:text-base text-muted-foreground">
          Conecta con desarrolladores, Google Developer Experts y entusiastas de la tecnología. Encuentra personas por nombre, empresa o especialidad y amplía tu red profesional.
        </p>
      </header>

      <DirectoryControls totalResults={totalResults} pageSize={PAGE_SIZE} />

      {profiles.length === 0 ? (
        <Card className="border border-dashed border-primary/20">
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            No encontramos perfiles que coincidan con tu búsqueda. Ajusta los filtros y vuelve a intentarlo.
          </CardContent>
        </Card>
      ) : (
        <section className="grid gap-3 sm:gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {profiles.map((profile) => (
            <DirectoryCard key={profile.id} profile={profile} />
          ))}
        </section>
      )}

      {totalPages > 1 && (
        <Pagination className="pt-2">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href={buildPageHref(Math.max(1, currentPage - 1))}
                aria-disabled={currentPage === 1}
                tabIndex={currentPage === 1 ? -1 : undefined}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : undefined}
              />
            </PaginationItem>
            {visiblePages.map((page, index) => (
              <PaginationItem key={`${page}-${index}`}>
                {page === "ellipsis" ? (
                  <PaginationEllipsis />
                ) : (
                  <PaginationLink
                    href={buildPageHref(page)}
                    isActive={page === currentPage}
                  >
                    {page}
                  </PaginationLink>
                )}
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                href={buildPageHref(Math.min(totalPages, currentPage + 1))}
                aria-disabled={currentPage >= totalPages}
                tabIndex={currentPage >= totalPages ? -1 : undefined}
                className={currentPage >= totalPages ? "pointer-events-none opacity-50" : undefined}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
