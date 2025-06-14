'use client';

import { useAuth, useCurrentUser } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// Example 1: Using the full auth context
export function ProfileCard() {
  const { profile, isLoading, error, refreshProfile } = useAuth();

  if (isLoading) return <div>Loading profile...</div>;
  if (error) return <div>Error loading profile</div>;
  if (!profile) return <div>Not authenticated</div>;

  return (
    <Card className="p-4">
      <h3>Welcome, {profile.full_name}!</h3>
      <p>Role: {profile.role}</p>
      <p>Email verified: {profile.is_email_verified ? 'Yes' : 'No'}</p>
      <Button onClick={refreshProfile} className="mt-2">
        Refresh Profile
      </Button>
    </Card>
  );
}

// Example 2: Using the simplified hook
export function UserGreeting() {
  const { user, profile } = useCurrentUser();

  if (!user) return null;

  return (
    <div>
      Hello, {profile?.full_name || user.email}!
    </div>
  );
}

// Example 3: Multiple components using the same cached data
export function HeaderProfile() {
  // This will NOT make a new API call - it uses the shared cache!
  const { profile } = useAuth();
  return <div>{profile?.full_name}</div>;
}

export function SidebarProfile() {
  // This also uses the same cached data - no extra API call!
  const { profile } = useAuth();
  return <div>{profile?.role}</div>;
}

export function FooterProfile() {
  // And this too - all sharing the same cache!
  const { profile } = useAuth();
  return <div>{profile?.email}</div>;
}

// Example 4: After updating profile, invalidate cache
export function ProfileUpdateForm() {
  const { invalidateProfile } = useAuth();

  const handleSave = async (data: any) => {
    // Save profile to server
    await fetch('/api/profile', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    // Invalidate cache so all components get fresh data
    invalidateProfile();
  };

  return (
    <form onSubmit={handleSave}>
      {/* Form fields */}
      <Button type="submit">Save Profile</Button>
    </form>
  );
}
