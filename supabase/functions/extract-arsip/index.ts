import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MODEL = "@cf/llava-hf/llava-1.5-7b-hf";

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

    const cfBaseUrl = `https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/ai/run/${MODEL}`;
    const cfHeaders = {
      "Authorization": `Bearer ${cfApiToken}`,
      "Content-Type": "application/json",
    };

    // Accept multipart form data with an image file
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return new Response(JSON.stringify({ error: "No file uploaded" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Convert file to base64 (chunk-based to avoid stack overflow)
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let base64 = "";
    const chunkSize = 8192;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, i + chunkSize);
      base64 += String.fromCharCode(...chunk);
    }
    base64 = btoa(base64);
    const mimeType = file.type || "image/jpeg";

    // Call Cloudflare Workers AI - Llama 3.2 Vision (free)
    const cfResponse = await fetch(cfBaseUrl, {
      method: "POST",
      headers: cfHeaders,
      body: JSON.stringify({
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Kamu adalah asisten yang mengekstrak metadata dari foto/scan dokumen arsip pemerintah daerah Indonesia.
Dokumen bisa berupa: surat dinas, keputusan, peraturan, nota dinas, laporan, berita acara, MoU, kontrak, SK, proposal, notulen rapat, undangan, disposisi, sertifikat, piagam, SOP, atau dokumen resmi lainnya.

Ekstrak informasi berikut dari gambar dokumen yang diberikan. Jika tidak ditemukan, kosongkan saja ("").

Berikan output dalam format JSON SAJA (tanpa markdown, tanpa penjelasan) dengan field berikut:
{
  "nomorSurat": "nomor dokumen/surat/SK/keputusan lengkap",
  "judul": "perihal/judul/tentang dari dokumen",
  "jenisNaskah": "salah satu dari: Surat Masuk, Surat Keluar, Keputusan, Peraturan, Nota Dinas, Memo, Disposisi, Surat Perintah, Surat Tugas, Surat Perjalanan Dinas, Surat Edaran, Surat Kuasa, Berita Acara, Surat Keterangan, Surat Pengantar, Pengumuman, Laporan, Telaahan Staf, Notula, Surat Undangan, Surat Izin, Rekomendasi, Sertifikat, Piagam, Surat Perjanjian, SOP, Lainnya",
  "tanggalSurat": "tanggal dokumen dalam format YYYY-MM-DD",
  "tahun": angka tahun dokumen (number),
  "deskripsi": "ringkasan singkat isi/substansi dokumen dalam 1-2 kalimat",
  "klasifikasiKeamanan": "salah satu dari: B (Biasa/Terbuka), T (Terbatas), R (Rahasia), SR (Sangat Rahasia) - default B jika tidak ada marking keamanan"
}`
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${base64}`,
                },
              },
            ],
          },
        ],
        max_tokens: 1000,
        temperature: 0.1,
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
    const content = cfData.result?.response || "";

    // Parse the JSON response
    let extractedData;
    try {
      const cleanContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      extractedData = JSON.parse(cleanContent);
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
