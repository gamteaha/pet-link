import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { items } = body; // Array of { id, quantity }

    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ error: "Invalid items format" }, { status: 400 });
    }

    // 파이썬 앱의 로컬 JSON 파일 경로 (현재 프로젝트 기준 절대/상대 경로)
    const pythonAppPath = path.resolve(process.cwd(), "../dedenne/pet_data.json");

    if (!fs.existsSync(pythonAppPath)) {
      console.warn("pet_data.json 파일을 찾을 수 없습니다:", pythonAppPath);
      return NextResponse.json({ error: "Local python app data file not found." }, { status: 404 });
    }

    // 파일 읽기
    const fileData = fs.readFileSync(pythonAppPath, "utf-8");
    const petData = JSON.parse(fileData);

    if (!petData.inventory) {
      petData.inventory = {};
    }

    // 수량 업데이트
    for (const item of items) {
      const currentQty = petData.inventory[item.id] || 0;
      petData.inventory[item.id] = currentQty + item.quantity;
    }

    // 파일 다시 쓰기
    fs.writeFileSync(pythonAppPath, JSON.stringify(petData, null, 4), "utf-8");

    return NextResponse.json({ success: true, message: "Local python app inventory updated successfully." });
  } catch (error) {
    console.error("Local sync error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
