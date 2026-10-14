import Link from "next/link";

export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="page-heading">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action && (
        <Link className="button primary" href={action.href}>
          {action.label}
        </Link>
      )}
    </div>
  );
}

export function Notice({ error, ok }: { error?: string; ok?: string }) {
  return (
    <>
      {error && (
        <div className="notice error" role="alert">
          {error}
        </div>
      )}
      {ok && (
        <div className="notice success" role="status">
          {ok}
        </div>
      )}
    </>
  );
}

export function EmptyState({
  title,
  description,
  href,
  label,
}: {
  title: string;
  description: string;
  href?: string;
  label?: string;
}) {
  return (
    <div className="empty-state">
      <div className="empty-symbol">◇</div>
      <h3>{title}</h3>
      <p>{description}</p>
      {href && label && (
        <Link href={href} className="button secondary">
          {label}
        </Link>
      )}
    </div>
  );
}

export function Status({ children }: { children: React.ReactNode }) {
  return <span className="status">{children}</span>;
}
