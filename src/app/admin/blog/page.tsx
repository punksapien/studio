'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { AdminPageShell } from '@/components/admin/page-header'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  ExternalLink,
  FileText,
  RefreshCw,
  Eye,
  EyeOff,
} from 'lucide-react'
import type { BlogPost, BlogCategory } from '@/lib/blog'

function FormattedDate({ dateString }: { dateString: string | null }) {
  const [formatted, setFormatted] = React.useState('')
  React.useEffect(() => {
    if (dateString) {
      setFormatted(new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
      }))
    }
  }, [dateString])
  return <span>{formatted || '—'}</span>
}

const categoryColors: Record<BlogCategory, string> = {
  news: 'bg-blue-100 text-blue-800',
  insights: 'bg-purple-100 text-purple-800',
  guides: 'bg-green-100 text-green-800',
  company: 'bg-orange-100 text-orange-800',
}

export default function AdminBlogPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [posts, setPosts] = React.useState<BlogPost[]>([])
  const [total, setTotal] = React.useState(0)
  const [page, setPage] = React.useState(1)
  const [totalPages, setTotalPages] = React.useState(1)
  const [loading, setLoading] = React.useState(true)

  // Filters
  const [search, setSearch] = React.useState('')
  const [category, setCategory] = React.useState<string>('all')
  const [status, setStatus] = React.useState<string>('all')

  // Delete dialog
  const [deleteSlug, setDeleteSlug] = React.useState<string | null>(null)
  const [deleteTitle, setDeleteTitle] = React.useState('')
  const [deleting, setDeleting] = React.useState(false)

  const fetchPosts = React.useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', '20')
      if (search) params.set('search', search)
      if (category !== 'all') params.set('category', category)
      if (status !== 'all') params.set('status', status)

      const res = await fetch(`/api/admin/blog?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch posts')
      const data = await res.json()
      setPosts(data.posts)
      setTotal(data.total)
      setTotalPages(data.totalPages)
    } catch {
      toast({ title: 'Error', description: 'Failed to load blog posts', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [page, search, category, status, toast])

  React.useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  // Reset page when filters change
  React.useEffect(() => {
    setPage(1)
  }, [search, category, status])

  const handleDelete = async () => {
    if (!deleteSlug) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/blog/${deleteSlug}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete post')
      toast({ title: 'Post deleted', description: `"${deleteTitle}" has been deleted.` })
      setDeleteSlug(null)
      fetchPosts()
    } catch {
      toast({ title: 'Error', description: 'Failed to delete post', variant: 'destructive' })
    } finally {
      setDeleting(false)
    }
  }

  const publishedCount = posts.filter(p => p.is_published).length
  const draftCount = posts.filter(p => !p.is_published).length

  return (
    <AdminPageShell
      title="Blog Management"
      description="Create, edit, and manage blog posts."
      actions={
        <Button asChild>
          <Link href="/admin/blog/new">
            <Plus className="h-4 w-4 mr-2" />
            New Post
          </Link>
        </Button>
      }
    >

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-semibold">{total}</p>
                <p className="text-sm text-muted-foreground">Total Posts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Eye className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-semibold">{publishedCount}</p>
                <p className="text-sm text-muted-foreground">Published</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <EyeOff className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-2xl font-semibold">{draftCount}</p>
                <p className="text-sm text-muted-foreground">Drafts</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search posts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="news">News</SelectItem>
            <SelectItem value="insights">Insights</SelectItem>
            <SelectItem value="guides">Guides</SelectItem>
            <SelectItem value="company">Company</SelectItem>
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={fetchPosts} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Table */}
      <div className="flex-1 min-h-0 border overflow-auto bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Published</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2" />
                  Loading posts...
                </TableCell>
              </TableRow>
            ) : posts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  No posts found. Create your first post to get started.
                </TableCell>
              </TableRow>
            ) : (
              posts.map((post) => (
                <TableRow key={post.id}>
                  <TableCell className="font-medium max-w-[300px] truncate">
                    {post.title}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={categoryColors[post.category]}>
                      {post.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {post.is_published ? (
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Published</Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Draft</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {post.author_name}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    <FormattedDate dateString={post.published_at} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {post.is_published && (
                        <Button variant="ghost" size="icon" asChild title="View on site">
                          <Link href={`/resources/${post.slug}`} target="_blank">
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push(`/admin/blog/${post.slug}/edit`)}
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => {
                          setDeleteSlug(post.slug)
                          setDeleteTitle(post.title)
                        }}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages} ({total} total)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteSlug} onOpenChange={(open) => !open && setDeleteSlug(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Blog Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteTitle}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminPageShell>
  )
}
