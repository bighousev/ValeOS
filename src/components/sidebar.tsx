import Link from "next/link";
import {
  LayoutDashboard,
  ContactRound,
  KanbanSquare,
  Building2,
  FolderKanban,
  CalendarDays,
  Bell,
  Settings2,
  Search,
  ArrowUpRight,
} from "lucide-react";

const links = [
  { href: "/", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/busca", label: "Busca", Icon: Search },
  { href: "/leads", label: "Prospecção", Icon: ContactRound },
  { href: "/pipeline", label: "Pipeline", Icon: KanbanSquare },
  { href: "/clientes", label: "Clientes", Icon: Building2 },
  { href: "/projetos", label: "Projetos", Icon: FolderKanban },
  { href: "/reunioes", label: "Reuniões", Icon: CalendarDays },
  { href: "/notificacoes", label: "Notificações", Icon: Bell },
  { href: "/configuracoes", label: "Configurações", Icon: Settings2 },
];

export function Sidebar({ name }: { name: string }) {
  return (
    <aside className="sidebar">
      <Link href="/" className="brand">
        <span className="brand-mark">V</span>
        <span>ValeOS</span>
      </Link>
      <div className="workspace-label">
        WORKSPACE <span>VALEOS / INTERNO</span>
      </div>
      <nav aria-label="Navegação principal">
        {links.map(({ href, label, Icon }) => (
          <Link key={href} href={href} className="nav-item">
            <Icon size={18} strokeWidth={1.8} />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <div className="sidebar-help">
          <span className="sidebar-help-icon">
            <ArrowUpRight size={19} />
          </span>
          <strong>Um passo de cada vez.</strong>
          <p>Organize contatos, oportunidades e entregas em um só lugar.</p>
        </div>
        <div className="user-chip">
          <span className="avatar">{name.charAt(0).toUpperCase()}</span>
          <div>
            <strong>{name}</strong>
            <small>Equipe ValeOS</small>
          </div>
        </div>
      </div>
    </aside>
  );
}
