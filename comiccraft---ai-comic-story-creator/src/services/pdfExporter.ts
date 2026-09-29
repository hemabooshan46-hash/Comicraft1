import { jsPDF } from 'jspdf';
import { ComicStoryResult } from '../types/comic';

/**
 * Utility to load an image url and convert it to base64 data for jsPDF
 */
async function getBase64ImageFromUrl(imageUrl: string): Promise<string | null> {
  try {
    const res = await fetch(imageUrl);
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.onerror = () => {
        resolve(null);
      };
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.warn('Could not fetch image for PDF embedding:', e);
    return null;
  }
}

/**
 * Generates and downloads a multi-page PDF formatted neatly
 * matching the specifications in Milestone 2: Activity 2.1 & exporters.py
 */
export async function exportComicToPdf(comic: ComicStoryResult): Promise<string> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;

  const timestamp = comic.timestamp || new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
  const filename = `comic_${timestamp}.pdf`;

  // ----------------------------------------------------
  // COVER PAGE: Title & Story Concept
  // ----------------------------------------------------
  // Background styling
  doc.setFillColor(248, 250, 252);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Comic border
  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(1.5);
  doc.rect(margin - 4, margin - 4, contentWidth + 8, pageHeight - margin * 2 + 8);

  // Inner border
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.5);
  doc.rect(margin, margin, contentWidth, pageHeight - margin * 2);

  // Title Banner
  doc.setFillColor(37, 99, 235);
  doc.roundedRect(margin + 5, margin + 20, contentWidth - 10, 32, 3, 3, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('COMICCRAFT PRESENTS', pageWidth / 2, margin + 33, { align: 'center' });

  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  const titleText = comic.title || comic.request.prompt.slice(0, 40);
  doc.text(titleText.toUpperCase(), pageWidth / 2, margin + 44, { align: 'center' });

  // Comic Cover Artwork (Panel 1 or First Available)
  if (comic.layout && comic.layout.length > 0 && comic.layout[0].image_path) {
    const coverBase64 = await getBase64ImageFromUrl(comic.layout[0].image_path);
    if (coverBase64) {
      try {
        const imgY = margin + 62;
        const imgH = 95;
        doc.setDrawColor(15, 23, 42);
        doc.setLineWidth(1);
        doc.rect(margin + 12, imgY - 2, contentWidth - 24, imgH + 4);
        doc.addImage(coverBase64, 'JPEG', margin + 14, imgY, contentWidth - 28, imgH);
      } catch (err) {
        console.warn('Failed to embed cover image:', err);
      }
    }
  }

  // Story Details Box
  const metaY = margin + 170;
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin + 10, metaY, contentWidth - 20, 58, 2, 2, 'F');

  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('STORY PROFILE', margin + 18, metaY + 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Hero: ${comic.request.character_name}`, margin + 18, metaY + 22);
  doc.text(`Setting: ${comic.request.setting.toUpperCase()}`, margin + 18, metaY + 30);
  doc.text(`Tone: ${comic.request.tone.toUpperCase()} | Art Style: ${comic.request.style.toUpperCase()}`, margin + 18, metaY + 38);

  const splitPrompt = doc.splitTextToSize(`Prompt: "${comic.request.prompt}"`, contentWidth - 36);
  doc.text(splitPrompt, margin + 18, metaY + 46);

  // Footer
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('Powered by Google Gemini Models • ComicCraft', pageWidth / 2, pageHeight - margin - 4, { align: 'center' });

  // ----------------------------------------------------
  // CONSECUTIVE PAGES: One page per comic panel
  // Matching layout_builder.py & exporters.py
  // ----------------------------------------------------
  for (let i = 0; i < comic.layout.length; i++) {
    const panel = comic.layout[i];
    doc.addPage();

    // Page frame
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(1);
    doc.rect(margin - 2, margin - 2, contentWidth + 4, pageHeight - margin * 2 + 4);

    // Panel Title Bar
    doc.setFillColor(15, 23, 42);
    doc.rect(margin, margin, contentWidth, 12, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(`PANEL ${panel.panel}: ${panel.title.toUpperCase()}`, pageWidth / 2, margin + 8, {
      align: 'center',
    });

    let currentY = margin + 18;

    // Panel Image
    const imgHeight = 90;
    const imgWidth = contentWidth - 10;
    const imgX = margin + 5;

    if (panel.image_path) {
      const base64Img = await getBase64ImageFromUrl(panel.image_path);
      if (base64Img) {
        try {
          doc.setDrawColor(51, 65, 85);
          doc.setLineWidth(0.8);
          doc.rect(imgX - 1, currentY - 1, imgWidth + 2, imgHeight + 2);
          doc.addImage(base64Img, 'JPEG', imgX, currentY, imgWidth, imgHeight);
        } catch (e) {
          console.warn(`Could not add image for panel ${panel.panel}`, e);
          drawPlaceholderImage(doc, imgX, currentY, imgWidth, imgHeight, panel.panel);
        }
      } else {
        drawPlaceholderImage(doc, imgX, currentY, imgWidth, imgHeight, panel.panel);
      }
    } else {
      drawPlaceholderImage(doc, imgX, currentY, imgWidth, imgHeight, panel.panel);
    }

    currentY += imgHeight + 8;

    // Scene Description in Italics (matching Activity 4.1 & comic_preview.html)
    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    const splitScene = doc.splitTextToSize(panel.scene_description, contentWidth - 8);
    doc.text(splitScene, margin + 4, currentY);
    currentY += splitScene.length * 5 + 4;

    // Caption Box (Yellow/Warm tint comic style)
    if (panel.caption) {
      doc.setFillColor(254, 249, 195);
      doc.setDrawColor(202, 138, 4);
      doc.setLineWidth(0.5);
      const splitCaption = doc.splitTextToSize(`CAPTION: ${panel.caption}`, contentWidth - 16);
      const capHeight = splitCaption.length * 4.5 + 6;
      doc.rect(margin + 4, currentY, contentWidth - 8, capHeight, 'FD');

      doc.setTextColor(113, 63, 18);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.text(splitCaption, margin + 8, currentY + 5);
      currentY += capHeight + 4;
    }

    // Narration & Dialogue Box
    if (panel.narration) {
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);

      const narrationText = `NARRATION: ${panel.narration}`;
      const splitNarration = doc.splitTextToSize(narrationText, contentWidth - 16);
      const narrHeight = splitNarration.length * 4.5 + 6;
      doc.rect(margin + 4, currentY, contentWidth - 8, narrHeight, 'FD');

      doc.setTextColor(30, 41, 59);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.text(splitNarration, margin + 8, currentY + 5);
      currentY += narrHeight + 4;
    }

    // Character Dialogues if any
    if (panel.dialogues && panel.dialogues.length > 0) {
      for (const diag of panel.dialogues) {
        if (currentY + 12 < pageHeight - margin - 15) {
          doc.setTextColor(2, 132, 199);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9);
          const splitDiag = doc.splitTextToSize(`🗨️ ${diag}`, contentWidth - 16);
          doc.text(splitDiag, margin + 8, currentY);
          currentY += splitDiag.length * 4.5 + 2;
        }
      }
    }

    // Image Prompt Reference Box (footer section of the panel)
    const promptY = pageHeight - margin - 22;
    doc.setFillColor(241, 245, 249);
    doc.rect(margin + 4, promptY, contentWidth - 8, 12, 'F');
    doc.setTextColor(100, 116, 139);
    doc.setFont('courier', 'normal');
    doc.setFontSize(7.5);
    const shortPrompt = doc.splitTextToSize(`IMAGE PROMPT: ${panel.image_prompt}`, contentWidth - 16);
    doc.text(shortPrompt.slice(0, 2), margin + 8, promptY + 4);

    // Page Number
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(148, 163, 184);
    doc.text(`Page ${i + 2} of ${comic.layout.length + 1}`, pageWidth / 2, pageHeight - margin + 2, {
      align: 'center',
    });
  }

  // Trigger browser download
  doc.save(filename);
  return filename;
}

function drawPlaceholderImage(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  panelNum: number
) {
  doc.setFillColor(241, 245, 249);
  doc.rect(x, y, w, h, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.rect(x, y, w, h, 'D');

  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(`Comic Illustration - Panel ${panelNum}`, x + w / 2, y + h / 2 - 2, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('(Art rendered by ComicCraft engine)', x + w / 2, y + h / 2 + 6, { align: 'center' });
}
