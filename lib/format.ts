export function formatDate(iso: string) {
  const date = new Date(iso);
  const sameYear = date.getFullYear() === new Date().getFullYear();
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  });
}

/** Loose check used only to decide whether pasted text looks like a link. */
export function looksLikeUrl(value: string) {
  const v = value.trim();
  if (!v || /\s/.test(v)) return false;
  return /^(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}(:\d+)?([/?#].*)?$/i.test(v);
}

export function randomPassword(length = 14) {
  const sets = [
    "abcdefghijkmnopqrstuvwxyz",
    "ABCDEFGHJKLMNPQRSTUVWXYZ",
    "23456789",
    "!@#$%&*?",
  ];
  const all = sets.join("");
  const pick = (chars: string) => {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    return chars[buf[0] % chars.length];
  };
  const chars = sets.map(pick); // guarantees letter + number
  while (chars.length < length) chars.push(pick(all));
  for (let i = chars.length - 1; i > 0; i--) {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    const j = buf[0] % (i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}
