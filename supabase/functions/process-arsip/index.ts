import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ─── Google Auth: Generate access token from service account ─────────────────
async function getGoogleAccessToken(email: string, privateKey: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: email,
    scope: "https://www.googleapis.com/auth/drive",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  // Base64url encode
  const encode = (obj: unknown) =>
    btoa(JSON.stringify(obj)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  const headerB64 = encode(header);
  const payloadB64 = encode(payload);
  const unsignedToken = `${headerB64}.${payloadB64}`;

  // Import private key and sign
  const keyData = privateKey
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\\n/g, "")
    .replace(/\n/g, "")
    .trim();

  const binaryKey = Uint8Array.from(atob(keyData), (c) => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    new TextEncoder().encode(unsignedToken)
  );

  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const jwt = `${unsignedToken}.${signatureB64}`;

  // Exchange JWT for access token
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  const tokenData = await tokenResponse.json();
  if (!tokenData.access_token) {
    throw new Error(`Failed to get Google access token: ${JSON.stringify(tokenData)}`);
  }

  return tokenData.access_token;
}

// ─── Google Drive: Find or create a folder ───────────────────────────────────
async function findOrCreateFolder(
  token: string,
  name: string,
  parentId: string
): Promise<string> {
  // Search for existing folder
  const query = `name='${name}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)`;

  const searchRes = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const searchData = await searchRes.json();

  if (searchData.files && searchData.files.length > 0) {
    return searchData.files[0].id;
  }

  // Create new folder
  const createRes = await fetch("https://www.googleapis.com/drive/v3/files", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentId],
    }),
  });

  const createData = await createRes.json();
  if (!createData.id) {
    throw new Error(`Failed to create folder '${name}': ${JSON.stringify(createData)}`);
  }

  return createData.id;
}

// ─── Google Drive: Upload file ───────────────────────────────────────────────
async function uploadFileToDrive(
  token: string,
  fileName: string,
  fileBytes: Uint8Array,
  mimeType: string,
  folderId: string
): Promise<{ fileId: string; webViewLink: string }> {
  const metadata = {
    name: fileName,
    parents: [folderId],
  };

  // Multipart upload
  const boundary = "lentera_upload_boundary";
  const metadataPart = JSON.stringify(metadata);

  const body = new Uint8Array(
    await new Blob([
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadataPart}\r\n`,
      `--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`,
      fileBytes,
      `\r\n--${boundary}--`,
    ]).arrayBuffer()
  );

  const uploadRes = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body,
    }
  );

  const uploadData = await uploadRes.json();
  if (!uploadData.id) {
    throw new Error(`Failed to upload file: ${JSON.stringify(uploadData)}`);
  }

  // Make file accessible via link
  await fetch(`https://www.googleapis.com/drive/v3/files/${uploadData.id}/permissions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ role: "reader", type: "anyone" }),
  });

  return {
    fileId: uploadData.id,
    webViewLink: uploadData.webViewLink || `https://drive.google.com/file/d/${uploadData.id}/view`,
  };
}

// ─── Google Drive: Create folder structure and upload ─────────────────────────
async function uploadToGoogleDrive(
  token: string,
  rootFolderId: string,
  file: { name: string; bytes: Uint8Array; mimeType: string },
  metadata: { tahun: number; opd: string; statusArsip: string; kategori: string; kodeKlasifikasi: string }
): Promise<{ fileId: string; webViewLink: string }> {
  // Create folder structure: LENTERA/{tahun}/{opd}/{statusArsip}/{kategori}/{kodeKlasifikasi}/
  const tahunFolder = await findOrCreateFolder(token, String(metadata.tahun || new Date().getFullYear()), rootFolderId);
  const opdFolder = await findOrCreateFolder(token, metadata.opd || "Umum", tahunFolder);
  const statusFolder = await findOrCreateFolder(token, `Arsip-${metadata.statusArsip || "Aktif"}`, opdFolder);
  const kategoriFolder = await findOrCreateFolder(token, metadata.kategori || "Umum", statusFolder);
  const kodeFolder = await findOrCreateFolder(token, metadata.kodeKlasifikasi || "000", kategoriFolder);

  // Upload file to the final folder
  return await uploadFileToDrive(token, file.name, file.bytes, file.mimeType, kodeFolder);
}

// ─── Gemini: Extract metadata from document ──────────────────────────────────
async function geminiExtractMetadata(
  apiKey: string,
  fileBase64: string,
  mimeType: string
): Promise<Record<string, unknown>> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  const prompt = `Kamu adalah arsiparis profesional Dinas PUPR Kota Sungai Penuh yang memahami:
- Perwako No 49/2022 tentang Klasifikasi Arsip
- Perwako No 31/2023 tentang Tata Naskah Dinas
- Perwako No 11/2025 tentang Jadwal Retensi Arsip

Ekstrak metadata dari dokumen ini. Return HANYA JSON valid dengan field berikut:
{
  "nomorSurat": "nomor surat/naskah (e.g. 005/123/PUPR/2024)",
  "judul": "judul/perihal dokumen",
  "jenisNaskah": "salah satu: Surat Masuk, Surat Keluar, Keputusan, Peraturan, Nota Dinas, Memo, Disposisi, Surat Perintah, Surat Tugas, Surat Perjalanan Dinas, Surat Edaran, Surat Kuasa, Berita Acara, Surat Keterangan, Surat Pengantar, Pengumuman, Laporan, Telaahan Staf, Notula, Surat Undangan, Surat Izin, Rekomendasi, Sertifikat, Piagam, Surat Perjanjian, SOP, Lainnya",
  "tanggalSurat": "tanggal dalam format YYYY-MM-DD",
  "tahun": tahun sebagai number,
  "deskripsi": "deskripsi singkat 1-2 kalimat dalam Bahasa Indonesia",
  "klasifikasiKeamanan": "salah satu: B, T, R, SR (default B jika tidak jelas)"
}

Jika field tidak bisa ditentukan, gunakan string kosong "" (atau 0 untuk tahun).
Return HANYA JSON object, tanpa penjelasan atau markdown.`;

  const body = {
    contents: [
      {
        parts: [
          {
            inline_data: {
              mime_type: mimeType,
              data: fileBase64,
            },
          },
          { text: prompt },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 1024,
    },
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${errText}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

  // Parse JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(`No JSON found in Gemini response: ${text.substring(0, 300)}`);
  }

  return JSON.parse(jsonMatch[0]);
}

// ─── Gemini: Classify kode klasifikasi (Step 2 - focused) ────────────────────
async function geminiClassifyKode(
  apiKey: string,
  judul: string,
  deskripsi: string,
  jenisNaskah: string
): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  const prompt = `Kamu adalah arsiparis Kota Sungai Penuh. Berdasarkan informasi dokumen berikut, tentukan KODE KLASIFIKASI yang paling tepat sesuai Perwako No 49/2022.

Informasi dokumen:
- Judul: ${judul}
- Deskripsi: ${deskripsi}
- Jenis Naskah: ${jenisNaskah}

Daftar Kode Klasifikasi utama:
000 - UMUM (Ketatausahaan, Perlengkapan, Pengadaan, Perpustakaan, Kearsipan, Persandian, Perencanaan, Organisasi, Penelitian)
000.1 - Ketatausahaan (Telekomunikasi, Perjalanan Dinas, Fasilitas, Rapat, Kendaraan, Gedung, dll)
000.2 - Perlengkapan (Inventaris, Pemeliharaan, Distribusi, Penghapusan BMD)
000.3 - Pengadaan (Rencana, Langsung, Lelang, Swakelola)
000.4 - Perpustakaan
000.5 - Kearsipan
000.6 - Persandian
000.7 - Perencanaan Pembangunan (Musrenbang, RPJMD, RKPD)
000.8 - Organisasi dan Tata Laksana (SOTK, Tupoksi, Reformasi Birokrasi)
000.9 - Penelitian dan Pengembangan
100 - PEMERINTAHAN
100.1 - Otonomi Daerah (LKPJ, LPPD, Pilkada)
100.2 - Pemerintahan Umum (Dekonsentrasi, Kerjasama, Perbatasan)
100.3 - Hukum (Perda, SK, MoU, Perijinan, Sengketa)
200 - POLITIK
200.1 - Kesatuan Bangsa (Ideologi, Wawasan Kebangsaan)
200.2 - Pemilu
300 - KEAMANAN DAN KETERTIBAN
300.1 - Satpol PP (Linmas, PPNS, HAM)
300.2 - Penanggulangan Bencana (BPBD, SAR)
400 - KESEJAHTERAAN RAKYAT
400.1 - Pembangunan Daerah Tertinggal
400.2 - Pemberdayaan Perempuan dan Perlindungan Anak
400.3 - Pendidikan (PAUD, SD, SMP, SMA, Guru)
400.4 - Keolahragaan
400.5 - Kepemudaan
400.6 - Kebudayaan
400.7 - Kesehatan
400.8 - Agama
400.9 - Sosial
400.10 - Pemberdayaan Masyarakat Desa
400.11 - Pertamanan dan Pemakaman
400.12 - Kependudukan dan Catatan Sipil
400.13 - Keluarga Berencana
400.14 - Hubungan Masyarakat
500 - PEREKONOMIAN
500.1-500.18 (Pangan, Perdagangan, Koperasi, Kehutanan, Perikanan, Pertanian, Peternakan, Perkebunan, Industri, ESDM, Perhubungan, Kominfo, Pariwisata, Statistik, Ketenagakerjaan, Penanaman Modal, Pertanahan, Transmigrasi)
600 - PEKERJAAN UMUM
600.1 - Pekerjaan Umum (SDA, Jalan, Jembatan, Air Minum, Permukiman)
600.2 - Perumahan Rakyat (Rusun, Konstruksi, Kawasan)
600.3 - Tata Ruang (RTRW, Pemetaan)
600.4 - Lingkungan Hidup (AMDAL, Limbah, Sampah, Iklim)
700 - PENGAWASAN (Internal, Inspektorat)
800 - KEPEGAWAIAN
800.1 - SDM (Formasi, Mutasi, Karir, Disiplin, Pensiun)
800.2 - Pendidikan dan Pelatihan (Diklat)
900 - KEUANGAN
900.1 - Keuangan Daerah (APBD, Anggaran, Pajak, Retribusi)

Untuk Dinas PUPR, kemungkinan besar kode 600.x (Pekerjaan Umum). Tapi tetap analisis berdasarkan isi dokumen.

Return HANYA kode klasifikasi yang paling spesifik (e.g. "600.1.8" bukan "600"). Jika tidak yakin, return kode parent terdekat. Return HANYA kode, tanpa penjelasan.`;

  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.1, maxOutputTokens: 50 },
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    return "";
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

  // Extract just the code (e.g. "600.1.8")
  const codeMatch = text.trim().match(/^\d{3}(\.\d+)*/);
  return codeMatch ? codeMatch[0] : "";
}

// ─── Determine category name from kode klasifikasi ───────────────────────────
function getKategoriFromKode(kode: string): string {
  const prefix = kode.split(".")[0];
  const kategoriMap: Record<string, string> = {
    "000": "Umum",
    "100": "Pemerintahan",
    "200": "Politik",
    "300": "Keamanan-Ketertiban",
    "400": "Kesejahteraan-Rakyat",
    "500": "Perekonomian",
    "600": "Pekerjaan-Umum",
    "700": "Pengawasan",
    "800": "Kepegawaian",
    "900": "Keuangan",
  };
  return kategoriMap[prefix] || "Umum";
}

// ─── Main Handler ────────────────────────────────────────────────────────────
serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get environment variables
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    const googleEmail = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_EMAIL");
    const googlePrivateKey = Deno.env.get("GOOGLE_PRIVATE_KEY");
    const driveRootFolderId = Deno.env.get("GOOGLE_DRIVE_ROOT_FOLDER_ID");

    if (!geminiApiKey) {
      return new Response(JSON.stringify({ error: "GEMINI_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse multipart form data
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const opd = (formData.get("opd") as string) || "Dinas-PUPR";

    if (!file) {
      return new Response(JSON.stringify({ error: "No file uploaded" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Convert file to base64 for Gemini (chunked to avoid stack overflow)
    const fileBytes = new Uint8Array(await file.arrayBuffer());
    let binary = "";
    const chunkSize = 8192;
    for (let i = 0; i < fileBytes.length; i += chunkSize) {
      const chunk = fileBytes.subarray(i, i + chunkSize);
      binary += String.fromCharCode(...chunk);
    }
    const fileBase64 = btoa(binary);

    // ─── Step 1: Gemini Extract Metadata ───────────────────────────────────
    const extracted = await geminiExtractMetadata(geminiApiKey, fileBase64, file.type);

    // ─── Step 2: Gemini Classify Kode (focused, using extracted metadata) ──
    const judul = (extracted.judul as string) || "";
    const deskripsi = (extracted.deskripsi as string) || "";
    const jenisNaskah = (extracted.jenisNaskah as string) || "";

    const kodeKlasifikasi = await geminiClassifyKode(geminiApiKey, judul, deskripsi, jenisNaskah);

    // ─── Step 3: Upload to Google Drive (if credentials available) ─────────
    let driveLink = "";
    let driveFileId = "";

    if (googleEmail && googlePrivateKey && driveRootFolderId) {
      try {
        const accessToken = await getGoogleAccessToken(googleEmail, googlePrivateKey);

        const kategori = getKategoriFromKode(kodeKlasifikasi);
        const tahun = (extracted.tahun as number) || new Date().getFullYear();

        const driveResult = await uploadToGoogleDrive(
          accessToken,
          driveRootFolderId,
          { name: file.name, bytes: fileBytes, mimeType: file.type },
          {
            tahun,
            opd,
            statusArsip: "Aktif",
            kategori,
            kodeKlasifikasi: kodeKlasifikasi || "000",
          }
        );

        driveLink = driveResult.webViewLink;
        driveFileId = driveResult.fileId;
      } catch (driveErr) {
        console.error("Google Drive upload failed:", driveErr);
        // Continue without Drive — not a fatal error
      }
    }

    // ─── Return Result ─────────────────────────────────────────────────────
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          ...extracted,
          kodeKlasifikasi,
          linkCloud: driveLink,
          driveFileId,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  // deno-lint-ignore no-explicit-any
  } catch (error: any) {
    console.error("Process Arsip Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
