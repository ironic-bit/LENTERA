import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.40.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // Handle CORS options request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    // IMPORTANT: We use the SERVICE_ROLE_KEY to bypass RLS and create users safely.
    // This key is automatically injected by Supabase into edge functions.
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Verify the caller is an Admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user: callerUser }, error: verifyError } = await supabaseAdmin.auth.getUser(token);

    if (verifyError || !callerUser) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check caller's role in profiles
    const { data: callerProfile, error: profileCheckError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', callerUser.id)
      .single();

    if (profileCheckError || callerProfile?.role !== 'admin') {
      return new Response(JSON.stringify({ error: "Unauthorized: Admins only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Parse Request Body
    const requestData = await req.json();
    const { email, password, username, nama, role, aksesKlasifikasi, statusAktif } = requestData;

    if (!email || !password || !username || !nama) {
      throw new Error("Missing required user fields.");
    }

    // 2. Create User using Auth Admin API
    const { data: userData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Auto confirm so they can login immediately
    });

    if (authError) {
      console.error("Auth Admin Error:", authError);
      return new Response(JSON.stringify({ error: authError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = userData.user.id;

    // 3. Update the `profiles` table to set the custom fields
    // Because the trigger might have already created a row, we use upsert (or update)
    const { error: profileError } = await supabaseAdmin.from("profiles").upsert({
      id: userId,
      email: email,
      username: username,
      nama: nama,
      role: role || "viewer",
      akses_klasifikasi: aksesKlasifikasi || ["B"],
      status_aktif: statusAktif ?? true,
    }, { onConflict: 'id' });

    if (profileError) {
      console.error("Profile Upsert Error:", profileError);
      // We do not delete the auth user here as it might be complex, but ideally you'd handle rollback.
      return new Response(JSON.stringify({ error: profileError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, user: userData.user }), {
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
