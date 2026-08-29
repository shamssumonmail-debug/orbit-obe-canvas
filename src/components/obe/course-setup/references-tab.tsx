import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useCourseReferences, type CourseReference } from "@/lib/course-setup";

type DraftRef = { key: string; citation: string };

export function ReferencesTab({
  offeringId,
  readOnly,
}: {
  offeringId: string;
  readOnly: boolean;
}) {
  const queryClient = useQueryClient();
  const refs = useCourseReferences(offeringId);
  const [required, setRequired] = useState<DraftRef[]>([]);
  const [recommended, setRecommended] = useState<DraftRef[]>([]);

  const loadedKey = (refs.data ?? []).map((r) => r.id).join(",");
  useEffect(() => {
    const toDraft = (list: CourseReference[]) => list.map((r) => ({ key: r.id, citation: r.citation }));
    setRequired(toDraft((refs.data ?? []).filter((r) => r.kind === "required")));
    setRecommended(toDraft((refs.data ?? []).filter((r) => r.kind === "recommended")));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadedKey]);

  const save = useMutation({
    mutationFn: async () => {
      const rows = [
        ...required.map((r, i) => ({ kind: "required" as const, citation: r.citation.trim(), display_order: i })),
        ...recommended.map((r, i) => ({
          kind: "recommended" as const,
          citation: r.citation.trim(),
          display_order: i,
        })),
      ].filter((r) => r.citation.length > 0);

      const { error: delError } = await supabase
        .from("course_references")
        .delete()
        .eq("course_offering_id", offeringId);
      if (delError) throw delError;

      if (rows.length) {
        const { error } = await supabase
          .from("course_references")
          .insert(rows.map((r) => ({ ...r, course_offering_id: offeringId })));
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("References saved");
      void queryClient.invalidateQueries({ queryKey: ["course-setup", "references", offeringId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (refs.isLoading) return <Skeleton className="h-48 w-full" />;

  if (refs.error) {
    return (
      <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-6 text-sm text-destructive">
        Could not load references: {(refs.error as Error).message}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <RefList
        heading="16.1 Required references"
        description="Textbooks and materials students must have."
        rows={required}
        setRows={setRequired}
        readOnly={readOnly}
      />
      <RefList
        heading="16.2 Recommended references"
        description="Supplementary reading."
        rows={recommended}
        setRows={setRecommended}
        readOnly={readOnly}
      />
      {!readOnly && (
        <div className="flex justify-end">
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            <Save className="mr-2 size-4" /> {save.isPending ? "Saving…" : "Save references"}
          </Button>
        </div>
      )}
    </div>
  );
}

function RefList({
  heading,
  description,
  rows,
  setRows,
  readOnly,
}: {
  heading: string;
  description: string;
  rows: DraftRef[];
  setRows: React.Dispatch<React.SetStateAction<DraftRef[]>>;
  readOnly: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{heading}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.length === 0 && <p className="text-sm text-muted-foreground">Nothing listed yet.</p>}
        {rows.map((r, i) => (
          <div key={r.key} className="flex items-start gap-2">
            <span className="mt-2.5 w-6 text-sm text-muted-foreground">{i + 1}.</span>
            <Textarea
              rows={2}
              value={r.citation}
              placeholder="Author, Title, Edition, Publisher, Year"
              disabled={readOnly}
              onChange={(e) =>
                setRows((prev) => prev.map((x, xi) => (xi === i ? { ...x, citation: e.target.value } : x)))
              }
            />
            {!readOnly && (
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Remove reference ${i + 1}`}
                onClick={() => setRows((prev) => prev.filter((_, xi) => xi !== i))}
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            )}
          </div>
        ))}
        {!readOnly && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRows((prev) => [...prev, { key: `new-${Date.now()}-${prev.length}`, citation: "" }])}
          >
            <Plus className="mr-2 size-4" /> Add reference
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
