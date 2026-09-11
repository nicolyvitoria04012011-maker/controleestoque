export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0);
}

export function formatNumber(value: number, decimals = 0): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value || 0);
}

export function formatDate(dateString: string): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString.replace(' ', 'T'));
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateString: string): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString.replace(' ', 'T'));
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}

export function exportToCsv(filename: string, headers: string[], rows: (string | number)[][]): void {
  // UTF-8 BOM so Excel opens it with correct Portuguese characters (á, ç, õ, etc.)
  const BOM = '\uFEFF';
  const csvContent = rows
    .map(row =>
      row
        .map(cell => {
          const str = String(cell ?? '').replace(/"/g, '""');
          return `"${str}"`;
        })
        .join(';')
    )
    .join('\r\n');

  const fullContent = BOM + headers.map(h => `"${h}"`).join(';') + '\r\n' + csvContent;
  const blob = new Blob([fullContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
