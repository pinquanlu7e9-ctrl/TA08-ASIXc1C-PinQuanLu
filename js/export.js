/**
 * ITB Energy Savings Calculator – PDF Export Module
 * Uses jsPDF 2.x + html2canvas (loaded via CDN)
 */

const Exportar = {

  /**
   * Export the current page as PDF using jsPDF + html2canvas.
   * Falls back to window.print() if libraries are not loaded.
   */
  async paginaActual(nomFitxer = 'ITB-informe-energetic.pdf') {
    // Guard
    if (typeof jspdf === 'undefined' || typeof html2canvas === 'undefined') {
      alert('Exportant via impressora del navegador…\n\nPer exportar en PDF complet, obre la pàgina des d\'un servidor web.');
      window.print();
      return;
    }

    const btn = document.getElementById('btn-export-pdf');
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Generant PDF…'; }

    try {
      const { jsPDF } = jspdf;
      const el = document.getElementById('main-content') || document.body;

      // Temporarily set white bg for capture
      const prevBg = el.style.background;
      el.style.background = '#fff';

      const canvas = await html2canvas(el, {
        scale: 1.5,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        ignoreElements: el => el.classList.contains('no-print'),
      });

      el.style.background = prevBg;

      const imgW = 210; // A4 width mm
      const imgH = (canvas.height * imgW) / canvas.width;
      const pdf  = new jsPDF({ orientation: imgH > 297 ? 'p' : 'l', unit: 'mm', format: 'a4' });

      // Paginate if content is taller than one A4 page
      const pageH = 297;
      let posY = 0;
      while (posY < imgH) {
        if (posY > 0) pdf.addPage();
        pdf.addImage(canvas, 'PNG', 0, -posY, imgW, imgH);
        posY += pageH;
      }

      // Metadata
      pdf.setProperties({
        title:   'ITB – Calculadora d\'Estalvi Energètic',
        subject: 'Informe de consum i propostes de millora',
        author:  'ITB ASIXc1 – Grup PinQuanLu',
        creator: 'TA08 – Calculadora Energètica',
      });

      pdf.save(nomFitxer);
    } catch (err) {
      console.error('Export error:', err);
      window.print();
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = '📥 Exportar PDF'; }
    }
  },

  /**
   * Export just the results table as a clean PDF report.
   */
  async informeCalculadora(resultats) {
    if (typeof jspdf === 'undefined') {
      alert('Exportant via impressora del navegador…');
      window.print();
      return;
    }

    const { jsPDF } = jspdf;
    const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    const margin = 14;
    let y = margin;

    // ── Header ────
    pdf.setFillColor(7, 9, 13);
    pdf.rect(0, 0, 210, 28, 'F');
    pdf.setTextColor(16, 185, 129);
    pdf.setFontSize(16); pdf.setFont('helvetica', 'bold');
    pdf.text('ITB – Calculadora d\'Estalvi Energètic', margin, 12);
    pdf.setFontSize(9); pdf.setTextColor(148, 163, 184);
    pdf.text(`Institut Tecnològic de Barcelona · Informe generat: ${new Date().toLocaleDateString('ca-ES')}`, margin, 20);
    y = 36;

    // ── Summary row ───
    const totalCost = resultats.reduce((s,r) => s+r.cost, 0);
    const totalCo2  = resultats.reduce((s,r) => s+r.co2, 0);

    pdf.setFillColor(17, 24, 32);
    pdf.roundedRect(margin, y, 182, 18, 2, 2, 'F');
    pdf.setTextColor(248, 250, 252); pdf.setFontSize(10); pdf.setFont('helvetica', 'bold');
    pdf.text('Resum de resultats', margin+4, y+7);
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9); pdf.setTextColor(148,163,184);
    pdf.text(`Cost total: ${ITB.fmtEur(totalCost)}`, margin+4, y+14);
    pdf.text(`CO₂ total: ${ITB.fmt(totalCo2)} kg`, 110, y+14);
    y += 26;

    // ── Table ───
    const cols = [
      { label: 'Indicador',   x: margin,  w: 68 },
      { label: 'Període',     x: margin+68, w: 22 },
      { label: 'Valor',       x: margin+90, w: 30 },
      { label: 'Cost (€)',    x: margin+120, w: 28 },
      { label: 'CO₂ (kg)',    x: margin+148, w: 28 },
    ];

    // Header row
    pdf.setFillColor(30, 45, 61);
    pdf.rect(margin, y, 182, 8, 'F');
    pdf.setTextColor(148, 163, 184); pdf.setFontSize(8); pdf.setFont('helvetica', 'bold');
    cols.forEach(c => pdf.text(c.label, c.x+2, y+5.5));
    y += 9;

    resultats.forEach((r, i) => {
      if (y > 265) { pdf.addPage(); y = margin; }
      const bg = i % 2 === 0 ? [17,24,32] : [13,17,23];
      pdf.setFillColor(...bg);
      pdf.rect(margin, y, 182, 9, 'F');
      pdf.setTextColor(226, 232, 240); pdf.setFontSize(8.5); pdf.setFont('helvetica', 'normal');
      pdf.text(`${r.icon} ${r.name}`, cols[0].x+2, y+6);
      pdf.text(r.periode === 'curs' ? 'Set→Jun' : r.periode === 'anual' ? 'Any' : 'Custom', cols[1].x+2, y+6);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${ITB.fmt(r.valor, r.unitat === 'kWh' || r.unitat === 'm³' ? 0 : 0)} ${r.unitat}`, cols[2].x+2, y+6);
      pdf.setTextColor(52, 211, 153);
      pdf.text(ITB.fmt(r.cost), cols[3].x+2, y+6);
      pdf.text(ITB.fmt(r.co2), cols[4].x+2, y+6);
      pdf.setTextColor(226,232,240);
      y += 9;
    });

    // ── Footer ───
    y += 12;
    pdf.setDrawColor(30,45,61); pdf.line(margin, y, 196, y);
    y += 6;
    pdf.setFontSize(8); pdf.setTextColor(74, 96, 117); pdf.setFont('helvetica','italic');
    pdf.text('TA08 – Calculadora d\'Estalvi Energètic · ITB ASIXc1 · Dades: ITB Leaks 2024 · CC-BY 4.0', margin, y);

    pdf.save('ITB-calculadora-resultats.pdf');
  },
};