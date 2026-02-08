"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type Book = {
  id: string;
  title: string;
  author: string | null;
  description: string | null;
  cover_url: string | null;

  // ✅ nuevas columnas para ubicación
  aisle: number | string | null;
  shelf: string | null; // "A-3"
  section?: string | null;
  location_code?: string | null;
};

function getInitials(title: string) {
  const cleaned = (title ?? "").trim();
  if (!cleaned) return "—";

  const words = cleaned.split(/\s+/).filter(Boolean);
  const first = words[0]?.[0] ?? "";
  const second = words[1]?.[0] ?? (words[0]?.[1] ?? "");
  const initials = (first + second).toUpperCase();

  return initials || cleaned.slice(0, 2).toUpperCase();
}

export default function HomePage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  const q = useMemo(() => query.trim().replace(/\s+/g, " "), [query]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      let req = supabase
        .from("books")
        .select("id,title,author,description,cover_url,aisle,shelf,section")
        .limit(60);

      if (q.length > 0) {
        const escaped = q.replace(/%/g, "\\%").replace(/_/g, "\\_");
        req = req.or(`title.ilike.%${escaped}%,author.ilike.%${escaped}%`);
      }

      const { data, error } = await req;

      if (cancelled) return;

      if (error) {
        setError(error.message);
        setBooks([]);
      } else {
        setBooks((data ?? []) as Book[]);
      }

      setLoading(false);
    };

    const t = setTimeout(load, 250);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [q]);

  return (
    <main className="p-6">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Catálogo</h1>
            <p className="text-sm text-gray-600">
              {loading ? "Cargando…" : `${books.length} resultados`}
              {q ? ` para “${q}”` : ""}
            </p>
          </div>

          {/* Search */}
          <div className="flex w-full gap-2 md:w-[420px]">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por título o autor…"
              className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring"
            />
            <button
              type="button"
              onClick={() => setQuery("")}
              className="rounded-md border px-3 py-2 text-sm"
              disabled={!query}
            >
              Limpiar
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded border border-red-300 bg-red-50 p-3 text-sm">
            <b>Error:</b> {error}
          </div>
        )}

        {!loading && !error && books.length === 0 && (
          <div className="rounded border p-4 text-sm text-gray-700">
            No hay resultados. Probá con otra búsqueda.
          </div>
        )}

        {/* Grid */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {books.map((book) => {
            const hasLocation = !!book.aisle && !!book.shelf;
            const locationText =
              book.location_code ||
              (hasLocation ? `P${book.aisle} · ${book.shelf}` : null);

            return (
              <Link key={book.id} href={`/book/${book.id}`} className="block">
                <div className="flex h-full flex-col rounded-lg border bg-white p-3 shadow-sm transition hover:shadow-md">
                  {/* Cover */}
                  <div className="mb-3 aspect-[2/3] w-full overflow-hidden rounded bg-gray-100">
                    {book.cover_url ? (
                      <img
                        src={book.cover_url}
                        alt={book.title}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-gradient-to-b from-gray-50 to-gray-200">
                        <svg
                          width="48"
                          height="48"
                          viewBox="0 0 24 24"
                          fill="none"
                          className="opacity-60"
                          aria-hidden="true"
                        >
                          <path
                            d="M6 4.5h10A2.5 2.5 0 0 1 18.5 7v13.5H7.5A1.5 1.5 0 0 0 6 22V4.5Z"
                            stroke="currentColor"
                            strokeWidth="1.5"
                          />
                          <path
                            d="M6 20.5h12.5"
                            stroke="currentColor"
                            strokeWidth="1.5"
                          />
                          <path
                            d="M8.5 7.5h7"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            opacity="0.7"
                          />
                        </svg>

                        <div className="rounded-full border bg-white/70 px-3 py-1 text-xs font-semibold text-gray-700">
                          {getInitials(book.title)}
                        </div>

                        <div className="text-[11px] text-gray-500">Sin tapa</div>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex flex-col gap-1">
                    <h2 className="line-clamp-2 text-sm font-semibold">
                      {book.title}
                    </h2>

                    <p className="text-xs text-gray-600">
                      {book.author ?? "Autor desconocido"}
                    </p>

                    {/* ✅ Ubicación en catálogo */}
                    {locationText && (
                      <p className="mt-1 text-xs text-gray-500">
                        📍 {locationText}
                      </p>
                    )}

                    {book.description && (
                      <p className="mt-1 line-clamp-3 text-xs text-gray-700">
                        {book.description}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}
