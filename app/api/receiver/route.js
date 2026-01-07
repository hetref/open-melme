import { simpleParser } from "mailparser";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const data = { message: "Receiver API is working!" }

  return Response.json({ data })
}

export async function POST(req) {
  try {
    // 1. Authenticate Lambda
    const secret = req.headers.get("x-internal-secret");
    if (!secret || secret !== process.env.PLATFORM_API_SECRET) {
      return Response.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2. Parse payload
    const body = await req.json();

    const { s3, email, rawEmailBase64 } = body;

    if (!rawEmailBase64 || !s3?.bucket || !s3?.key) {
      return Response.json(
        { error: "Invalid payload" },
        { status: 400 }
      );
    }

    // 3. Decode raw email
    const rawBuffer = Buffer.from(rawEmailBase64, "base64");

    // Optional: parse again for safety / normalization
    const parsed = await simpleParser(rawBuffer);

    // 4. Extract address info (VERY basic for v0)
    const toText = parsed.to?.text || email?.to || null;
    const fromText = parsed.from?.text || email?.from || null;

    // 5. TEMPORARY logging (no routing yet)
    // await prisma.emailLog.create({
    //   data: {
    //     userId: "system", // v0 placeholder
    //     domainId: "unknown",
    //     aliasId: null,
    //     fromEmail: fromText ?? "unknown",
    //     toEmail: toText ?? "unknown",
    //     status: "received",
    //     error: null
    //   }
    // });
    console.log("Received email from:", fromText, "to:", toText);
    console.log("S3 Bucket:", s3.bucket, "Key:", s3.key);
    console.log("Subject:", parsed.subject);
    console.log("Text body:", parsed.text?.substring(0, 100)); // log first 100 chars
    console.log("HTML body:", parsed.html?.substring(0, 100)); // log first 100 chars
    console.log("Attachments:", parsed.attachments.length);

    // 6. Acknowledge receipt
    return Response.json({
      received: true
    });

  } catch (err) {
    console.error("Inbound email API error:", err);

    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}