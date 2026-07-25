import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { S3Client, PutObjectCommand, ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.R2_BUCKET_NAME || 'ai-creator-media';
const PUBLIC_URL = process.env.R2_PUBLIC_URL || `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;

// GET - Fetch all library images
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const category = searchParams.get('category') || 'all';

    // Fetch from database
    let query = supabase
      .from('shared_library')
      .select('*')
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (category !== 'all') {
      query = query.eq('category', category);
    }

    const { data, error } = await query;
    if (error) throw error;

    const { count } = await supabase
      .from('shared_library')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({ images: data || [], total: count || 0 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch library' }, { status: 500 });
  }
}

// POST - Upload image to R2 and save to database
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;
    const prompt = formData.get('prompt') as string || '';
    const category = formData.get('category') as string || 'inspiration';
    const tags = formData.get('tags') as string || '';

    if (!file || !userId) {
      return NextResponse.json({ error: 'File and userId required' }, { status: 400 });
    }

    // Generate unique filename
    const ext = file.name.split('.').pop() || 'png';
    const key = `library/${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    // Upload to R2
    const buffer = Buffer.from(await file.arrayBuffer());
    await r2.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    }));

    const url = `${PUBLIC_URL}/${key}`;

    // Save to database
    const { data, error } = await supabase
      .from('shared_library')
      .insert({
        user_id: userId,
        url,
        r2_key: key,
        name: file.name,
        prompt,
        category,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ image: data });
  } catch (error) {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}

// DELETE - Remove image from R2 and database
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const userId = searchParams.get('userId');

    if (!id || !userId) {
      return NextResponse.json({ error: 'id and userId required' }, { status: 400 });
    }

    // Get the image record
    const { data: image } = await supabase
      .from('shared_library')
      .select('r2_key, user_id')
      .eq('id', id)
      .single();

    if (!image || image.user_id !== userId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Delete from R2
    if (image.r2_key) {
      await r2.send(new DeleteObjectCommand({
        Bucket: BUCKET,
        Key: image.r2_key,
      }));
    }

    // Delete from database
    await supabase.from('shared_library').delete().eq('id', id);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}
