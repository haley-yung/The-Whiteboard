import { getCases } from "@/lib/data";
import { getUsers } from "@/lib/data";
import { ArchiveList } from "@/components/archive-list";

export const dynamic = "force-dynamic";

export default async function ArchivePage() {
  const [allCases, users] = await Promise.all([getCases(), getUsers()]);
  const archived = allCases
    .filter((c) => c.current_phase === "Archive")
    .sort((a, b) => (b.approved_at ?? "").localeCompare(a.approved_at ?? ""));
  return <ArchiveList cases={archived} users={users} />;
}
