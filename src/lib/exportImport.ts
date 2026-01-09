import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Export data to PDF
export const exportToPDF = (
  data: any[], 
  filename: string, 
  title: string = 'Report',
  options?: {
    orientation?: 'portrait' | 'landscape';
    includeTimestamp?: boolean;
    companyName?: string;
  }
) => {
  const { orientation = 'portrait', includeTimestamp = true, companyName = 'SmartPOS' } = options || {};
  
  const doc = new jsPDF(orientation, 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header with company name
  doc.setFontSize(20);
  doc.setTextColor(41, 98, 255);
  doc.text(companyName, 14, 20);
  
  // Report title
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text(title, 14, 32);
  
  // Timestamp
  if (includeTimestamp) {
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 40);
  }
  
  // If no data, show message
  if (!data || data.length === 0) {
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('No data available for this report.', 14, 55);
    doc.save(`${filename}.pdf`);
    return;
  }

  // Get column headers from first object
  const headers = Object.keys(data[0]).map(key => 
    key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  );
  
  // Prepare table rows
  const rows = data.map(item => Object.values(item).map(val => {
    if (val === null || val === undefined) return '-';
    if (typeof val === 'object') return JSON.stringify(val);
    if (typeof val === 'number') {
      return val.toLocaleString();
    }
    return String(val);
  }));

  // Generate table
  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: includeTimestamp ? 48 : 40,
    styles: {
      fontSize: 8,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [41, 98, 255],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
    margin: { left: 14, right: 14 },
    didDrawPage: (data) => {
      // Footer with page numbers
      const pageCount = doc.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(
        `Page ${data.pageNumber} of ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }
  });

  doc.save(`${filename}.pdf`);
};

// Export summary report to PDF (for financial/summary reports)
export const exportSummaryToPDF = (
  title: string,
  filename: string,
  sections: {
    sectionTitle: string;
    data: { label: string; value: string | number }[];
  }[],
  options?: {
    companyName?: string;
  }
) => {
  const { companyName = 'SmartPOS' } = options || {};
  const doc = new jsPDF('portrait', 'mm', 'a4');
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(41, 98, 255);
  doc.text(companyName, 14, 20);
  
  // Title
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text(title, 14, 32);
  
  // Timestamp
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 40);
  
  let yPos = 55;
  
  sections.forEach((section, index) => {
    // Section title
    doc.setFontSize(12);
    doc.setTextColor(41, 98, 255);
    doc.text(section.sectionTitle, 14, yPos);
    yPos += 8;
    
    // Section data
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    
    section.data.forEach(item => {
      doc.text(`${item.label}:`, 20, yPos);
      doc.text(String(item.value), 100, yPos);
      yPos += 6;
    });
    
    yPos += 8;
    
    // Add new page if needed
    if (yPos > 270) {
      doc.addPage();
      yPos = 20;
    }
  });
  
  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }
  
  doc.save(`${filename}.pdf`);
};

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
      // Handle string dates - fixed logic operator precedence
      if (typeof formatted[key] === 'string' && (key.includes('_at') || key.includes('date'))) {
        const date = new Date(formatted[key]);
        if (!isNaN(date.getTime())) {
          formatted[key] = date.toISOString().split('T')[0];
        }
      }
    });
    
    return formatted;
  });
};