"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

type Book = {
  id: string;
  title: string;
  author: string | null;
  cover_url: string | null;
  description: string | null;
};

function getInitials(title: string) {
  const cleaned = (title || "").trim();
  if (!cleaned) return "??";
  const parts = cleaned.split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase()).join("");
}

export default function ZonePage() {
  const params = useParams();

  const aisle = useMemo(() => {
    const v = (params as any)?.aisle;
    return Array.isArray(v) ? v[0] : v;
  }, [params]);

  const shelf = useMemo(() => {
    const v = (params as any)?.shelf;
    return Array.isArray(v) ? v[0] : v;
  }, [params]);

  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      setErrorMsg(null);

      if (!aisle || !shelf) {
        setLoading(false);
        return;
      }

      setLoading(true);

      const { data, error } = await supabase
        .from("books")
        .select("id, title, author, cover_url, description")
        .eq("aisle", aisle)
        .eq("shelf", shelf)
        .eq("is_active", true);

      if (error) {
        setErrorMsg("No se pudieron cargar los libros.");
        setBooks([]);
        setLoading(false);
        return;
      }

      setBooks((data ?? []) as Book[]);
      setLoading(false);
    };

    run();
  }, [aisle, shelf]);

  if (!aisle || !shelf) {
    return (
      <main className="p-6">
        <h1 className="text-2xl font-bold mb-2">Zona inválida</h1>
        <p className="text-gray-500">Falta aisle o shelf en la URL.</p>
        <p className="text-gray-500 mt-2">
          Ejemplo: <code>/z/living/a-3</code>
        </p>
      </main>
    );
  }

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-2">
        Estante {String(shelf).toUpperCase()}
      </h1>
      <p className="text-gray-500 mb-6">Pasillo: {String(aisle)}</p>

      {loading ? (
        <p>Cargando...</p>
      ) : errorMsg ? (
        <p className="text-red-600">{errorMsg}</p>
      ) : books.length === 0 ? (
        <p>No hay libros en este estante.</p>
      ) : (
        <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {books.map((book) => (
            <li key={book.id}>
              <Link href={`/book/${book.id}`} className="block">
                <div className="flex h-full flex-col rounded-lg border bg-white p-3 shadow-sm transition hover:shadow-md">
                  {/* Cover (igual que catálogo) */}
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

                  {/* Info (mismo estilo catálogo) */}
                  <div className="flex flex-col gap-1">
                    <h2 className="line-clamp-2 text-sm font-semibold">
                      {book.title}
                    </h2>

                    <p className="text-xs text-gray-600">
                      {book.author ?? "Autor desconocido"}
                    </p>

                    {/* (Opcional) Si querés mostrar descripción como en catálogo */}
                    {book.description && (
                      <p className="mt-1 line-clamp-3 text-xs text-gray-700">
                        {book.description}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
