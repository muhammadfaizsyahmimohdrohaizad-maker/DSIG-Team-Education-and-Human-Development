import { Presentation } from "@/components/presentation";

export default async function Page({ params }: { params: Promise<{ path?: string[] }> }) {
  return <Presentation path={(await params).path?.join("/") || "dashboard"} />;
}
