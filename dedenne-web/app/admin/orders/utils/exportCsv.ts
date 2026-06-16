export function exportCsv(data: any[], filename: string) {
  if (!data || !data.length) return;

  // Header extraction
  const headers = Object.keys(data[0]);
  
  // Convert rows
  const csvRows = data.map((row) => {
    return headers
      .map((header) => {
        let val = row[header];
        if (val === null || val === undefined) val = "";
        
        // Escape quotes
        let strVal = String(val).replace(/"/g, '""');
        
        // Quote if contains comma, newline, or quote
        if (strVal.search(/("|,|\n)/g) >= 0) {
          strVal = `"${strVal}"`;
        }
        return strVal;
      })
      .join(",");
  });

  const csvContent = [headers.join(","), ...csvRows].join("\n");
  
  // Add BOM for Excel utf-8 encoding support
  const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
  
  const link = document.createElement("a");
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
