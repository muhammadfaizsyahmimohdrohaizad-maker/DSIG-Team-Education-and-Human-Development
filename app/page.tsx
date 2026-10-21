import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function Home() {
  const consented = (await cookies()).get("cp_consent");
  redirect(consented ? "/map" : "/onboarding");
}
