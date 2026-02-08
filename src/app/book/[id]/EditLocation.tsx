"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const SHELF_REGEX = /^[A-Z]-\d+$/;

export function EditLocation({
  bookId,
  initial,
}: {
  bookId: string;
  initial: {
    aisle: number | string | null;
    shelf: string | null;
    section: string | null;
    location_code: string | null;
  };
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const [aisle, setAisle] = useState(initial.aisle?.toString?.() ?? "");
  const [shelf, setShelf] = useState(initial.shelf ?? "");
  const [section, setSection] = useState(initial.section ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    setError(null);

    const shelfNorm = shelf.trim().toUpperCase();
    const aisleNorm = aisle.trim();

    if (!aisleNorm) return setError("Pasillo es requerido.");
    if (!shelfNorm) return setError("Estante es requerido.");
    if (!SHELF_REGEX.test(shelfNorm)) return setError('Formato inválido. Ej: "A-3".');

    setSaving(true);

    const { error } = await supabase
      .from("books")
      .update({
        aisle: aisleNorm, // si en DB es int: parseInt(aisleNorm, 10)
        shelf: shelfNorm,
        section: section.trim() ? section.trim() : null,
        // location_code: null, // opcional: si querés manejarlo manual/derivado
      })
      .eq("id", bookId);

    setSaving(false);

    if (error) return setError(error.message);

    setOpen(false);
    router.refresh(); // ✅ App Router
  }

  return (
    <>
      <button
        className="shrink-0 rounded-md border px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
        onClick={() => setOpen(true)}
      >
        Editar ubicación
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-4 shadow">
            <div className="text-lg font-semibold">Ubicación</div>
            <div className="mt-1 text-xs text-gray-500">
              Estante en formato <b>A-3</b>
            </div>

            <div className="mt-3 space-y-3">
              <label className="block">
                <div className="text-sm text-gray-700">Pasillo</div>
                <input
                  className="mt-1 w-full rounded-xl border px-3 py-2"
                  value={aisle}
                  onChange={(e) => setAisle(e.target.value)}
                />
              </label>

              <label className="block">
                <div className="text-sm text-gray-700">Estante</div>
                <input
                  className="mt-1 w-full rounded-xl border px-3 py-2"
                  placeholder="A-3"
                  value={shelf}
                  onChange={(e) => setShelf(e.target.value)}
                />
              </label>

              <label className="block">
                <div className="text-sm text-gray-700">Sección (opcional)</div>
                <input
                  className="mt-1 w-full rounded-xl border px-3 py-2"
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                />
              </label>

              {error && <div className="text-sm text-red-600">{error}</div>}
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                className="rounded-xl border px-3 py-2"
                onClick={() => setOpen(false)}
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                className="rounded-xl bg-black px-3 py-2 text-white"
                onClick={save}
                disabled={saving}
              >
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
