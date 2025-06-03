
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

// POST /api/onboarding/upload - Handle document uploads
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

    const allowedMimeTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedMimeTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Only JPG, PNG, and PDF allowed.' }, { status: 400 });
    }

    const fileExtension = file.name.split('.').pop();
    const storagePath = `onboarding-documents/${user.id}/${documentType}_${Date.now()}.${fileExtension}`;

    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('onboarding-documents') // Ensure this bucket name matches your Storage setup
      .upload(storagePath, file, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false // Do not overwrite if file path conflicts, though unlikely with timestamp
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json({ error: 'Failed to upload file to storage', details: uploadError.message }, { status: 500 });
    }

    // Save document record in database
    const { data: documentRecord, error: dbError } = await supabaseAdmin
      .from('onboarding_documents')
      .insert({
        user_id: user.id,
        document_type: documentType,
        file_name: file.name,
        file_path: storagePath, // Use the path from uploadData if different, but storagePath should be it
        file_size: file.size,
        mime_type: file.type
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database insert error for onboarding_documents:', dbError);
      // Attempt to clean up uploaded file if database insert fails
      await supabaseAdmin.storage.from('onboarding-documents').remove([storagePath]);
      return NextResponse.json({ error: 'Failed to save document record', details: dbError.message }, { status: 500 });
    }
    
    // Update user_profiles.submitted_documents
    const { data: currentProfile, error: fetchProfileError } = await supabaseAdmin
        .from('user_profiles')
        .select('submitted_documents')
        .eq('id', user.id)
        .single();

    if (fetchProfileError && fetchProfileError.code !== 'PGRST116') {
        console.error('Error fetching current submitted_documents for update:', fetchProfileError);
    }
    const existingDocs = currentProfile?.submitted_documents || {};
    const updatedSubmittedDocs = { ...existingDocs, [documentType]: storagePath };

    const { error: profileUpdateError } = await supabaseAdmin
        .from('user_profiles')
        .update({ submitted_documents: updatedSubmittedDocs })
        .eq('id', user.id);
    
    if (profileUpdateError) {
        console.error('Error updating user_profiles.submitted_documents:', profileUpdateError);
        // This is not critical enough to fail the whole upload if the onboarding_documents record was saved.
    }


    // Get signed URL for client access if needed, though returning path is often enough
    const { data: urlData } = await supabaseAdmin.storage
      .from('onboarding-documents')
      .createSignedUrl(storagePath, 60 * 5); // Signed URL valid for 5 minutes

    return NextResponse.json({
      success: true,
      documentRecord, // The record from onboarding_documents table
      filePath: storagePath, // The actual path in storage
      signedUrl: urlData?.signedUrl // Optional: if client needs direct temp access
    });

  } catch (error) {
    console.error('Document upload error:', error);
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid request format (expected FormData)' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/onboarding/upload - Get user's uploaded documents (basic list)
export async function GET(request: NextRequest) {
  try {
    const { data: { user }, error: authError } = await getUserFromToken(request);
    if (authError || !user) {
      return NextResponse.json({ error: authError?.message || 'Invalid token' }, { status: 401 });
    }

    const { data: documents, error: documentsError } = await supabaseAdmin
      .from('onboarding_documents')
      .select('id, document_type, file_name, uploaded_at, mime_type')
      .eq('user_id', user.id)
      .order('uploaded_at', { ascending: false });

    if (documentsError) {
      console.error('Documents fetch error:', documentsError);
      return NextResponse.json({ error: 'Failed to fetch documents', details: documentsError.message }, { status: 500 });
    }

    return NextResponse.json({ documents: documents || [] });

  } catch (error) {
    console.error('Documents fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
