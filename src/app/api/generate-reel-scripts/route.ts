import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { subjectMatter, reelLength, language } = body;

    // 1. Create a strict prompt for the AI
    const prompt = `Create a ${reelLength} Instagram reel script in ${language} about: "${subjectMatter}".
    Return ONLY raw JSON. No markdown formatting. No backticks.
    Format: { "scenes": [ { "visual": "...", "voiceover": "..." } ] }`;

    console.log("🚀 Triggering Lightning AI...");

    // 2. Run the Local Python Script
    // ⚠️ UPDATE THIS PATH to your actual user folder
    const scriptPath = "C:\\Users\\YOUR_USERNAME\\Desktop\\manager.py";
    
    // Escape quotes to prevent crashing the command line
    const safePrompt = prompt.replace(/"/g, '\\"');
    
    // Execute
    const { stdout, stderr } = await execPromise(`python "${scriptPath}" "${safePrompt}"`);

    // 3. Process the Output
    console.log("Python Output:", stdout);
    
    // Find the JSON part (ignore "Starting studio..." logs)
    const jsonMatch = stdout.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error(`No JSON found in output. Raw output: ${stdout}`);
    }

    const scriptData = JSON.parse(jsonMatch[0]);

    return NextResponse.json(scriptData);

  } catch (error: any) {
    console.error("❌ Error:", error);
    return NextResponse.json(
      { error: "Failed to generate script", details: error.message },
      { status: 500 }
    );
  }
}
