
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { prompt, imageUrl } = await req.json();

    if (!process.env.HUGGING_FACE_API_KEY) {
      return new Response(JSON.stringify({ error: 'Missing HF API Key' }), { status: 500 });
    }

    // User explicitly asked to use the "Lightricks" model and "not generating any image" (implying bypass image gen).
    // So we default to Lightricks/LTX-Video which is a Text-to-Video model (and supports Image-to-Video too often).

    let model = "Lightricks/LTX-Video";
    let body: any = { inputs: prompt };

    // Check if we need to update the endpoint URL for video as well
    // https://api-inference.huggingface.co might be deprecated here too.

    const response = await fetch(
        `https://router.huggingface.co/hf-inference/models/${model}`,
        {
            headers: {
                Authorization: `Bearer ${process.env.HUGGING_FACE_API_KEY}`,
                "Content-Type": "application/json",
            },
            method: "POST",
            body: JSON.stringify(body),
        }
    );

    if (!response.ok) {
        const errorText = await response.text();
        console.error("Hugging Face Video API Error:", errorText);
        throw new Error(`HF API error: ${response.statusText} - ${errorText}`);
    }

    const contentType = response.headers.get("content-type");

    if (contentType?.includes("application/json")) {
        const data = await response.json();
        return new Response(JSON.stringify(data), { status: 200 });
    } else {
        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const base64 = buffer.toString('base64');
        const mimeType = contentType || 'video/mp4';
        const dataUrl = `data:${mimeType};base64,${base64}`;

        return new Response(JSON.stringify({ url: dataUrl }), { status: 200 });
    }

  } catch (error) {
    console.error('Error generating video:', error);
    return new Response(JSON.stringify({ error: 'Failed to generate video.' }), {
      status: 500,
    });
  }
}
