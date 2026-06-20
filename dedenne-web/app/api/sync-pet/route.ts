import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const { petId, petData, isStartup } = await req.json();

    if (!petId || petId === 'default' || !petData) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    // Create a Supabase client with the service role key to bypass RLS
    // We only update the specific pet. In a real production app, we would authenticate
    // the request with a JWT or specific pet sync token to prevent abuse.
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    if (!supabaseServiceKey) {
      return NextResponse.json({ error: "Server missing credentials" }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // petId from desktop is the numeric timestamp. The real UUID is in petData.db_id
    const realDbId = petData.db_id;
    if (!realDbId) {
      return NextResponse.json({ error: "Missing db_id in petData" }, { status: 400 });
    }

    // 1. Fetch the existing pet
    const { data: pet, error: fetchError } = await supabase
      .from('user_pets')
      .select('config')
      .eq('id', realDbId)
      .single();

    if (fetchError || !pet) {
      return NextResponse.json({ error: "Pet not found" }, { status: 404 });
    }

    // 2. Merge the incoming offline data (affection, level, cosmetics) into the existing config
    // Exclude inventory from the saved config entirely to clean up legacy data!
    const { inventory: _, ...restConfig } = pet.config;

    const newConfig = {
      ...restConfig,
      affection: Math.max(petData.affection || 0, pet.config.affection || 0),
      level: Math.max(petData.level || 0, pet.config.level || 0),
      current_costume: petData.current_costume ?? pet.config.current_costume,
      current_hair: petData.current_hair ?? pet.config.current_hair,
      tutorial_complete: petData.tutorial_complete ?? pet.config.tutorial_complete,
      last_pat_date: petData.last_pat_date || pet.config.last_pat_date
    };

    console.log("[Sync Pet API] Merged config to write to DB:", newConfig);

    // 3. Update the database
    const { error: updateError } = await supabase
      .from('user_pets')
      .update({ config: newConfig })
      .eq('id', realDbId);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ success: true, updatedConfig: newConfig });
  } catch (error) {
    console.error("Sync API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
