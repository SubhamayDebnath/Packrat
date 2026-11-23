"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { useUi } from "@/stores/ui";

type ConfirmState = NonNullable<ReturnType<typeof useUi.getState>["confirm"]>;

export function ConfirmHost() {
  const confirm = useUi((s) => s.confirm);
  const closeConfirm = useUi((s) => s.closeConfirm);

  return (
    <AlertDialog open={!!confirm} onOpenChange={(open) => !open && closeConfirm()}>
      <AlertDialogContent size="sm">
        {/* Keyed so the typed text resets whenever a new confirmation opens. */}
        {confirm && (
          <ConfirmBody key={confirm.title} confirm={confirm} onDone={closeConfirm} />
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}

function ConfirmBody({ confirm, onDone }: { confirm: ConfirmState; onDone: () => void }) {
  const [text, setText] = useState("");
  const locked = !!confirm.requireText && text !== confirm.requireText;

  return (
    <>
      <AlertDialogHeader>
        <AlertDialogTitle>{confirm.title}</AlertDialogTitle>
        <AlertDialogDescription>{confirm.description}</AlertDialogDescription>
      </AlertDialogHeader>
      {confirm.requireText && (
        <Input
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`Type ${confirm.requireText}`}
          aria-label={`Type ${confirm.requireText} to confirm`}
          autoComplete="off"
          spellCheck={false}
        />
      )}
      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction
          disabled={locked}
          variant={confirm.destructive ? "destructive" : "default"}
          onClick={(e) => {
            // Stop Radix from closing the dialog itself. It would also wipe a follow-up
            // confirmation that onConfirm opens (the "type DELETE" step).
            e.preventDefault();
            const fn = confirm.onConfirm;
            onDone();
            void fn();
          }}
        >
          {confirm.actionLabel}
        </AlertDialogAction>
      </AlertDialogFooter>
    </>
  );
}
