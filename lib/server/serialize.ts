import type { Bookmark, Group, User } from "@/types";

type Id = { toString(): string };

export const toUser = (u: {
  _id: Id;
  username: string;
  email: string;
  isAdmin: boolean;
  status: string;
  createdAt?: Date;
}): User => ({
  id: String(u._id),
  username: u.username,
  email: u.email,
  isAdmin: u.isAdmin,
  status: u.status as User["status"],
  createdAt: (u.createdAt ?? new Date()).toISOString(),
});

export const toGroup = (g: {
  _id: Id;
  name: string;
  color: string;
  isDefault?: boolean;
  isPublic?: boolean;
  shareId?: string | null;
}): Group => ({
  id: String(g._id),
  name: g.name,
  color: g.color,
  isDefault: !!g.isDefault,
  isPublic: !!g.isPublic,
  shareId: g.shareId ?? null,
});

export const toBookmark = (b: {
  _id: Id;
  groupId: Id;
  url: string;
  title: string;
  description?: string;
  domain: string;
  faviconVersion?: number;
  createdAt?: Date;
}): Bookmark => ({
  id: String(b._id),
  groupId: String(b.groupId),
  url: b.url,
  title: b.title,
  description: b.description ?? "",
  domain: b.domain,
  favicon: b.faviconVersion ?? 0,
  createdAt: (b.createdAt ?? new Date()).toISOString(),
});
