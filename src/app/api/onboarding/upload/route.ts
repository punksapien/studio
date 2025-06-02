import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// POST /api/onboarding/upload - Handle document uploads
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 });
    }

    const token = authHeader.substring(7);

    // Verify the user token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const documentType = formData.get('document_type') as string;

    if (!file || !documentType) {
      return NextResponse.json({
        error: 'Missing file or document_type'
      }, { status: 400 });
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({
        error: 'File size exceeds 5MB limit'
      }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'application/pdf'
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({
        error: 'Invalid file type. Only JPG, PNG, and PDF files are allowed.'
      }, { status: 400 });
    }

    // Generate unique file path
    const fileExtension = file.name.split('.').pop();
    const fileName = `${user.id}/${documentType}_${Date.now()}.${fileExtension}`;

    // Convert File to ArrayBuffer for Supabase Storage
    const fileBuffer = await file.arrayBuffer();

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('onboarding-documents')
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json({
        error: 'Failed to upload file'
      }, { status: 500 });
    }

    // Save document record in database
    const { data: documentRecord, error: dbError } = await supabase
      .from('onboarding_documents')
      .upsert({
        user_id: user.id,
        document_type: documentType,
        file_name: file.name,
        file_path: fileName,
        file_size: file.size
      }, {
        onConflict: 'user_id,document_type' // Replace existing document of same type
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database insert error:', dbError);

      // Clean up uploaded file if database insert fails
      await supabase.storage
        .from('onboarding-documents')
        .remove([fileName]);

      return NextResponse.json({
        error: 'Failed to save document record'
      }, { status: 500 });
    }

    // Get signed URL for the uploaded file (optional, for verification)
    const { data: urlData } = await supabase.storage
      .from('onboarding-documents')
      .createSignedUrl(fileName, 60 * 60 * 24); // 24 hours

    return NextResponse.json({
      success: true,
      document: documentRecord,
      signed_url: urlData?.signedUrl
    });

  } catch (error) {
    console.error('Document upload error:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// GET /api/onboarding/upload - Get user's uploaded documents
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 });
    }

    const token = authHeader.substring(7);

    // Verify the user token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get user's uploaded documents
    const { data: documents, error: documentsError } = await supabase
      .from('onboarding_documents')
      .select('*')
      .eq('user_id', user.id)
      .order('uploaded_at', { ascending: false });

    if (documentsError) {
      console.error('Documents fetch error:', documentsError);
      return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
    }

    return NextResponse.json({
      documents: documents || []
    });

  } catch (error) {
    console.error('Documents fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
