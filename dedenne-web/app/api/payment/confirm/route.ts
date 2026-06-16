import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { paymentKey, orderId, amount } = body;

    // 1. 파라미터 검증
    if (!paymentKey || !orderId || amount === undefined) {
      return NextResponse.json(
        { message: "필수 결제 파라미터가 누락되었습니다." },
        { status: 400 }
      );
    }

    const secretKey = process.env.TOSS_SECRET_KEY;
    if (!secretKey) {
      console.error("서버에 TOSS_SECRET_KEY가 설정되지 않았습니다.");
      return NextResponse.json(
        { message: "결제 서버 설정 오류" },
        { status: 500 }
      );
    }

    // 2. 토스페이먼츠 승인 요청 (Basic 인증)
    const encryptedSecretKey = "Basic " + Buffer.from(secretKey + ":").toString("base64");
    
    const response = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: encryptedSecretKey,
      },
      body: JSON.stringify({
        paymentKey,
        orderId,
        amount,
      }),
    });

    const data = await response.json();

    // 3. 실패 시 에러 처리
    if (!response.ok) {
      console.error("Toss Payments 승인 거절:", data);
      return NextResponse.json(
        { message: data?.message || "결제 승인 실패", code: data?.code },
        { status: 400 }
      );
    }

    // 4. 성공 응답
    return NextResponse.json(data, { status: 200 });

  } catch (error: any) {
    console.error("결제 승인 중 내부 예외 발생:", error);
    return NextResponse.json(
      { message: "서버 내부 오류로 인해 결제 승인에 실패했습니다." },
      { status: 500 }
    );
  }
}
