import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import os from "os";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const petId = searchParams.get('petId') || 'default';
    
    const dirPath = path.join(os.homedir(), ".petlink", "pets");
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    const petDataPath = path.join(dirPath, `${petId}_data.json`);

    let petData;
    if (!fs.existsSync(petDataPath)) {
      // Create default data if it doesn't exist
      petData = {
        level: 1,
        affection: 0,
        current_costume: "default",
        last_pat_date: "",
        inventory: { bread: 0, soap: 0, towel: 0, strawberry: 0 }
      };
      fs.writeFileSync(petDataPath, JSON.stringify(petData, null, 4), "utf-8");
    } else {
      const fileData = fs.readFileSync(petDataPath, "utf-8");
      petData = JSON.parse(fileData);
    }

    return NextResponse.json(petData);
  } catch (error) {
    console.error("Local load error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
