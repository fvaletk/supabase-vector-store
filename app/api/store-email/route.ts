import { NextRequest, NextResponse } from "next/server";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import { z } from "zod";

interface Email {
  subject: string;
  sender: string;
  recipient: string[];
  cc: string[];
  bcc: string[];
  body: string;
}

interface EmailSection {
  email_id: number,
  section_content: string,
  embedding: number[],
  section_order: number,
}

const supabase: SupabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const emailSchema = z.object({
  subject: z.string(),
  sender: z.string(),
  recipient: z.array(z.string()).nonempty(),
  cc: z.array(z.string()),
  bcc: z.array(z.string()),
  body: z.string(),
});

function splitIntoChunks(text: string, chunkSize: number = 2000): string[] {
  const words = text.split(" ");
  const chunks: string[] = [];
  let currentChunk = "";

  for (const word of words) {
    if (currentChunk.length + word.length + 1 > chunkSize) {
      chunks.push(currentChunk);
      currentChunk = word;
    } else {
      currentChunk += (currentChunk ? " " : "") + word;
    }
  }

  if (currentChunk) chunks.push(currentChunk);

  return chunks;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('Received POST request');
    const requestData = await request.json();
    console.log('Request data:', requestData);

    const validationResult = emailSchema.safeParse(requestData);
    console.log('Validation result:', validationResult);

    if (!validationResult.success) {
      console.error('Validation failed:', validationResult.error.flatten().fieldErrors);
      return NextResponse.json(
        { error: "Invalid email data", details: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    
    const { subject, sender, recipient, cc, bcc, body }: Email = validationResult.data;
    console.log('Parsed email data:', { subject, sender, recipient, cc, bcc, body });

    const { data: email, error: emailError } = await supabase
      .from("emails")
      .insert([{ subject, sender, recipient, cc, bcc, body }])
      .select("id")
      .single();

    if (emailError) {
      console.error('Error inserting email:', emailError.message);
      throw new Error(emailError.message);
    }
    
    const emailId: number = email.id;
    console.log('Inserted email ID:', emailId);

    const chunks = splitIntoChunks(body);
    console.log('Email body split into chunks:', chunks);
    
    const openai = new OpenAI();

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(`Processing chunk ${i + 1}:`, chunk);

      const embeddingResponse = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: chunk,
      });

      const embedding = embeddingResponse.data[0].embedding;
      console.log(`Embedding for chunk ${i + 1}:`, embedding);
      
      const section: EmailSection = {
        email_id: emailId,
        section_content: chunk,
        embedding,
        section_order: i + 1,
      };

      const { error: sectionError } = await supabase
        .from("email_sections")
        .insert(section);

      if (sectionError) {
        console.error('Error inserting email section:', sectionError.message);
        throw new Error(sectionError.message);
      }
    }

    console.log('Email and sections stored successfully');
    return NextResponse.json({ message: "Email and sections stored successfully" }, { status: 200 });
    
  } catch (error: any) {
    console.error("Error storing email:", error);
    return NextResponse.json({ error: error.message || "Failed to store email" }, { status: 500 });
  }
}