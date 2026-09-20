export function formatINR(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(Number(amount))) return "₹0";
  const num = Math.round(Number(amount));
  return "₹" + num.toLocaleString("en-IN");
}

export function formatPercent(val: number | string | null | undefined): string {
  if (val === null || val === undefined || isNaN(Number(val))) return "0%";
  return Number(val) + "%";
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "N/A";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return dateStr;
  }
}

export function truncateHash(hash: string | null | undefined, head = 8, tail = 8): string {
  if (!hash) return "—";
  if (hash.length <= head + tail + 3) return hash;
  return `${hash.slice(0, head)}...${hash.slice(-tail)}`;
}
