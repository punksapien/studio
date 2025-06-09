import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate and authorize admin user
    const currentUser = await auth.getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const requestId = params.id;
    const body = await request.json();
    const {
      activityType,
      notes,
      statusUpdate,
      priorityUpdate,
      adminNote,
      metadata = {}
    } = body;

    // Validate required fields
    if (!activityType) {
      return NextResponse.json(
        { error: 'Activity type is required' },
        { status: 400 }
      );
    }

    // Verify verification request exists
    const { data: existingRequest, error: fetchError } = await supabaseAdmin
      .from('verification_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (fetchError || !existingRequest) {
      return NextResponse.json(
        { error: 'Verification request not found' },
        { status: 404 }
      );
    }

    // Start transaction-like operations
    const updates: any = {
      processing_admin_id: currentUser.id,
      updated_at: new Date().toISOString()
    };

    let activityData = {
      request_id: requestId,
      admin_id: currentUser.id,
      activity_type: activityType,
      notes: notes || '',
      metadata: metadata,
      old_value: null,
      new_value: null
    };

    // Handle different activity types
    switch (activityType) {
      case 'status_change':
        if (statusUpdate && statusUpdate !== existingRequest.status) {
          updates.status = statusUpdate;
          activityData.old_value = existingRequest.status;
          activityData.new_value = statusUpdate;

          // Auto-update user profile verification status based on new status
          if (statusUpdate === 'Approved') {
            await supabaseAdmin
              .from('user_profiles')
              .update({ verification_status: 'verified' })
              .eq('id', existingRequest.user_id);
          } else if (statusUpdate === 'Rejected') {
            await supabaseAdmin
              .from('user_profiles')
              .update({ verification_status: 'rejected' })
              .eq('id', existingRequest.user_id);
          }
        }
        break;

      case 'priority_changed':
        if (priorityUpdate !== undefined && priorityUpdate !== existingRequest.priority_score) {
          updates.priority_score = priorityUpdate;
          activityData.old_value = existingRequest.priority_score?.toString();
          activityData.new_value = priorityUpdate.toString();
        }
        break;

      case 'note_added':
        if (adminNote) {
          // Add note to admin_notes JSONB array
          const currentNotes = existingRequest.admin_notes || [];
          const newNote = {
            note: adminNote,
            admin_id: currentUser.id,
            admin_name: currentUser.full_name || currentUser.email,
            timestamp: new Date().toISOString()
          };

          const updatedNotes = Array.isArray(currentNotes)
            ? [...currentNotes, newNote]
            : [newNote];

          updates.admin_notes = updatedNotes;
          activityData.old_value = currentNotes.length.toString();
          activityData.new_value = updatedNotes.length.toString();
          activityData.notes = `Admin note added: "${adminNote.substring(0, 100)}${adminNote.length > 100 ? '...' : ''}"`;
        }
        break;

      case 'duplicate_marked':
        if (metadata.duplicateOf) {
          updates.is_duplicate_of = metadata.duplicateOf;
          activityData.notes = `Marked as duplicate of request ${metadata.duplicateOf}`;
        }
        break;

      default:
        // Generic activity logging
        break;
    }

    // Update verification request if there are changes
    if (Object.keys(updates).length > 2) { // More than just processing_admin_id and updated_at
      const { error: updateError } = await supabaseAdmin
        .from('verification_requests')
        .update(updates)
        .eq('id', requestId);

      if (updateError) {
        console.error('Error updating verification request:', updateError);
        return NextResponse.json(
          { error: 'Failed to update verification request' },
          { status: 500 }
        );
      }
    }

    // Log the activity
    const { data: activity, error: activityError } = await supabaseAdmin
      .from('verification_request_activities')
      .insert([activityData])
      .select()
      .single();

    if (activityError) {
      console.error('Error logging activity:', activityError);
      return NextResponse.json(
        { error: 'Failed to log activity' },
        { status: 500 }
      );
    }

    // Create notification for user if status changed
    if (statusUpdate && statusUpdate !== existingRequest.status) {
      const notificationMessage = getNotificationMessage(statusUpdate);
      if (notificationMessage) {
        await supabaseAdmin
          .from('notifications')
          .insert([{
            user_id: existingRequest.user_id,
            type: 'verification',
            message: notificationMessage,
            link: '/seller-dashboard'
          }]);
      }
    }

    return NextResponse.json({
      success: true,
      activity,
      message: 'Activity logged successfully'
    });

  } catch (error) {
    console.error('Admin activity API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function getNotificationMessage(status: string): string | null {
  switch (status) {
    case 'Approved':
      return 'Your verification request has been approved! You now have verified status.';
    case 'Rejected':
      return 'Your verification request has been reviewed. Please check your dashboard for details.';
    case 'Contacted':
      return 'An admin has contacted you regarding your verification request. Please check your email.';
    case 'Docs Under Review':
      return 'Your verification documents are now under review by our team.';
    case 'More Info Requested':
      return 'Additional information is needed for your verification request. Please check your dashboard.';
    default:
      return null;
  }
}
