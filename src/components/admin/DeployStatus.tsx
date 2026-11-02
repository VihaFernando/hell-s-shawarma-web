import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { CheckCircle2, Loader2, RefreshCw, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { getDeployStatus, requestRebuild } from "@/lib/blog/admin-api";

const BUSY_STATES = new Set([
  "new",
  "enqueued",
  "building",
  "uploading",
  "uploaded",
  "preparing",
  "prepared",
  "processing",
  "processed",
]);

export const DEPLOY_STATUS_KEY = ["blog-deploy-status"];

export function DeployStatus({ canRebuild }: { canRebuild: boolean }) {
  const queryClient = useQueryClient();
  const [triggering, setTriggering] = useState(false);
  const { data, error } = useQuery({
    queryKey: DEPLOY_STATUS_KEY,
    queryFn: getDeployStatus,
    refetchInterval: (q) =>
      q.state.data?.deploy && BUSY_STATES.has(q.state.data.deploy.state) ? 10_000 : 60_000,
    retry: false,
  });

  async function rebuild() {
    setTriggering(true);
    try {
      await requestRebuild("manual rebuild");
      toast.success("Rebuild started. The site updates in about a minute.");
      setTimeout(() => queryClient.invalidateQueries({ queryKey: DEPLOY_STATUS_KEY }), 4000);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't start a rebuild");
    } finally {
      setTriggering(false);
    }
  }

  const deploy = data?.deploy;
  const busy = deploy && BUSY_STATES.has(deploy.state);

  let label: React.ReactNode = "Site status unavailable";
  if (error) label = "Site status unavailable";
  else if (busy)
    label = (
      <span className="inline-flex items-center gap-1.5 text-amber-300 light:text-amber-700">
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Updating site…
      </span>
    );
  else if (deploy?.state === "error")
    label = (
      <span
        className="inline-flex items-center gap-1.5 text-red-400 light:text-red-700"
        title={deploy.errorMessage ?? undefined}
      >
        <XCircle className="h-3.5 w-3.5" /> Last build failed
      </span>
    );
  else if (deploy?.state === "ready")
    label = (
      <span className="inline-flex items-center gap-1.5 text-emerald-400 light:text-emerald-700">
        <CheckCircle2 className="h-3.5 w-3.5" /> Live
        {deploy.publishedAt && (
          <span className="text-blog-fg/45">
            · {formatDistanceToNow(new Date(deploy.publishedAt), { addSuffix: true })}
          </span>
        )}
      </span>
    );
  else if (data?.lastTrigger)
    label = (
      <span className="text-blog-fg/60">
        Last rebuild {formatDistanceToNow(new Date(data.lastTrigger.at), { addSuffix: true })}
      </span>
    );

  return (
    <div className="flex items-center gap-3 text-xs">
      {label}
      {canRebuild && (
        <Button size="sm" variant="outline" onClick={rebuild} disabled={triggering || !!busy}>
          <RefreshCw className={`h-3.5 w-3.5 ${triggering ? "animate-spin" : ""}`} /> Rebuild site
        </Button>
      )}
    </div>
  );
}
