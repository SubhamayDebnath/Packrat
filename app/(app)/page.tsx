import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Dashboard } from "@/components/dashboard";
import { GROUP_COOKIE } from "@/lib/constants";
import { getSessionUser } from "@/lib/server/auth";
import { getHomeData } from "@/lib/server/data";
import { AppStoreProvider } from "@/stores/app-store";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const { q, page } = await searchParams;
  const { groups, bookmarks } = await getHomeData(user.id);
  const saved = (await cookies()).get(GROUP_COOKIE)?.value;
  const currentGroupId = groups.find((g) => g.id === saved)?.id ?? groups[0].id;

  return (
    <AppStoreProvider
      init={{
        user: { ...user, createdAt: user.createdAt.toISOString() },
        groups,
        bookmarks,
        currentGroupId,
        query: (q ?? "").slice(0, 200),
        page: Math.max(1, Math.min(Number.parseInt(page ?? "1", 10) || 1, 10_000)),
      }}
    >
      <Dashboard />
    </AppStoreProvider>
  );
}
