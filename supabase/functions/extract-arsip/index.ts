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
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      return new Response(JSON.stringify({ error: "OPENAI_API_KEY not configured" }), {
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

    // Call OpenAI Vision API
    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Kamu adalah asisten yang mengekstrak metadata dari foto/scan surat dinas Indonesia.
Ekstrak informasi berikut dari gambar surat yang diberikan. Jika tidak ditemukan, kosongkan saja ("").

Berikan output dalam format JSON SAJA (tanpa markdown, tanpa penjelasan) dengan field berikut:
{
  "nomorSurat": "nomor surat lengkap",
  "judul": "perihal/judul surat",
  "jenisNaskah": "salah satu dari: Surat Masuk, Surat Keluar, Keputusan, Peraturan, Nota Dinas, Memo, Disposisi, Surat Perintah, Surat Tugas, Surat Perjalanan Dinas, Surat Edaran, Surat Kuasa, Berita Acara, Surat Keterangan, Surat Pengantar, Pengumuman, Laporan, Telaahan Staf, Notula, Surat Undangan, Surat Izin, Rekomendasi, Sertifikat, Piagam, Surat Perjanjian, SOP, Lainnya",
  "tanggalSurat": "format YYYY-MM-DD",
  "tahun": angka tahun (number),
  "deskripsi": "ringkasan singkat isi surat dalam 1-2 kalimat",
  "klasifikasiKeamanan": "salah satu dari: B, T, R, SR (default B jika tidak jelas)"
}`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Ekstrak metadata dari surat/dokumen berikut:"
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${base64}`,
                  detail: "high"
                }
              }
            ]
          }
        ],
        max_tokens: 1000,
        temperature: 0.1,
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error("OpenAI API Error:", errorText);
      return new Response(JSON.stringify({ error: "AI processing failed", details: errorText }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const openaiData = await openaiResponse.json();
    const content = openaiData.choices?.[0]?.message?.content || "";

    // Parse the JSON response from OpenAI
    let extractedData;
    try {
      // Remove markdown code fences if present
      const cleanContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      extractedData = JSON.parse(cleanContent);
    } catch {
      console.error("Failed to parse OpenAI response:", content);
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
