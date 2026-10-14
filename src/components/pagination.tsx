import Link from "next/link";

export const PAGE_SIZE = 25;

export function pageNumber(value?: string) {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0
    ? Math.min(parsed, 100_000)
    : 1;
}

export function Pagination({
  path,
  page,
  count,
  filters = {},
}: {
  path: string;
  page: number;
  count: number;
  filters?: Record<string, string>;
}) {
  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));
  if (totalPages <= 1) return null;
  const href = (target: number) => {
    const params = new URLSearchParams(filters);
    params.set("page", String(target));
    return `${path}?${params.toString()}`;
  };
  return (
    <nav className="pagination" aria-label="Páginas">
      {page > 1 ? (
        <Link className="button secondary" href={href(page - 1)}>
          ← Anterior
        </Link>
      ) : (
        <span />
      )}
      <span>
        Página {page} de {totalPages}
      </span>
      {page < totalPages ? (
        <Link className="button secondary" href={href(page + 1)}>
          Próxima →
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
