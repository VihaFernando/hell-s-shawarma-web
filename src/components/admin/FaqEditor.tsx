import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { FaqItem } from "@/lib/blog/types";

// FAQs render as an accordion under the article and as FAQPage structured data.
export function FaqEditor({
  faqs,
  onChange,
}: {
  faqs: FaqItem[];
  onChange: (faqs: FaqItem[]) => void;
}) {
  const set = (i: number, patch: Partial<FaqItem>) =>
    onChange(faqs.map((f, idx) => (idx === i ? { ...f, ...patch } : f)));

  return (
    <div className="space-y-3">
      {faqs.map((f, i) => (
        <div key={i} className="space-y-2 rounded-lg border border-blog-fg/10 p-3">
          <div className="flex gap-2">
            <Input
              value={f.question}
              onChange={(e) => set(i, { question: e.target.value })}
              placeholder="Question people ask"
            />
            <Button
              size="icon"
              variant="ghost"
              aria-label="Remove question"
              onClick={() => onChange(faqs.filter((_, idx) => idx !== i))}
            >
              <Trash2 className="h-4 w-4 text-red-400 light:text-red-700" />
            </Button>
          </div>
          <Textarea
            rows={3}
            value={f.answer}
            onChange={(e) => set(i, { answer: e.target.value })}
            placeholder="Short, direct answer (2-3 sentences)"
          />
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onChange([...faqs, { question: "", answer: "" }])}
      >
        <Plus className="h-3.5 w-3.5" /> Add question
      </Button>
    </div>
  );
}
