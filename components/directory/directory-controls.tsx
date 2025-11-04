"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface DirectoryControlsProps {
  totalResults: number;
  pageSize: number;
}

const DEBOUNCE_MS = 400;

export function DirectoryControls({ totalResults, pageSize }: DirectoryControlsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(searchParams.get("query") ?? "");
  const [company, setCompany] = useState(searchParams.get("company") ?? "");
  const [title, setTitle] = useState(searchParams.get("title") ?? "");

  const mountedRef = useRef(false);

  useEffect(() => {
    // avoid triggering update on first mount until values are set
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }

    const handler = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());

      if (query) {
        params.set("query", query);
      } else {
        params.delete("query");
      }

      if (company) {
        params.set("company", company);
      } else {
        params.delete("company");
      }

      if (title) {
        params.set("title", title);
      } else {
        params.delete("title");
      }

      params.delete("page");

      const search = params.toString();
      router.replace(search ? `${pathname}?${search}` : pathname, { scroll: false });
    }, DEBOUNCE_MS);

    return () => clearTimeout(handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, company, title]);

  const currentRange = useMemo(() => {
    const page = Number(searchParams.get("page") ?? "1");
    const safePage = Number.isFinite(page) && page > 0 ? page : 1;
    const start = (safePage - 1) * pageSize + 1;
    const end = Math.min(safePage * pageSize, totalResults);
    return { start, end, page: safePage };
  }, [pageSize, searchParams, totalResults]);

  return (
    <section className="space-y-4 rounded-xl border border-border/60 bg-card p-4 sm:p-5 shadow-sm">
      <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 md:grid-cols-3">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Buscar por nombre
          </label>
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Ingresa un nombre o palabra clave"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Empresa
          </label>
          <Input
            value={company}
            onChange={(event) => setCompany(event.target.value)}
            placeholder="Filtra por empresa"
          />
        </div>
        {/* <div className="flex flex-col gap-2">
          <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Cargo / Especialidad
          </label>
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Ej. UX, Data, Android"
          />
        </div> */}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground">
        <div>
          {totalResults > 0 ? (
            <span>
              Mostrando {currentRange.start} - {currentRange.end} de {totalResults}
            </span>
          ) : (
            <span>No se encontraron resultados.</span>
          )}
        </div>
        {(query || company || title) && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setQuery("");
              setCompany("");
              setTitle("");
            }}
          >
            Limpiar filtros
          </Button>
        )}
      </div>
    </section>
  );
}
