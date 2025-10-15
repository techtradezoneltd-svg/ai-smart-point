import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WhatsAppMessage {
  phone: string;
  title: string;
  message: string;
  type: 'alert' | 'daily_report' | 'shop_status' | 'query_response';
  reportUrl?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone, title, message, type, reportUrl }: WhatsAppMessage = await req.json();
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get WhatsApp settings from database
    const { data: settingsData, error: settingsError } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'integrations')
      .single();

    if (settingsError) {
      console.error('Error fetching integration settings:', settingsError);
    }

    const integrationSettings = settingsData?.value || {};
    const whatsappToken = integrationSettings.whatsappApiToken || Deno.env.get('WHATSAPP_API_TOKEN');
    const phoneNumberId = integrationSettings.whatsappPhoneNumberId || 'YOUR_PHONE_NUMBER_ID';

    if (!whatsappToken) {
      throw new Error('WhatsApp API token not configured. Please add it in Settings > Integrations.');
    }

    console.log('Sending WhatsApp notification:', { phone, title, type });

    // Format message based on type
    let formattedMessage = '';
    
    switch (type) {
      case 'shop_status':
        formattedMessage = `${message}\n\n🤖 AI POS System`;
        break;
      case 'daily_report':
        formattedMessage = `📊 *${title}*\n\n${message}`;
        if (reportUrl) {
          formattedMessage += `\n\n📎 Detailed Report: ${reportUrl}`;
        }
        formattedMessage += '\n\n🤖 AI POS System';
        break;
      case 'alert':
        formattedMessage = `🚨 *${title}*\n\n${message}\n\n🤖 AI POS System`;
        break;
      case 'query_response':
        formattedMessage = `💬 *Query Response*\n\n${message}\n\n🤖 AI POS System`;
        break;
      default:
        formattedMessage = `*${title}*\n\n${message}\n\n🤖 AI POS System`;
    }

    // Send WhatsApp message using Business API
    const whatsappResponse = await fetch(`https://graph.facebook.com/v17.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${whatsappToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: phone.replace(/[^\d]/g, ''), // Remove non-digits
        type: 'text',
        text: {
          body: formattedMessage
        }
      }),
    });

    if (!whatsappResponse.ok) {
      const errorData = await whatsappResponse.text();
      console.error('WhatsApp API error:', errorData);
      throw new Error(`WhatsApp API error: ${whatsappResponse.status}`);
    }

    const responseData = await whatsappResponse.json();
    console.log('WhatsApp message sent successfully:', responseData);

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: responseData.messages?.[0]?.id,
        message: 'WhatsApp notification sent successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error sending WhatsApp notification:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});