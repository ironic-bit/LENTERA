import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const VISION_MODEL = "@cf/llava-hf/llava-1.5-7b-hf";
const TEXT_MODEL = "@cf/meta/llama-3-8b-instruct";

const EXTRACTION_PROMPT = `Extract metadata from this Indonesian government document (surat dinas, keputusan, peraturan, nota dinas, laporan, berita acara, SK, etc).

Return ONLY valid JSON with these fields:
{
  "nomorSurat": "document number (e.g. 005/123/PUPR/2024)",
  "judul": "subject/perihal/title of the document",
  "jenisNaskah": "one of: Surat Masuk, Surat Keluar, Keputusan, Peraturan, Nota Dinas, Memo, Disposisi, Surat Perintah, Surat Tugas, Surat Edaran, Berita Acara, Surat Keterangan, Pengumuman, Laporan, Notula, Surat Undangan, Surat Izin, Sertifikat, SOP, Lainnya",
  "tanggalSurat": "date in YYYY-MM-DD format",
  "tahun": year as number,
  "deskripsi": "brief description in 1-2 sentences in Indonesian",
  "klasifikasiKeamanan": "one of: B, T, R, SR (default B if unclear)"
}

If a field cannot be determined, use empty string "" (or 0 for tahun). Return ONLY the JSON object, no explanation or markdown.`;

/**
 * Extract raw text from a PDF file using pdf-parse compatible approach.
 * Uses a lightweight PDF text extraction without heavy dependencies.
 */
async function extractTextFromPdf(pdfBytes: Uint8Array): Promise<string> {
  // Decode PDF content streams to extract text
  // This is a lightweight approach that extracts text from PDF without external libraries
  const decoder = new TextDecoder("latin1");
  const rawContent = decoder.decode(pdfBytes);

  const textChunks: string[] = [];

  // Method 1: Extract text between BT...ET blocks (PDF text objects)
  const btEtRegex = /BT\s([\s\S]*?)ET/g;
  let match;
  while ((match = btEtRegex.exec(rawContent)) !== null) {
    const block = match[1];
    // Extract text from Tj, TJ, ' and " operators
    const tjRegex = /\(([^)]*)\)\s*Tj/g;
    let tjMatch;
    while ((tjMatch = tjRegex.exec(block)) !== null) {
      textChunks.push(tjMatch[1]);
    }
    // Extract from TJ arrays
    const tjArrayRegex = /\[([^\]]*)\]\s*TJ/g;
    let tjArrMatch;
    while ((tjArrMatch = tjArrayRegex.exec(block)) !== null) {
      const arrContent = tjArrMatch[1];
      const strRegex = /\(([^)]*)\)/g;
      let strMatch;
      while ((strMatch = strRegex.exec(arrContent)) !== null) {
        textChunks.push(strMatch[1]);
      }
    }
  }

  // Method 2: If BT/ET extraction yields little text, try stream decompression markers
  if (textChunks.join("").trim().length < 50) {
    // Try to find readable text sequences (fallback for encoded PDFs)
    const readableRegex = /[\x20-\x7E\xC0-\xFF]{10,}/g;
    let readableMatch;
    while ((readableMatch = readableRegex.exec(rawContent)) !== null) {
      const text = readableMatch[0].trim();
      // Filter out PDF operators and binary-looking strings
      if (text.length > 15 && !/^[A-Z][a-z]?\s/.test(text) && !/^\d+\s\d+\s(obj|R)/.test(text)) {
        textChunks.push(text);
      }
    }
  }

  let extractedText = textChunks.join(" ")
    // Decode common PDF escape sequences
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\\(/g, "(")
    .replace(/\\\)/g, ")")
    .replace(/\\\\/g, "\\")
    // Clean up multiple spaces
    .replace(/\s+/g, " ")
    .trim();

  // Limit to first ~4000 chars to stay within model context
  if (extractedText.length > 4000) {
    extractedText = extractedText.substring(0, 4000);
  }

  return extractedText;
}

/**
 * Call Cloudflare Workers AI with a text model (Llama 3) for PDF text extraction.
 */
async function extractFromText(
  text: string,
  cfAccountId: string,
  cfApiToken: string
): Promise<Record<string, unknown>> {
  const cfBaseUrl = `https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/ai/run/${TEXT_MODEL}`;

  const response = await fetch(cfBaseUrl, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${cfApiToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messages: [
        {
          role: "system",
          content: "You are a metadata extraction assistant for Indonesian government archives. You ONLY respond with valid JSON. Never include explanations, markdown, or text outside the JSON object.",
        },
        {
          role: "user",
          content: `${EXTRACTION_PROMPT}\n\nDocument text:\n${text}`,
        },
      ],
      max_tokens: 512,
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Cloudflare AI text model error: ${errorText}`);
  }

  const data = await response.json();
  const content = data.result?.response || "";

  // Parse JSON from response
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(`No JSON found in AI response: ${content.substring(0, 200)}`);
  }

  return JSON.parse(jsonMatch[0]);
}

/**
 * Call Cloudflare Workers AI with LLaVA vision model for image extraction.
 */
async function extractFromImage(
  imageBytes: Uint8Array,
  cfAccountId: string,
  cfApiToken: string
): Promise<Record<string, unknown>> {
  const cfBaseUrl = `https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/ai/run/${VISION_MODEL}`;

  const imageArray = Array.from(imageBytes);

  const response = await fetch(cfBaseUrl, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${cfApiToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      image: imageArray,
      prompt: EXTRACTION_PROMPT,
      max_tokens: 512,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Cloudflare AI vision model error: ${errorText}`);
  }

  const data = await response.json();
  const content = data.result?.description || data.result?.response || "";

  // Parse JSON from response
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(`No JSON found in AI response: ${content.substring(0, 200)}`);
  }

  return JSON.parse(jsonMatch[0]);
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const cfAccountId = Deno.env.get("CF_ACCOUNT_ID");
    const cfApiToken = Deno.env.get("CF_API_TOKEN");

    if (!cfAccountId || !cfApiToken) {
      return new Response(JSON.stringify({ error: "Cloudflare credentials not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Accept multipart form data with a file
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return new Response(JSON.stringify({ error: "No file uploaded" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const arrayBuffer = await file.arrayBuffer();
    const fileBytes = new Uint8Array(arrayBuffer);
    const isPdf = file.type === "application/pdf" || file.name?.toLowerCase().endsWith(".pdf");

    let extractedData: Record<string, unknown>;

    if (isPdf) {
      // PDF flow: extract text first, then use text model
      const pdfText = await extractTextFromPdf(fileBytes);

      if (pdfText.length < 20) {
        // If text extraction yields very little, the PDF might be scanned/image-based
        // In that case, we can't process it without OCR
        return new Response(
          JSON.stringify({
            error: "PDF tidak mengandung teks yang bisa diekstrak. Kemungkinan PDF berupa scan/gambar. Coba upload sebagai gambar (screenshot) atau gunakan PDF yang bukan hasil scan.",
            hint: "scanned_pdf",
          }),
          {
            status: 422,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      extractedData = await extractFromText(pdfText, cfAccountId, cfApiToken);
    } else {
      // Image flow: use vision model directly
      extractedData = await extractFromImage(fileBytes, cfAccountId, cfApiToken);
    }

    return new Response(JSON.stringify({ success: true, data: extractedData }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  // deno-lint-ignore no-explicit-any
  } catch (error: any) {
    console.error("Function Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
