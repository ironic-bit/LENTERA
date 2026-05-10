import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.40.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Verify the caller is an Admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: callerUser }, error: verifyError } = await supabaseAdmin.auth.getUser(token);

    if (verifyError || !callerUser) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check caller's role in profiles
    const { data: callerProfile, error: profileCheckError } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", callerUser.id)
      .single();

    if (profileCheckError || callerProfile?.role !== "admin") {
      return new Response(JSON.stringify({ error: "Unauthorized: Admins only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse request body
    const requestData = await req.json();
    const { userId, email, password, username, nama, role, aksesKlasifikasi, statusAktif } = requestData;

    if (!userId) {
      return new Response(JSON.stringify({ error: "Missing required field: userId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Update auth user (email and/or password) if provided
    const authUpdates: Record<string, unknown> = {};
    if (email) authUpdates.email = email;
    if (password) authUpdates.password = password;

    if (Object.keys(authUpdates).length > 0) {
      const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        authUpdates
      );

      if (authUpdateError) {
        console.error("Auth Update Error:", authUpdateError);
        return new Response(JSON.stringify({ error: authUpdateError.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // 2. Update the profiles table
    const profileUpdates: Record<string, unknown> = {};
    if (email !== undefined) profileUpdates.email = email;
    if (username !== undefined) profileUpdates.username = username;
    if (nama !== undefined) profileUpdates.nama = nama;
    if (role !== undefined) profileUpdates.role = role;
    if (aksesKlasifikasi !== undefined) profileUpdates.akses_klasifikasi = aksesKlasifikasi;
    if (statusAktif !== undefined) profileUpdates.status_aktif = statusAktif;

    if (Object.keys(profileUpdates).length > 0) {
      const { error: profileUpdateError } = await supabaseAdmin
        .from("profiles")
        .update(profileUpdates)
        .eq("id", userId);

      if (profileUpdateError) {
        console.error("Profile Update Error:", profileUpdateError);
        return new Response(JSON.stringify({ error: profileUpdateError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Function Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
