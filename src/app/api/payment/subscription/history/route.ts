import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { getRazorpay } from '@/lib/razorpay';

export interface RazorpayInvoice {
  id: string;
  date: number;
  amount: number;
  currency: string;
  status: string;
  short_url?: string;
  [key: string]: unknown;
}

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json([]);
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('subscription_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.subscription_id) {
      return NextResponse.json([]);
    }

    const razorpay = getRazorpay();
    const response = await razorpay.invoices.all({ subscription_id: profile.subscription_id, count: 10 });
    
    if (!response || !('items' in response)) {
      return NextResponse.json([]);
    }

    const invoices = response.items as unknown as RazorpayInvoice[];
    
    const history = invoices.map((invoice) => ({
      id: invoice.id,
      date: new Date(invoice.date * 1000).toISOString(),
      amount: invoice.amount / 100,
      currency: invoice.currency,
      status: invoice.status,
      invoiceUrl: invoice.short_url || null,
    }));

    return NextResponse.json(history);
  } catch (error: unknown) {
    return NextResponse.json([]);
  }
}
