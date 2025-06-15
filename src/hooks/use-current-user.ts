// DEPRECATED: This file is kept for backward compatibility only
// All components should use the cached version instead

import { useCurrentUser as useCachedCurrentUser } from '@/hooks/use-cached-profile';

// Legacy compatibility - redirect to cached version
export function useCurrentUser() {
  console.warn('DEPRECATED: useCurrentUser from /hooks/use-current-user.ts is deprecated. Use useCurrentUser from /hooks/use-cached-profile.ts or useAuth() context instead.');

  return useCachedCurrentUser();
}

// Re-export types for compatibility
export type { UserProfile, User } from '@/lib/auth';

// Legacy verification utility - moved to prevent rate limiting
export async function sendVerificationRequestEmail() {
  const { useCurrentUser } = await import('@/hooks/use-cached-profile');
  const { user } = useCurrentUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  const { supabase } = await import('@/lib/supabase');
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError || !session?.access_token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch('/api/verification/request-email', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    }
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to send verification request email');
  }

  return response.json();
}

export async function updateUserProfile(updateData: Partial<UserProfile>): Promise<UserProfile> {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  if (sessionError || !session?.access_token) {
    throw new Error('Not authenticated - please log in again')
  }

  const response = await fetch('/api/auth/update-profile', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(updateData)
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Failed to update profile')
  }
  const { profile } = await response.json()
  return profile
}

// Onboarding utility functions
export async function checkOnboardingStatus(): Promise<{
  is_onboarding_completed: boolean;
  onboarding_step_completed: number;
  submitted_documents?: Record<string, any>;
  role: 'buyer' | 'seller' | 'admin';
  next_step: string;
}> {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session?.access_token) {
    throw new Error('Not authenticated for checkOnboardingStatus');
  }

  const response = await fetch('/api/onboarding/status', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    }
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to check onboarding status');
  }
  return response.json();
}

export async function updateOnboardingStatus(updates: {
  step_completed?: number;
  submitted_documents?: Record<string, any>;
  complete_onboarding?: boolean;
}): Promise<{ success: boolean; profile: UserProfile }> {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session?.access_token) {
    throw new Error('Not authenticated for updateOnboardingStatus');
  }

  const response = await fetch('/api/onboarding/status', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates)
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to update onboarding status');
  }
  return response.json();
}

export async function uploadOnboardingDocument(file: File, documentType: string): Promise<{
  success: boolean;
  documentRecord: any; // Define specific type for onboarding document record
  filePath: string;
  signedUrl?: string;
}> {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session?.access_token) {
    throw new Error('Not authenticated for uploadOnboardingDocument');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('document_type', documentType);

  const response = await fetch('/api/onboarding/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      // Content-Type is set automatically by browser for FormData
    },
    body: formData
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to upload document');
  }
  return response.json();
}
