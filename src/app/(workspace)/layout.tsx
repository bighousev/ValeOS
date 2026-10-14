import { Sidebar } from "@/components/sidebar";
import { requireUser } from "@/lib/auth";
import { signOut } from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = await requireUser();
  return (
    <div className="workspace">
      <Sidebar name={profile.name} />
      <div className="workspace-main">
        <header className="topbar">
          <div className="mobile-brand">
            <span className="brand-mark">V</span> ValeOS
          </div>
          <div className="topbar-right">
            <span className="environment-badge">
              <span /> Ambiente interno
            </span>
            <form action={signOut}>
              <button className="text-button">Sair</button>
            </form>
          </div>
        </header>
        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}
