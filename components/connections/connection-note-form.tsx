"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Pencil, Plus } from "lucide-react";

import { saveConnectionNote, deleteConnectionNote } from "@/app/(protected)/conexiones/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface ConnectionNoteFormProps {
  peerId: string;
  initialNote?: string | null;
  initialTags?: string[] | null;
}

export function ConnectionNoteForm({ peerId, initialNote, initialTags }: ConnectionNoteFormProps) {
  const router = useRouter();
  const [note, setNote] = useState(initialNote ?? "");
  const [tags, setTags] = useState(initialTags?.join(", ") ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const hasInitialContent = Boolean(initialNote || initialTags?.length);
  const [isEditing, setIsEditing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(hasInitialContent);

  const handleSubmit = () => {
    setMessage(null);
    const formData = new FormData();
    formData.append("peerId", peerId);
    formData.append("note", note);
    formData.append("tags", tags);

    startTransition(async () => {
      const result = await saveConnectionNote(formData);
      if (result.error) {
        setMessage(result.error);
        return;
      }
      setMessage("Nota guardada");
      setIsEditing(false);
      router.refresh();
    });
  };

  const handleDelete = () => {
    setMessage(null);
    startTransition(async () => {
      const result = await deleteConnectionNote(peerId);
      if (result.error) {
        setMessage(result.error);
        return;
      }
      setNote("");
      setTags("");
      setMessage("Nota eliminada");
      router.refresh();
    });
  };

  const hasContent = note.trim() || tags.trim();

  if (!isExpanded) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => {
          setIsExpanded(true);
          setIsEditing(true);
        }}
        className="w-full"
      >
        <Plus className="mr-2 h-4 w-4" />
        Agregar notas o etiquetas
      </Button>
    );
  }

  return (
    <div className="space-y-3 rounded-lg border border-border/60 bg-muted/30 p-4">
      {!isEditing && hasContent ? (
        // Read-only view
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 space-y-2">
              {note && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Notas personales
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{note}</p>
                </div>
              )}
              {tags && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Etiquetas
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {tags.split(",").map((tag, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                      >
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="shrink-0"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        // Edit mode
        <>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Notas personales
            </label>
            <Textarea
              rows={3}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Recuerda de qué hablaron, acuerdos, próximos pasos..."
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Etiquetas (separadas por coma)
            </label>
            <Input
              value={tags}
              onChange={(event) => setTags(event.target.value)}
              placeholder="Ej. Flutter, Startups, Patrocinio"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" onClick={handleSubmit} disabled={isPending}>
              {isPending ? "Guardando..." : "Guardar"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setNote(initialNote ?? "");
                setTags(initialTags?.join(", ") ?? "");
                setIsEditing(false);
                setMessage(null);
                if (!hasInitialContent) {
                  setIsExpanded(false);
                }
              }}
              disabled={isPending}
            >
              Cancelar
            </Button>
            {hasContent && (
              <Button type="button" variant="ghost" onClick={handleDelete} disabled={isPending}>
                Borrar nota
              </Button>
            )}
            {message && <p className="text-xs text-muted-foreground">{message}</p>}
          </div>
        </>
      )}
    </div>
  );
}
