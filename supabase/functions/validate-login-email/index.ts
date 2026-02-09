import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ValidateEmailRequest {
  email: string;
}

interface ValidateEmailResponse {
  valid: boolean;
  status: 'active' | 'invited' | 'disabled' | 'not_found';
  message: string;
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email }: ValidateEmailRequest = await req.json();

    if (!email || typeof email !== 'string') {
      return new Response(
        JSON.stringify({ 
          valid: false, 
          status: 'not_found',
          message: '請輸入有效的 Email' 
        } as ValidateEmailResponse),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create Supabase client with service role for bypassing RLS
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Check if email exists in members table (case-insensitive)
    const { data: member, error } = await supabaseAdmin
      .from('members')
      .select('id, status')
      .ilike('email', email.trim())
      .maybeSingle();

    if (error) {
      console.error("Database error:", error);
      return new Response(
        JSON.stringify({ 
          valid: false, 
          status: 'not_found',
          message: '系統錯誤，請稍後再試' 
        } as ValidateEmailResponse),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!member) {
      return new Response(
        JSON.stringify({ 
          valid: false, 
          status: 'not_found',
          message: '此 Email 尚未被邀請加入系統' 
        } as ValidateEmailResponse),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (member.status === 'disabled') {
      return new Response(
        JSON.stringify({ 
          valid: false, 
          status: 'disabled',
          message: '您的帳號已被停用，請聯繫管理員' 
        } as ValidateEmailResponse),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Status is 'active' or 'invited' - allow login
    return new Response(
      JSON.stringify({ 
        valid: true, 
        status: member.status,
        message: '驗證成功' 
      } as ValidateEmailResponse),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ 
        valid: false, 
        status: 'not_found',
        message: '系統錯誤，請稍後再試' 
      } as ValidateEmailResponse),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
