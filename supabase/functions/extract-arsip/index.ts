import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const VISION_MODEL = "@cf/llava-hf/llava-1.5-7b-hf";

const EXTRACTION_PROMPT = `Extract metadata from this document image. The document is an Indonesian government archive (surat dinas, keputusan, peraturan, nota dinas, laporan, berita acara, SK, etc).

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

    const cfBaseUrl = `https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/ai/run/${VISION_MODEL}`;

    // Accept multipart form data with an image file
    // NOTE: PDF conversion is handled on the frontend before upload.
    // This function always receives an image (PNG/JPG/WebP/GIF).
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return new Response(JSON.stringify({ error: "No file uploaded" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Convert file to raw bytes array (LLaVA expects image as number array)
    const arrayBuffer = await file.arrayBuffer();
    const imageArray = Array.from(new Uint8Array(arrayBuffer));

    // Call Cloudflare Workers AI - LLaVA 1.5 7B (vision model)
    const cfResponse = await fetch(cfBaseUrl, {
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

    if (!cfResponse.ok) {
      const errorText = await cfResponse.text();
      console.error("Cloudflare AI Error:", errorText);
      return new Response(JSON.stringify({ error: "AI processing failed", details: errorText }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cfData = await cfResponse.json();
    const content = cfData.result?.description || cfData.result?.response || "";

    // Parse the JSON response
    let extractedData;
    try {
      // Try to find JSON in the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extractedData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch {
      console.error("Failed to parse AI response:", content);
      return new Response(JSON.stringify({ error: "Failed to parse AI response", raw: content }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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
