import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Missing userId parameter" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: invData } = await supabase
      .from('user_inventory')
      .select('item_id, quantity')
      .eq('user_id', userId);

    const inventory: Record<string, number> = {};
    if (invData) {
      invData.forEach(row => {
        inventory[row.item_id] = row.quantity;
      });
    }

    return NextResponse.json({ success: true, inventory });
  } catch (error) {
    console.error("Get inventory error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
