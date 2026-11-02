import { Checkbox } from "@/components/ui/checkbox";
import { PERMISSIONS, presetFor, ROLE_PRESETS, type Permission } from "@/lib/blog/permissions";

export function PermissionPicker({
  value,
  onChange,
  lockedOn = [],
}: {
  value: Permission[];
  onChange: (perms: Permission[]) => void;
  /** Permissions that can't be switched off (e.g. your own team management). */
  lockedOn?: Permission[];
}) {
  const current = presetFor(value);

  function toggle(id: Permission, on: boolean) {
    const next = on ? [...value, id] : value.filter((p) => p !== id);
    // Publishing or editing others' posts implies being able to write.
    if (
      on &&
      (id === "posts.publish" || id === "posts.edit_all") &&
      !next.includes("posts.create")
    ) {
      next.push("posts.create");
    }
    onChange([...new Set([...next, ...lockedOn])]);
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        {ROLE_PRESETS.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => onChange([...new Set([...r.permissions, ...lockedOn])])}
            className={`rounded-lg border px-3 py-2 text-left transition ${
              current === r.label
                ? "border-[#ff3b14] bg-[#ff3b14]/10"
                : "border-blog-fg/10 hover:border-blog-fg/30"
            }`}
          >
            <span className="block text-sm font-semibold">{r.label}</span>
            <span className="mt-0.5 block text-[11px] leading-snug text-blog-fg/50">
              {r.description}
            </span>
          </button>
        ))}
      </div>
      <div className="space-y-2.5 rounded-lg border border-blog-fg/10 p-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-blog-fg/45">
          Permissions{" "}
          {current === "Custom" && (
            <span className="normal-case text-amber-300 light:text-amber-700">(custom)</span>
          )}
        </p>
        {PERMISSIONS.map((p) => {
          const locked = lockedOn.includes(p.id);
          return (
            <label key={p.id} className="flex cursor-pointer items-start gap-3">
              <Checkbox
                checked={value.includes(p.id)}
                disabled={locked}
                onCheckedChange={(v) => toggle(p.id, v === true)}
                className="mt-0.5"
              />
              <span>
                <span className="block text-sm">{p.label}</span>
                <span className="block text-xs text-blog-fg/45">
                  {p.description}
                  {locked && " (you can't remove this from yourself)"}
                </span>
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
