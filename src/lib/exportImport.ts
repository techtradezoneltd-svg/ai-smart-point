import * as XLSX from 'xlsx';
import Papa from 'papaparse';

// Export data to Excel
export const exportToExcel = (data: any[], filename: string, sheetName: string = 'Sheet1') => {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${filename}.xlsx`);
};

// Export data to CSV
export const exportToCSV = (data: any[], filename: string) => {
  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

// Import from CSV
export const importFromCSV = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        resolve(results.data);
      },
      error: (error) => {
        reject(error);
      }
    });
  });
};

// Import from Excel
export const importFromExcel = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        resolve(jsonData);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
};

// Format data for export (remove unwanted fields, format dates, etc.)
export const formatForExport = (data: any[], excludeFields: string[] = []) => {
  return data.map(item => {
    const formatted = { ...item };
    
    // Remove unwanted fields
    excludeFields.forEach(field => {
      delete formatted[field];
    });
    
    // Format dates
    Object.keys(formatted).forEach(key => {
      if (formatted[key] instanceof Date) {
        formatted[key] = formatted[key].toISOString().split('T')[0];
      }
      // Handle string dates
      if (typeof formatted[key] === 'string' && key.includes('_at') || key.includes('date')) {
        const date = new Date(formatted[key]);
        if (!isNaN(date.getTime())) {
          formatted[key] = date.toISOString().split('T')[0];
        }
      }
    });
    
    return formatted;
  });
};