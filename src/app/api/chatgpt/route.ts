import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Lembre de configurar sua variável de ambiente
});

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    return NextResponse.json({
      response: response.choices[0].message?.content,
    });
  } catch (error) {
    console.error("Erro ao chamar a API da OpenAI:", error);
    return NextResponse.json(
      { error: "Erro ao chamar a API da OpenAI" },
      { status: 500 }
    );
  }
}
