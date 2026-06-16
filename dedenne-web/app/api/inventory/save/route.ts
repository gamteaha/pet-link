import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import os from "os";

export async function POST(req: NextRequest) {
  try {
    const { petId, petData } = await req.json();
    const actualPetId = petId || 'default';

    const dirPath = path.join(os.homedir(), ".petlink", "pets");
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    
    const petDataPath = path.join(dirPath, `${actualPetId}_data.json`);

    fs.writeFileSync(petDataPath, JSON.stringify(petData, null, 4), "utf-8");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Local save error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
