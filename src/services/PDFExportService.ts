// pdfExport.service.ts
import jsPDF from 'jspdf';

type PDFData = Record<string, any>;

export class PDFExportService {
  private doc: jsPDF;
  private margin = 20;
  private pageWidth: number;
  private pageHeight: number;
  private yPosition = 30;
  private lineHeight = 7;
  private sectionSpacing = 15;

  constructor() {
    this.doc = new jsPDF();
    this.pageWidth = this.doc.internal.pageSize.width;
    this.pageHeight = this.doc.internal.pageSize.height;
  }

  public createPDF(data: PDFData, title: string | string[],sections: { key: string; label: string; color: [number, number, number] }[]): void {
    this.addHeader(title);
    this.addDate();
    this.addSeparator();

    this.addSections(data,sections);

    const fileName = `${title}-${new Date().toISOString().split('T')[0]}.pdf`;
    this.doc.save(fileName);
  }

  private addHeader(title: string | string[]) {
    this.doc.setFontSize(24);
    this.doc.setTextColor(44, 62, 80);
    this.doc.text(title, this.margin, this.yPosition);
    this.yPosition += 10;
  }

  private addDate() {
    this.doc.setFontSize(12);
    this.doc.setTextColor(128, 128, 128);
    const dateStr = new Date().toLocaleDateString('fr-FR', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
    this.doc.text(`Exporté le ${dateStr}`, this.margin, this.yPosition);
    this.yPosition += 20;
  }

  private addSeparator() {
    this.doc.setDrawColor(52, 152, 219);
    this.doc.line(this.margin, this.yPosition, this.pageWidth - this.margin, this.yPosition);
    this.yPosition += 15;
  }

  private addSections(data: PDFData, sections: { key: string; label: string; color: [number, number, number] }[]) {


    const processedKeys = new Set();

    for (const { key, label, color } of sections) {
      if (data[key]) {
        this.addSection(label, data[key], color);
        processedKeys.add(key);
      }
    }

    // Ajout des sections restantes
    Object.entries(data).forEach(([key, value]) => {
      if (!processedKeys.has(key)) {
        this.addSection(this.formatFieldName(key), value, [95, 39, 205]);
      }
    });
  }

  private addSection(title: string, content: any, color: [number, number, number]) {
    // Vérifie s'il y a assez de place pour le titre + soulignement + 1 ligne
    this.addNewPageIfNeeded(30);

    // Titre section
    this.doc.setFontSize(16);
    this.doc.setTextColor(...color);
    this.doc.text(title, this.margin, this.yPosition);
    this.yPosition += 5;

    // Soulignement
    this.doc.setDrawColor(...color);
    this.doc.line(this.margin, this.yPosition, this.margin + this.doc.getTextWidth(title), this.yPosition);
    this.yPosition += 10;

    // Contenu section
    this.doc.setFontSize(11);
    this.doc.setTextColor(50, 50, 50);

    // ⚠️ Vérifie qu’il reste de l’espace avant de continuer à imprimer du contenu
    this.addNewPageIfNeeded(20);

    if (Array.isArray(content)) {
      content.forEach((item, index) => {
        this.addNewPageIfNeeded(15);
        this.doc.setTextColor(70, 70, 70);
        this.doc.text(`${index + 1}.`, this.margin, this.yPosition);

        if (typeof item === 'object') {
          Object.entries(item).forEach(([key, value]) => {
            this.addKeyValueToPDF(this.formatFieldName(key), value);
          });
        } else {
          this.addRawText(String(item));
        }

        this.yPosition += 5;
      });
    } else if (typeof content === 'object' && content !== null) {
      const entries = Object.entries(content);
      if (entries.length === 0) {
        this.addRawText('Aucune donnée');
      } else {
        entries.forEach(([key, value]) => {
          this.addKeyValueToPDF(key, value);
        });
      }
    } else {
      this.addRawText(String(content));
    }

    this.yPosition += this.sectionSpacing; // <- ajoute un espace à la fin
  }


  private addKeyValueToPDF(key: string, value: any, indent = 0) {
    this.addNewPageIfNeeded(10);
    const indentSpace = '  '.repeat(indent);
    const isObject = typeof value === 'object' && value !== null;

    const drawText = (text: string, isBold = false) => {
      this.doc.setFont('helvetica', isBold ? 'bold' : 'normal');
      this.doc.text(text, this.margin + indent * 5, this.yPosition);
      this.yPosition += this.lineHeight;
    };

    if (Array.isArray(value)) {
      if (value.length === 0) return;

      if (key) drawText(`${this.formatFieldName(key)}:`, true);

      value.forEach((item, index) => {
        if (typeof item === 'object') {
          drawText(`- [${index + 1}]`, false);
          this.addKeyValueToPDF('', item, indent + 1);
        } else {
          drawText(`- ${this.formatValue(item)}`, false);
        }
      });
    } else if (isObject) {
      const entries = Object.entries(value);
      if (entries.length === 0) return;

      if (key) drawText(`${this.formatFieldName(key)}:`, true);

      const useDash = entries.length > 1;

      entries.forEach(([subKey, subVal]) => {
        const prefix = useDash ? `- ` : ``;
        const label = `${prefix}${this.formatFieldName(subKey)}: ${this.formatValue(subVal)}`;
        if (typeof subVal === 'object' && subVal !== null) {
          drawText(`${prefix}${this.formatFieldName(subKey)}:`, true);
          this.addKeyValueToPDF('', subVal, indent + 1);
        } else {
          drawText(label);
        }
      });
    } else {
      const label = `${this.formatFieldName(key)}: `;
      const result = `${this.formatValue(value)}`;

      this.doc.setFont('helvetica', 'bold');
      this.doc.text(label, this.margin + indent * 5, this.yPosition);

      const labelWidth = this.doc.getTextWidth(label);

      this.doc.setFont('helvetica', 'normal');
      this.doc.text(result, this.margin + indent * 5 + labelWidth, this.yPosition);

      this.yPosition += this.lineHeight;

    }

    this.yPosition += 2;
  }



  private addRawText(text: string) {
    const lines = this.doc.splitTextToSize(text, this.pageWidth - this.margin * 2);
    lines.forEach((line: string | string[]) => {
      this.addNewPageIfNeeded(this.lineHeight);
      this.doc.text(line, this.margin, this.yPosition);
      this.yPosition += this.lineHeight;
    });
  }

  private formatValue(value: any): string {
    if (value === null || value === undefined) return 'Non renseigné';
    if (typeof value === 'boolean') return value ? 'Oui' : 'Non';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    if (typeof value === 'string' && value.includes('T') && value.includes('Z')) {
      try {
        return new Date(value).toLocaleDateString('fr-FR');
      } catch {
        return value;
      }
    }
    return String(value);
  }

  private addNewPageIfNeeded(requiredSpace = 20) {
    if (this.yPosition + requiredSpace > this.pageHeight - this.margin) {
      this.doc.addPage();
      this.yPosition = this.margin;
    }
  }

  private formatFieldName(name: string): string {
    return name
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  }
}
