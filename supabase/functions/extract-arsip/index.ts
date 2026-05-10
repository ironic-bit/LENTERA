import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiApiKey) {
      return new Response(JSON.stringify({ error: "GEMINI_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Accept multipart form data with an image file
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return new Response(JSON.stringify({ error: "No file uploaded" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Convert file to base64
    const arrayBuffer = await file.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    const mimeType = file.type || "image/jpeg";

    // Call Google Gemini API (free tier: 15 req/min, 1500/day)
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
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
                  inlineData: {
                    mimeType: mimeType,
                    data: base64,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 1000,
          },
        }),
      }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error("Gemini API Error:", errorText);
      return new Response(JSON.stringify({ error: "AI processing failed", details: errorText }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const geminiData = await geminiResponse.json();
    const content = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Parse the JSON response from Gemini
    let extractedData;
    try {
      // Remove markdown code fences if present
      const cleanContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      extractedData = JSON.parse(cleanContent);
    } catch {
      console.error("Failed to parse Gemini response:", content);
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
