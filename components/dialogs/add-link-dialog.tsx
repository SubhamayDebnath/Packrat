"use client";

import { useEffect, useState } from "react";
import { Globe, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GroupDot } from "@/components/bookmarks/group-dot";
import { api, ApiClientError } from "@/lib/api-client";
import { looksLikeUrl } from "@/lib/format";
import { useApp, useAppApi } from "@/stores/app-store";
import { useUi } from "@/stores/ui";

type Preview = {
  url: string;
  title: string;
  description: string;
  domain: string;
  favicon: string | null;
};

export function AddLinkDialog() {
  const { open, url } = useUi((s) => s.addLink);
  const close = useUi((s) => s.closeAddLink);
  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent>
        <AddLinkForm initialUrl={url} onDone={close} />
      </DialogContent>
    </Dialog>
  );
}

function AddLinkForm({ initialUrl, onDone }: { initialUrl: string; onDone: () => void }) {
  const store = useAppApi();
  const groups = useApp((s) => s.groups);
  const currentId = useApp((s) => s.currentGroupId);
  const [url, setUrl] = useState(initialUrl);
  const [groupId, setGroupId] = useState(currentId);
  const [title, setTitle] = useState("");
  const [edited, setEdited] = useState(false);
  const [result, setResult] = useState<{ url: string; data: Preview | null } | null>(
    null,
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const valid = looksLikeUrl(url) || /^https?:\/\/\S+$/i.test(url.trim());
  // Derived, so a stale preview for an older URL is never shown.
  const preview = result?.url === url ? result.data : null;
  const loading = valid && result?.url !== url;

  // Fetch a preview once the user stops typing.
  useEffect(() => {
    if (!valid) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const data = await api<Preview>("/metadata", {
          method: "POST",
          body: { url },
          signal: controller.signal,
        });
        setResult({ url, data });
        if (!edited) setTitle(data.title);
      } catch (e) {
        if ((e as Error).name !== "AbortError") setResult({ url, data: null });
      }
    }, 450);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
    // `edited` is read, not a trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, valid]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return setError("Enter a valid link");
    setBusy(true);
    try {
      const saved = await store.getState().addBookmark({
        url,
        groupId,
        title: edited && title.trim() ? title.trim() : undefined,
      });
      const target = groups.find((g) => g.id === saved.groupId);
      if (groupId !== store.getState().currentGroupId)
        store.getState().setCurrentGroup(groupId);
      toast.success("Link saved", {
        description: target ? `Added to ${target.name}` : undefined,
      });
      onDone();
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : "Something went wrong. Try again.",
      );
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-5" noValidate>
      <DialogHeader>
        <DialogTitle>Add link</DialogTitle>
        <DialogDescription>
          Paste a URL. The title, description and icon are fetched for you.
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-2">
        <Label htmlFor="link-url">Link</Label>
        <Input
          id="link-url"
          autoFocus
          type="text"
          inputMode="url"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          placeholder="example.com"
          value={url}
          aria-invalid={!!error}
          onChange={(e) => {
            setUrl(e.target.value);
            setError("");
          }}
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>

      <AnimatePresence initial={false}>
        {(loading || preview) && (
          <motion.div
            key="preview"
            className="overflow-hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
          >
            <div className="flex gap-3 rounded-lg border bg-muted/40 p-3">
              <div className="mt-1 flex size-5 shrink-0 items-center justify-center">
                {preview?.favicon ? (
                  // eslint-disable-next-line @next/next/no-img-element -- data URL preview
                  <img
                    src={preview.favicon}
                    alt=""
                    className="size-4 rounded-[3px] object-contain"
                  />
                ) : loading ? (
                  <Loader2 className="size-4 animate-spin text-muted-foreground" />
                ) : (
                  <Globe className="size-4 text-muted-foreground" strokeWidth={1.75} />
                )}
              </div>
              <div className="min-w-0 flex-1">
                {preview ? (
                  <>
                    <Input
                      value={title}
                      maxLength={200}
                      aria-label="Title"
                      className="h-8 bg-background px-2 font-medium"
                      onChange={(e) => {
                        setTitle(e.target.value);
                        setEdited(true);
                      }}
                    />
                    <p className="mt-1.5 truncate text-xs text-muted-foreground">
                      {preview.domain}
                    </p>
                    {preview.description && (
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                        {preview.description}
                      </p>
                    )}
                  </>
                ) : (
                  <div className="grid gap-2 pt-1" aria-label="Loading preview">
                    <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid gap-2">
        <Label htmlFor="link-group">Group</Label>
        <Select value={groupId} onValueChange={setGroupId}>
          <SelectTrigger id="link-group">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {groups.map((g) => (
              <SelectItem key={g.id} value={g.id}>
                <GroupDot color={g.color} /> {g.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={busy || !valid}>
          {busy && <Loader2 className="animate-spin" />}
          Add link
        </Button>
      </DialogFooter>
    </form>
  );
}
