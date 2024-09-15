import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import * as cheerio from 'cheerio';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  const { url } = await request.json();

  try {
    // Fetch the web page content
    const response = await fetch(url);
    const html = await response.text();

    // Extract main content
    const mainContent = extractMainContent(html);

    // Send the main content to ChatGPT API for processing
    const processedContent = await sendToChatGPT(mainContent);

    return NextResponse.json({ processedContent });
  } catch (error) {
    console.error('Error processing link:', error);
    return NextResponse.json(
      { error: 'Error processing link' },
      { status: 500 }
    );
  }
}

function extractMainContent(html: string): string {
  const $ = cheerio.load(html);

  // Remove unnecessary elements
  $('script, style, nav, header, footer, aside, iframe').remove();

  // Extract text from body or main content area
  let content = $('main').text() || $('article').text() || $('body').text();

  // Clean up the content
  content = content.replace(/\s+/g, ' ').trim();

  return content;
}

async function sendToChatGPT(content: string): Promise<string> {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that summarizes the main content from web pages.',
        },
        {
          role: 'user',
          content: `Summarize the main points from this content: ${content}`,
        },
      ],
      max_tokens: 500,
    });

    return completion.choices[0].message.content || 'No content extracted';
  } catch (error) {
    console.error('Error calling ChatGPT API:', error);
    throw new Error('Failed to process content with ChatGPT');
  }
}
