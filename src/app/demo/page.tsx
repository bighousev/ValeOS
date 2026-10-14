import { notFound } from "next/navigation";
import { DemoApp } from "@/components/demo-app";

export const dynamic = "force-dynamic";

export default function DemoPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <DemoApp />;
}
