import Papa from "papaparse";
import { ArtistProfile, ExportPlatform, SongMetadata } from "../types";

// Helper to trigger browser download
function triggerDownload(content: string, filename: string, mimeType = "text/csv;charset=utf-8;") {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// 1. ASCAP Registration Format
export function generateASCAPRegistrationCSV(songs: SongMetadata[], profile?: ArtistProfile): string {
  const rows: any[] = [];

  for (const song of songs) {
    const writers = song.writers || [];
    const w1 = writers[0] || { name: "", ipi: "", pro: "ASCAP", role: "Composer", writerSplitPercent: 100, publisherName: "", publisherIpi: "", publisherSplitPercent: 100 };
    const w2 = writers[1] || null;
    const w3 = writers[2] || null;

    rows.push({
      "Work Title": song.title.toUpperCase(),
      "Alternative Titles": (song.alternativeTitles || []).join(" / "),
      "ISWC": song.iswc || "",
      "Recording Artist": song.primaryArtist || profile?.artistName || "",
      "ISRC": song.isrc || "",
      "Duration": song.duration || "",
      "Genre": song.genre || "",
      "Writer 1 Name": w1.name,
      "Writer 1 IPI / CAE": w1.ipi || profile?.ipi || "",
      "Writer 1 PRO": w1.pro || "ASCAP",
      "Writer 1 Role": w1.role,
      "Writer 1 Split %": `${w1.writerSplitPercent}%`,
      "Publisher 1 Name": w1.publisherName || profile?.publisher || "Self-Published",
      "Publisher 1 IPI": w1.publisherIpi || "",
      "Publisher 1 Split %": `${w1.publisherSplitPercent}%`,
      "Writer 2 Name": w2 ? w2.name : "",
      "Writer 2 IPI": w2 ? w2.ipi : "",
      "Writer 2 PRO": w2 ? w2.pro : "",
      "Writer 2 Split %": w2 ? `${w2.writerSplitPercent}%` : "",
      "Writer 3 Name": w3 ? w3.name : "",
      "Writer 3 Split %": w3 ? `${w3.writerSplitPercent}%` : "",
      "Release Date": song.releaseDate || "",
      "P-Line Copyright": song.pLine || `(P) ${new Date().getFullYear()} ${song.primaryArtist}`,
      "C-Line Copyright": song.cLine || `(C) ${new Date().getFullYear()} ${song.primaryArtist}`,
    });
  }

  const csv = Papa.unparse(rows);
  return csv;
}

// 2. The MLC (Mechanical Licensing Collective) Bulk Work Registration Format
export function generateMLCRegistrationCSV(songs: SongMetadata[], profile?: ArtistProfile): string {
  const rows: any[] = [];

  for (const song of songs) {
    const writers = song.writers || [];
    
    // In MLC bulk format, if multiple writers exist, each writer can either be expanded or listed with exact mechanical %
    if (writers.length === 0) {
      rows.push({
        "Submitter Work ID": song.id,
        "Work Title": song.title,
        "Alternate Titles": (song.alternativeTitles || []).join("; "),
        "ISWC": song.iswc || "",
        "Writer Full Name": profile?.artistName || song.primaryArtist,
        "Writer IPI Number": profile?.ipi || "",
        "Writer Role": "Author & Composer",
        "Writer Mechanical Share %": "100.00",
        "Performing Rights Org (PRO)": profile?.pro || "ASCAP",
        "Original Publisher Name": profile?.publisher || "Self-Published",
        "Recording Title": song.title,
        "Primary Recording Artist": song.primaryArtist || profile?.artistName || "",
        "Featured Recording Artists": (song.featuredArtists || []).join("; "),
        "Recording ISRC": song.isrc || "",
        "Release Date": song.releaseDate || "",
        "Recording Duration": song.duration || "",
        "Label / Distributor": song.labelOrDistributor || profile?.distributor || "Independent",
      });
    } else {
      writers.forEach((w, index) => {
        rows.push({
          "Submitter Work ID": `${song.id}_W${index + 1}`,
          "Work Title": song.title,
          "Alternate Titles": (song.alternativeTitles || []).join("; "),
          "ISWC": song.iswc || "",
          "Writer Full Name": w.name,
          "Writer IPI Number": w.ipi || (index === 0 ? profile?.ipi : "") || "",
          "Writer Role": w.role || "Composer",
          "Writer Mechanical Share %": (w.writerSplitPercent || 0).toFixed(2),
          "Performing Rights Org (PRO)": w.pro || profile?.pro || "ASCAP",
          "Original Publisher Name": w.publisherName || profile?.publisher || "Self-Published",
          "Publisher Mechanical Share %": (w.publisherSplitPercent || 0).toFixed(2),
          "Recording Title": song.title,
          "Primary Recording Artist": song.primaryArtist || profile?.artistName || "",
          "Featured Recording Artists": (song.featuredArtists || []).join("; "),
          "Recording ISRC": song.isrc || "",
          "Release Date": song.releaseDate || "",
          "Recording Duration": song.duration || "",
          "Label / Distributor": song.labelOrDistributor || profile?.distributor || "Independent",
        });
      });
    }
  }

  return Papa.unparse(rows);
}

// 3. SoundExchange Sound Recording / ISRC Registration Format
export function generateSoundExchangeRegistrationCSV(songs: SongMetadata[], profile?: ArtistProfile): string {
  const rows: any[] = [];

  for (const song of songs) {
    rows.push({
      "Submitter Track ID": song.id,
      "Sound Recording Title": song.title,
      "Featured Artist": song.primaryArtist || profile?.artistName || "",
      "Non-Featured / Session Artists": (song.featuredArtists || []).join(", "),
      "ISRC": song.isrc || "",
      "Year of Recording": song.releaseDate ? song.releaseDate.split("-")[0] : new Date().getFullYear().toString(),
      "Track Duration (MM:SS)": song.duration || "",
      "P-Line (Master Sound Recording Owner)": song.pLine || `(P) ${new Date().getFullYear()} ${song.primaryArtist || profile?.artistName}`,
      "Release Label / Distributor": song.labelOrDistributor || profile?.distributor || "Independent",
      "UPC / EAN Barcode": song.upc || "",
      "Genre": song.genre || profile?.genre || "Indie",
      "Language": song.language || "English",
      "Explicit": song.explicit ? "Yes" : "No",
    });
  }

  return Papa.unparse(rows);
}

// 4. BMI Work Registration Format
export function generateBMIRegistrationCSV(songs: SongMetadata[], profile?: ArtistProfile): string {
  const rows: any[] = [];

  for (const song of songs) {
    const writers = song.writers || [];
    const w1 = writers[0] || { name: profile?.artistName || "", ipi: profile?.ipi || "", pro: "BMI", role: "Composer", writerSplitPercent: 100, publisherName: profile?.publisher || "Self-Published", publisherIpi: "", publisherSplitPercent: 100 };
    const w2 = writers[1] || null;

    rows.push({
      "Title": song.title,
      "Alternate Title": (song.alternativeTitles || []).join(" / "),
      "ISWC": song.iswc || "",
      "Recording Artist": song.primaryArtist || profile?.artistName || "",
      "ISRC": song.isrc || "",
      "Composer / Author 1": w1.name,
      "CAE / IPI #": w1.ipi || profile?.ipi || "",
      "Affiliation": w1.pro || "BMI",
      "Writer Split %": `${w1.writerSplitPercent}%`,
      "Publisher 1 Name": w1.publisherName || profile?.publisher || "Self-Published",
      "Publisher IPI #": w1.publisherIpi || "",
      "Publisher Split %": `${w1.publisherSplitPercent}%`,
      "Composer / Author 2": w2 ? w2.name : "",
      "Writer 2 CAE/IPI": w2 ? w2.ipi : "",
      "Writer 2 Affiliation": w2 ? w2.pro : "",
      "Writer 2 Split %": w2 ? `${w2.writerSplitPercent}%` : "",
      "Release Date": song.releaseDate || "",
      "Duration": song.duration || "",
    });
  }

  return Papa.unparse(rows);
}

// 5. Full Catalogue Master CSV
export function generateFullCatalogueCSV(songs: SongMetadata[]): string {
  const flattened = songs.map((s) => ({
    "Song ID": s.id,
    "Title": s.title,
    "Alternative Titles": (s.alternativeTitles || []).join(", "),
    "Primary Artist": s.primaryArtist,
    "Featured Artists": (s.featuredArtists || []).join(", "),
    "ISRC": s.isrc,
    "ISWC": s.iswc,
    "UPC": s.upc,
    "Release Date": s.releaseDate,
    "Duration": s.duration,
    "Genre": s.genre,
    "Label / Distributor": s.labelOrDistributor,
    "P-Line": s.pLine,
    "C-Line": s.cLine,
    "Explicit": s.explicit ? "TRUE" : "FALSE",
    "Writers Count": s.writers?.length || 0,
    "Writers Summary": (s.writers || [])
      .map((w) => `${w.name} (${w.role}, ${w.pro || "PRO"}, ${w.writerSplitPercent}%)`)
      .join(" | "),
    "Total Streams": (s.streams || []).reduce((acc, curr) => acc + (curr.streamCount || 0), 0),
    "Total Earnings USD": s.totalEarnings || 0,
    "Notes": s.notes || "",
    "Last Updated": s.updatedAt,
  }));

  return Papa.unparse(flattened);
}

// 6. Generate Printable Split Agreement Document (HTML)
export function generateSongSplitAgreementHTML(song: SongMetadata, profile?: ArtistProfile): string {
  const writers = song.writers || [];
  const dateStr = song.releaseDate || new Date().toLocaleDateString();

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Songwriter Split Sheet Agreement - ${song.title}</title>
  <style>
    body { font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif; line-height: 1.6; color: #1e293b; max-width: 800px; margin: 40px auto; padding: 0 20px; }
    h1 { font-size: 24px; border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin-bottom: 4px; }
    .subtitle { color: #64748b; font-size: 14px; margin-bottom: 24px; }
    .meta-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 24px; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .meta-item strong { display: block; font-size: 11px; text-transform: uppercase; color: #64748b; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    th, td { border: 1px solid #cbd5e1; padding: 10px 12px; text-align: left; font-size: 13px; }
    th { background: #f1f5f9; font-weight: 600; }
    .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 40px; }
    .sig-line { border-bottom: 1px solid #0f172a; height: 40px; margin-bottom: 8px; }
    .legal-text { font-size: 11px; color: #64748b; line-height: 1.5; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 16px; }
  </style>
</head>
<body>
  <h1>Official Songwriter Split Sheet Agreement</h1>
  <div class="subtitle">Legally Binding Independent Musical Work & Master Rights Allocation</div>

  <div class="meta-box">
    <div class="meta-item"><strong>Musical Work Title</strong> ${song.title}</div>
    <div class="meta-item"><strong>Primary Recording Artist</strong> ${song.primaryArtist || profile?.artistName || "Independent Artist"}</div>
    <div class="meta-item"><strong>ISRC (Sound Recording)</strong> ${song.isrc || "Pending / Unassigned"}</div>
    <div class="meta-item"><strong>ISWC (Composition Work)</strong> ${song.iswc || "Pending / Unassigned"}</div>
    <div class="meta-item"><strong>Effective Agreement Date</strong> ${dateStr}</div>
    <div class="meta-item"><strong>Genre & Duration</strong> ${song.genre || "Indie"} (${song.duration || "N/A"})</div>
  </div>

  <h2>Songwriter & Publisher Ownership Allocation</h2>
  <table>
    <thead>
      <tr>
        <th>Writer Full Legal Name</th>
        <th>Role / Contribution</th>
        <th>PRO Affiliation</th>
        <th>IPI / CAE #</th>
        <th>Writer Share %</th>
        <th>Publishing Entity</th>
        <th>Publisher Share %</th>
      </tr>
    </thead>
    <tbody>
      ${
        writers.length > 0
          ? writers
              .map(
                (w) => `
        <tr>
          <td><strong>${w.name}</strong></td>
          <td>${w.role}</td>
          <td>${w.pro}</td>
          <td>${w.ipi || "N/A"}</td>
          <td><strong>${w.writerSplitPercent}%</strong></td>
          <td>${w.publisherName || "Self-Published"}</td>
          <td><strong>${w.publisherSplitPercent}%</strong></td>
        </tr>
      `
              )
              .join("")
          : `<tr><td colspan="7" style="text-align: center; color: #64748b;">No co-writers registered. 100% sole author ownership.</td></tr>`
      }
    </tbody>
  </table>

  <h2>Warranties & Agreement Clauses</h2>
  <div class="legal-text">
    <p>1. <strong>Originality of Material:</strong> Each co-writer warrants that their respective contributions (music, melodies, lyrics, or production elements) are original and do not infringe upon any third-party copyrights or existing works.</p>
    <p>2. <strong>Master & Composition Rights:</strong> The ownership shares specified above represent the agreed-upon division of both Musical Composition (mechanical, performance, sync) and Sound Recording master rights unless superseded by a separate Recording Agreement.</p>
    <p>3. <strong>Registration Authorization:</strong> All parties grant mutual authorization to submit this metadata to respective Performance Rights Organizations (ASCAP, BMI, SESAC, PRS, SOCAN), The Mechanical Licensing Collective (The MLC), and SoundExchange.</p>
  </div>

  <div class="signatures">
    ${
      writers.length > 0
        ? writers
            .map(
              (w) => `
      <div>
        <div class="sig-line"></div>
        <strong>${w.name}</strong> (${w.role})<br>
        <span style="font-size: 12px; color: #64748b;">Date: _______________</span>
      </div>
    `
            )
            .join("")
        : `
      <div>
        <div class="sig-line"></div>
        <strong>${profile?.artistName || song.primaryArtist}</strong> (Author / Composer)<br>
        <span style="font-size: 12px; color: #64748b;">Date: _______________</span>
      </div>
    `
    }
  </div>
</body>
</html>
  `;
}

// Master Dispatcher for Platform Downloads
export function exportPlatformData(
  platform: ExportPlatform,
  songs: SongMetadata[],
  profile?: ArtistProfile
): void {
  if (!songs || songs.length === 0) {
    alert("No songs available to export. Please add at least one track to your catalogue.");
    return;
  }

  const cleanArtistName = (profile?.artistName || "IndieArtist").replace(/[^a-zA-Z0-9_-]/g, "_");
  const timestamp = new Date().toISOString().slice(0, 10);

  switch (platform) {
    case "ASCAP": {
      const csv = generateASCAPRegistrationCSV(songs, profile);
      triggerDownload(csv, `${cleanArtistName}_ASCAP_Work_Registration_${timestamp}.csv`);
      break;
    }
    case "MLC": {
      const csv = generateMLCRegistrationCSV(songs, profile);
      triggerDownload(csv, `${cleanArtistName}_TheMLC_Bulk_Work_Registration_${timestamp}.csv`);
      break;
    }
    case "SOUNDEXCHANGE": {
      const csv = generateSoundExchangeRegistrationCSV(songs, profile);
      triggerDownload(csv, `${cleanArtistName}_SoundExchange_ISRC_Registration_${timestamp}.csv`);
      break;
    }
    case "BMI": {
      const csv = generateBMIRegistrationCSV(songs, profile);
      triggerDownload(csv, `${cleanArtistName}_BMI_Work_Registration_${timestamp}.csv`);
      break;
    }
    case "SONGSPLIT": {
      const firstSong = songs[0];
      const html = generateSongSplitAgreementHTML(firstSong, profile);
      triggerDownload(html, `${cleanArtistName}_${firstSong.title.replace(/\s+/g, "_")}_Split_Agreement.html`, "text/html;charset=utf-8;");
      break;
    }
    case "FULL_CATALOGUE_CSV":
    default: {
      const csv = generateFullCatalogueCSV(songs);
      triggerDownload(csv, `${cleanArtistName}_Master_Music_Catalogue_${timestamp}.csv`);
      break;
    }
  }
}
