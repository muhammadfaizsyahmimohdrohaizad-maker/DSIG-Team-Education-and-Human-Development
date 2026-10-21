import { redirect } from "next/navigation";
import { currentAccount, homeFor } from "@/server/auth/account";

export default async function Home() {
  redirect(homeFor(await currentAccount()));
}
