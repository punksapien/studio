'use client';

// Force dynamic rendering due to client-side interactivity
export const dynamic = 'force-dynamic'
import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AdminPageShell } from "@/components/admin/page-header";
import type { User, VerificationStatus } from "@/lib/types";
import Link from "next/link";
import { ShieldCheck, Filter, Search, Edit, Loader2, UserPlus } from "lucide-react";
import useSWR from 'swr';
import { useState, useCallback, useMemo } from 'react';
import { useDebounce } from '@/hooks/use-debounce';
import { CreateUserDialog } from '@/components/admin/create-user-dialog';
import { VerificationStatusBadge } from '@/components/shared/verification-status-badge';

// Simplified interface for admin user data that matches API response exactly
interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: string;
  verificationStatus: string;
  isEmailVerified: boolean;
  country: string;
  createdAt: string; // ISO string from database
  updatedAt: string; // ISO string from database
  isOnboardingCompleted: boolean;
  is_onboarding_completed: boolean;
  onboardingStep: number;
  onboarding_step_completed: number;
}

interface AdminUsersResponse {
  users: AdminUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: {
    search: string;
    role: string;
    verificationStatus: string;
  };
}

// Simple fetcher for SWR
const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
  return res.json();
});

export default function AdminUsersPage() {
  // State for filters and pagination
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('all');
  const [verificationStatus, setVerificationStatus] = useState('all');
  const [createUserDialogOpen, setCreateUserDialogOpen] = useState(false);
  // No pagination: load everything and scroll inside the table
  const limit = 1000;

  // Debounce search to avoid excessive API calls
  const debouncedSearch = useDebounce(search, 500);

  // Build API URL with current filters
  const apiUrl = useMemo(() => {
    const params = new URLSearchParams({
      page: '1',
      limit: limit.toString(),
      search: debouncedSearch,
      role,
      verification_status: verificationStatus,
    });
    return `/api/admin/users?${params.toString()}`;
  }, [limit, debouncedSearch, role, verificationStatus]);

  // Fetch data with SWR
  const { data, error, isLoading, mutate } = useSWR<AdminUsersResponse>(apiUrl, fetcher);

  // Handle filter changes
  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
  }, []);

  const handleFilterChange = useCallback((filterType: string, value: string) => {
    switch (filterType) {
      case 'role':
        setRole(value);
        break;
      case 'verification':
        setVerificationStatus(value);
        break;
    }
  }, []);

  const clearFilters = useCallback(() => {
    setSearch('');
    setRole('all');
    setVerificationStatus('all');
  }, []);

  // Handle successful user creation
  const handleUserCreated = useCallback((user: any) => {
    // Refresh the user list
    mutate();
  }, [mutate]);

  return (
    <AdminPageShell
      title="User Management"
      description="View, search, filter, and manage all platform users."
    >
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                className="pl-8 w-full md:w-[300px]"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-4">
              <Select value={role} onValueChange={(value) => handleFilterChange('role', value)}>
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue placeholder="Filter by Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="seller">Seller</SelectItem>
                  <SelectItem value="buyer">Buyer</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>

              <Select value={verificationStatus} onValueChange={(value) => handleFilterChange('verification', value)}>
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue placeholder="Filter by Verification" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="pending_verification">Pending Verification</SelectItem>
                  <SelectItem value="anonymous">Not Verified</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={clearFilters} className="w-full sm:w-[160px]">
                <Filter className="h-4 w-4 mr-2"/>Clear Filters
              </Button>

              <Button onClick={() => setCreateUserDialogOpen(true)} className="w-full sm:w-[160px]">
                <UserPlus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading users...</span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-8 text-red-600">
              <p>Failed to load users: {error.message}</p>
              <Button variant="outline" onClick={() => mutate()} className="mt-2">
                Try Again
              </Button>
            </div>
          )}

          {/* Users Table */}
          {data && !isLoading && (
            <>
              <div className="flex-1 min-h-0 border overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap">Full Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Country</TableHead>
                      <TableHead className="whitespace-nowrap">Profile Status</TableHead>
                      <TableHead className="whitespace-nowrap">Registered On</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No users found matching your criteria.
                        </TableCell>
                      </TableRow>
                    ) : (
                      data.users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium whitespace-nowrap">{user.fullName}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell><Badge variant="outline" className="capitalize">{user.role}</Badge></TableCell>
                          <TableCell>{user.country}</TableCell>
                          <TableCell><VerificationStatusBadge status={user.verificationStatus} /></TableCell>
                          <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell className="text-right whitespace-nowrap">
                            <Button variant="ghost" size="icon" asChild title="View User Details">
                              <Link href={`/admin/users/${user.id}`}>
                                <Edit className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button variant="ghost" size="icon" asChild title="Manage Verification">
                              <Link href={`/admin/verification-queue/${user.role === 'buyer' ? 'buyers' : 'sellers'}?userId=${user.id}`}>
                                <ShieldCheck className="h-4 w-4" />
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              <p className="text-sm text-muted-foreground">
                Total: {data.pagination.total} users
              </p>
            </>
          )}

      {/* Create User Dialog */}
      <CreateUserDialog
        open={createUserDialogOpen}
        onOpenChange={setCreateUserDialogOpen}
        onSuccess={handleUserCreated}
      />

    </AdminPageShell>
  );
}

