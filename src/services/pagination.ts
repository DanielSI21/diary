const PAGE_SIZE = 1000;

/**
 * Recorre una consulta paginada hasta recuperar todas sus filas.
 * Supabase limita por defecto el número de registros de cada respuesta.
 */
export async function fetchAllPages<T>(
  fetchPage: (from: number, to: number) => Promise<T[]>,
): Promise<T[]> {
  const rows: T[] = [];

  while (true) {
    const page = await fetchPage(rows.length, rows.length + PAGE_SIZE - 1);
    if (page.length === 0) return rows;
    rows.push(...page);
  }
}
