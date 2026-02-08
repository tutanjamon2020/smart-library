"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { EditLocation } from "./EditLocation";

type Book = {
  id: string;
  title: string;
  author: string | null;
  description: string | null;
  isbn: string | null;
  cover_url: string | null;
  tags: string[] | null;
  created_at: string;

  // ✅ nuevas columnas
  aisle: number | string | null;
  shelf: string | null; // "A-3"
  section: string | null;
  location_code: string | null;
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

function LocationLine({
  aisle,
  shelf,
  section,
  location_code,
}: {
  aisle: number | string | null;
  shelf: string | null;
  section: string | null;
  location_code: string | null;
}) {
  if (location_code) {
    return <div className="mt-2 text-sm text-gray-700">📍 {location_code}</div>;
  }

  const has = aisle && shelf;
  if (!has) {
    return (
      <div className="mt-2 text-sm text-gray-500">
        📍 <span className="italic">Ubicación no cargada</span>
      </div>
    );
  }

  return (
    <div className="mt-2 text-sm text-gray-700">
      📍 <span className="font-semibold">Estante {shelf} · Pasillo {aisle}</span>
      {section ? <span className="text-gray-600"> · {section}</span> : null}
    </div>
  );
}

export default function BookDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;

  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("books")
        .select(
          "id,title,author,description,isbn,cover_url,tags,created_at,aisle,shelf,section"
        )
        .eq("id", id)
        .single();

      if (error) {
        setError(error.message);
        setBook(null);
      } else {
        setBook(data as Book);
      }

      setLoading(false);
    };

    load();
  }, [id]);

  if (loading) return <div className="p-6 text-sm">Cargando…</div>;

  if (error) {
    return (
      <main className="p-6">
        <button
          onClick={() => router.back()}
          className="rounded-md border px-3 py-2 text-sm"
        >
          ← Volver
        </button>

        <div className="mt-4 rounded border border-red-300 bg-red-50 p-3 text-sm">
          <b>Error:</b> {error}
        </div>
      </main>
    );
  }

  if (!book) {
    return (
      <main className="p-6">
        <button
          onClick={() => router.back()}
          className="rounded-md border px-3 py-2 text-sm"
        >
          ← Volver
        </button>
        <div className="mt-4 text-sm">Libro no encontrado.</div>
      </main>
    );
  }

  return (
    <main className="p-6">
      <div className="mx-auto max-w-4xl">
        <button
          onClick={() => router.back()}
          className="rounded-md border px-3 py-2 text-sm"
        >
          ← Volver
        </button>

        <div className="mt-6 grid gap-6 md:grid-cols-[320px_1fr]">
          {/* Cover */}
          <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
            <div className="aspect-[2/3] w-full bg-gray-100">
              {book.cover_url ? (
                <img
                  src={book.cover_url}
                  alt={book.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-gradient-to-b from-gray-50 to-gray-200">
                  <div className="rounded-full border bg-white/70 px-3 py-1 text-xs font-semibold text-gray-700">
                    {getInitials(book.title)}
                  </div>
                  <div className="text-[11px] text-gray-500">Sin tapa</div>
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="rounded-lg border bg-white p-5 shadow-sm">
            <h1 className="text-2xl font-bold">{book.title}</h1>
            <p className="mt-1 text-sm text-gray-700">
              {book.author ?? "Autor desconocido"}
            </p>

            {/* ✅ Ubicación + editar */}
            <div className="mt-2 flex items-start justify-between gap-3">
              <LocationLine
                aisle={book.aisle}
                shelf={book.shelf}
                section={book.section}
                location_code={book.location_code}
              />

              <EditLocation
                bookId={book.id}
                initial={{
                  aisle: book.aisle,
                  shelf: book.shelf,
                  section: book.section,
                  location_code: book.location_code,
                }}
              />
            </div>

            <div className="mt-4 space-y-2 text-sm">
              {book.isbn && (
                <div>
                  <span className="font-semibold">ISBN:</span> {book.isbn}
                </div>
              )}

              {book.description && (
                <div>
                  <div className="font-semibold">Descripción</div>
                  <p className="mt-1 leading-6 text-gray-800">
                    {book.description}
                  </p>
                </div>
              )}

              {book.tags && book.tags.length > 0 && (
                <div>
                  <div className="font-semibold">Tags</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {book.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-full border bg-gray-50 px-3 py-1 text-xs"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 text-xs text-gray-500">
              Agregado: {new Date(book.created_at).toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
