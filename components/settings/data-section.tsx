"use client";

import { useRef, useState } from "react";
import { Download, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DEFAULT_GROUP_NAME } from "@/lib/constants";
import { buildNetscape, downloadFile, parseNetscape } from "@/lib/netscape";
import { useApp, useAppApi } from "@/stores/app-store";

const MAX_FILE = 4 * 1024 * 1024;

export function DataSection() {
  const store = useAppApi();
  const bookmarkCount = useApp((s) => s.bookmarks.length);
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  function exportAll() {
    const { groups, bookmarks } = store.getState();
    downloadFile(
      `packrat-bookmarks-${new Date().toISOString().slice(0, 10)}.html`,
      buildNetscape(groups, bookmarks),
    );
    toast.success("Bookmarks exported");
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    if (file.size > MAX_FILE)
      return void toast.error("That file is too large. Keep it under 4 MB.");
    setBusy(true);
    try {
      const payload = parseNetscape(await file.text(), DEFAULT_GROUP_NAME);
      const total = payload.groups.reduce((n, g) => n + g.links.length, 0);
      if (!total)
        return void toast.error(
          "No bookmarks found. Choose an HTML file exported from your browser.",
        );
      await store.getState().importBookmarks(payload);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div className="grid gap-2">
      <Label>Data</Label>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={exportAll}
          disabled={!bookmarkCount}
        >
          <Download /> Export bookmarks
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => input.current?.click()}
          disabled={busy}
        >
          {busy ? <Loader2 className="animate-spin" /> : <Upload />} Import browser
          bookmarks
        </Button>
        <input
          ref={input}
          type="file"
          accept=".html,.htm,text/html"
          className="sr-only"
          tabIndex={-1}
          aria-label="Import bookmarks HTML file"
          onChange={(e) => onFile(e.target.files?.[0])}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Uses the standard HTML format from Chrome, Firefox, Safari and Edge. Folders
        become groups.
      </p>
    </div>
  );
}
