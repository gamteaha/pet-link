import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const { userId, itemId } = await req.json();

    if (!userId || !itemId) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get current quantity
    const { data: invData } = await supabase
      .from('user_inventory')
      .select('quantity')
      .eq('user_id', userId)
      .eq('item_id', itemId)
      .single();

    if (!invData || invData.quantity <= 0) {
      return NextResponse.json({ error: "Not enough items" }, { status: 400 });
    }

    // Decrement
    const { error: updateError } = await supabase
      .from('user_inventory')
      .update({ quantity: invData.quantity - 1 })
      .eq('user_id', userId)
      .eq('item_id', itemId);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, newQuantity: invData.quantity - 1 });
  } catch (error) {
    console.error("Consume item error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
