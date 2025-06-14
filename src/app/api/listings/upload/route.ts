import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Helper to get user from token
async function getUserFromToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { user: null, error: 'Missing or invalid authorization header' };
  }
  const token = authHeader.substring(7);
  return supabaseAdmin.auth.getUser(token);
}

// POST /api/listings/upload - Handle listing document uploads
export async function POST(request: NextRequest) {
  try {
    const { data: { user }, error: authError } = await getUserFromToken(request);
    if (authError || !user) {
      return NextResponse.json({ error: authError?.message || 'Invalid token' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const documentType = formData.get('document_type') as string | null;

    if (!file || !documentType) {
      return NextResponse.json({ error: 'Missing file or document_type' }, { status: 400 });
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File size exceeds 5MB limit' }, { status: 400 });
    }

    const allowedMimeTypes = [
      'application/pdf',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      'image/jpeg',
      'image/png'
    ];
    if (!allowedMimeTypes.includes(file.type)) {
      return NextResponse.json({
        error: 'Invalid file type. Only PDF, XLSX, CSV, JPG, and PNG files allowed.'
      }, { status: 400 });
    }

    // Valid document types for listings
    const validDocumentTypes = [
      'financial_documents',
      'key_metrics_report',
      'ownership_documents',
      'financial_snapshot',
      'ownership_details',
      'location_real_estate_info',
      'web_presence_info'
    ];

    if (!validDocumentTypes.includes(documentType)) {
      return NextResponse.json({
        error: 'Invalid document type'
      }, { status: 400 });
    }

    const fileExtension = file.name.split('.').pop();
    const storagePath = `listing-documents/${user.id}/${documentType}_${Date.now()}.${fileExtension}`;

    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('listing-documents')
      .upload(storagePath, file, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json({
        error: 'Failed to upload file to storage',
        details: uploadError.message
      }, { status: 500 });
    }

    // Get signed URL for future access
    const { data: urlData } = await supabaseAdmin.storage
      .from('listing-documents')
      .createSignedUrl(storagePath, 60 * 60 * 24 * 365); // Valid for 1 year

    return NextResponse.json({
      success: true,
      filePath: storagePath,
      signedUrl: urlData?.signedUrl,
      documentType,
      fileName: file.name,
      fileSize: file.size
    });

  } catch (error) {
    console.error('Document upload error:', error);
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid request format (expected FormData)' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
