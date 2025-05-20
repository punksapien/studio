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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { sampleUsers } from "@/lib/placeholder-data";
import type { User } from "@/lib/types";
import Link from "next/link";
import { Eye, ShieldCheck, ShieldAlert, Filter, Search } from "lucide-react";

// In a real app, users would be fetched and paginated.
const users: User[] = sampleUsers;

export default function AdminUsersPage() {
  const getVerificationBadge = (status: User["verificationStatus"]) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-200 border-green-300 dark:border-green-600"><ShieldCheck className="h-3 w-3 mr-1" /> Verified</Badge>;
      case 'pending_verification':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 dark:bg-yellow-800 dark:text-yellow-200 border-yellow-300 dark:border-yellow-600"><ShieldAlert className="h-3 w-3 mr-1" /> Pending</Badge>;
      case 'anonymous':
        return <Badge variant="outline">Anonymous</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>View, search, filter, and manage all platform users.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-grow">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search by name or email..." className="pl-8 sm:w-full md:w-[300px]" />
            </div>
            <div className="flex gap-4">
                <Select>
                <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filter by Role" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="seller">Seller</SelectItem>
                    <SelectItem value="buyer">Buyer</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
                </Select>
                <Select>
                <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Filter by Verification" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="pending_verification">Pending Verification</SelectItem>
                    <SelectItem value="anonymous">Anonymous</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
                </Select>
                <Button variant="outline" className="hidden sm:inline-flex"><Filter className="h-4 w-4 mr-2"/>Apply</Button>
            </div>
            <Button variant="outline" className="sm:hidden w-full"><Filter className="h-4 w-4 mr-2"/>Apply Filters</Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Verification Status</TableHead>
                  <TableHead>Registered On</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.fullName}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell><Badge variant="outline" className="capitalize">{user.role}</Badge></TableCell>
                    <TableCell>{user.country}</TableCell>
                    <TableCell>{getVerificationBadge(user.verificationStatus)}</TableCell>
                    <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" asChild title="View User Details">
                        <Link href={`/admin/users/${user.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                       <Button variant="ghost" size="icon" title={`Mark as ${user.verificationStatus !== 'verified' ? 'Verified' : 'Pending'}`}>
                         {user.verificationStatus !== 'verified' ? <ShieldCheck className="h-4 w-4 text-green-600" /> : <ShieldAlert className="h-4 w-4 text-yellow-600" />}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {/* Placeholder for PaginationControls */}
          <div className="mt-6 text-center text-muted-foreground">
            Pagination (10 users per page) - Total users: {users.length}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
