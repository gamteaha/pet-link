import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const { config } = await req.json();
    const pythonAppPath = path.resolve(process.cwd(), '../dedenne/pet_data.json');
    if (fs.existsSync(pythonAppPath)) {
      // merge with existing to avoid wiping out other fields if any
      const existing = JSON.parse(fs.readFileSync(pythonAppPath, 'utf-8'));
      const newConfig = { ...existing, ...config };
      fs.writeFileSync(pythonAppPath, JSON.stringify(newConfig, null, 4), 'utf-8');
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
