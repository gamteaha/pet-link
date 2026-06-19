import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { text, voiceConfig } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_TTS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Missing Google TTS API Key" }, { status: 500 });
    }

    // voiceConfig defaults
    const name = voiceConfig?.name || "ko-KR-Standard-A";
    const languageCode = "ko-KR";
    const pitch = voiceConfig?.pitch !== undefined ? voiceConfig.pitch : 0.0;
    const speakingRate = voiceConfig?.speakingRate !== undefined ? voiceConfig.speakingRate : 1.0;

    const requestBody = {
      input: { text },
      voice: { languageCode, name },
      audioConfig: {
        audioEncoding: "MP3",
        pitch,
        speakingRate
      }
    };

    const response = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Google TTS Error:", errorData);
      return NextResponse.json({ error: "Failed to synthesize speech" }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json({ audioContent: data.audioContent });

  } catch (error: any) {
    console.error("TTS API Exception:", error.message);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
