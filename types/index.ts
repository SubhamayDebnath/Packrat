export type User = {
  id: string;
  username: string;
  email: string;
  isAdmin: boolean;
  status: "active" | "pending";
  createdAt: string;
};

export type Group = {
  id: string;
  name: string;
  color: string;
  isDefault: boolean;
  isPublic: boolean;
  shareId: string | null;
};

export type Bookmark = {
  id: string;
  groupId: string;
  url: string;
  title: string;
  description: string;
  domain: string;
  /** 0 = no favicon stored. Otherwise used as a cache-busting version. */
  favicon: number;
  createdAt: string;
};

export type ImportPayload = {
  groups: { name: string; links: { url: string; title: string }[] }[];
};
