import { currentAccount } from "@/server/auth/account";
import { getStore } from "@/server/data";

/** Export my data: everything stored about the signed-in student, as one JSON file (portability right). */
export async function GET() {
  const account = await currentAccount();
  if (account.kind !== "student") return new Response("Sign in as a student to export your data.", { status: 401 });
  const data = await getStore().exportMine();
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="careerprep-my-data-${new Date().toISOString().slice(0, 10)}.json"`,
      "cache-control": "no-store",
    },
  });
}
