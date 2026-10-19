import * as XLSX from 'xlsx';

/** Descarga un .xlsx con una hoja por cada entrada. */
export function exportarExcel(nombreArchivo: string, hojas: Record<string, Record<string, unknown>[]>) {
  const libro = XLSX.utils.book_new();
  for (const [nombre, filas] of Object.entries(hojas)) {
    const hoja = XLSX.utils.json_to_sheet(filas);
    const columnas = Object.keys(filas[0] ?? {});
    hoja['!cols'] = columnas.map(c => ({ wch: Math.max(c.length, ...filas.map(f => String(f[c] ?? '').length)) + 2 }));
    XLSX.utils.book_append_sheet(libro, hoja, nombre.slice(0, 31));
  }
  XLSX.writeFile(libro, nombreArchivo);
}

/** Lee la primera hoja de un .xlsx/.csv como filas con los encabezados como claves. */
export async function leerExcel(archivo: File): Promise<Record<string, unknown>[]> {
  const libro = XLSX.read(await archivo.arrayBuffer());
  return XLSX.utils.sheet_to_json(libro.Sheets[libro.SheetNames[0]], { defval: '' });
}
