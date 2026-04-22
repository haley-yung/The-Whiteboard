import { getCases } from "@/lib/data";
import { Board } from "@/components/board";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const cases = await getCases();
  return <Board cases={cases} />;
}
