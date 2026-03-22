'use client'

import * as React from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, Upload, X, Loader2, RefreshCw } from 'lucide-react'
import type { BlogPost } from '@/lib/blog'

export default function EditBlogPostPage() {
  const router = useRouter()
  const params = useParams()
  const slugParam = params.slug as string
  const { toast } = useToast()

  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [uploading, setUploading] = React.useState(false)

  // Form state
  const [title, setTitle] = React.useState('')
  const [slug, setSlug] = React.useState('')
  const [excerpt, setExcerpt] = React.useState('')
  const [content, setContent] = React.useState('')
  const [coverImageUrl, setCoverImageUrl] = React.useState<string | null>(null)
  const [category, setCategory] = React.useState<string>('insights')
  const [tagsInput, setTagsInput] = React.useState('')
  const [authorName, setAuthorName] = React.useState('')
  const [authorRole, setAuthorRole] = React.useState('')
  const [readingTime, setReadingTime] = React.useState(5)
  const [isPublished, setIsPublished] = React.useState(false)
  const [metaTitle, setMetaTitle] = React.useState('')
  const [metaDescription, setMetaDescription] = React.useState('')

  // Load existing post
  React.useEffect(() => {
    async function loadPost() {
      try {
        const res = await fetch(`/api/admin/blog/${slugParam}`)
        if (!res.ok) throw new Error('Failed to load post')
        const post: BlogPost = await res.json()

        setTitle(post.title)
        setSlug(post.slug)
        setExcerpt(post.excerpt)
        setContent(post.content)
        setCoverImageUrl(post.cover_image_url)
        setCategory(post.category)
        setTagsInput(post.tags.join(', '))
        setAuthorName(post.author_name)
        setAuthorRole(post.author_role || '')
        setReadingTime(post.reading_time_minutes)
        setIsPublished(post.is_published)
        setMetaTitle(post.meta_title || '')
        setMetaDescription(post.meta_description || '')
      } catch {
        toast({ title: 'Error', description: 'Failed to load post', variant: 'destructive' })
      } finally {
        setLoading(false)
      }
    }
    loadPost()
  }, [slugParam, toast])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/admin/blog/upload', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Upload failed')
      }

      const data = await res.json()
      setCoverImageUrl(data.url)
      toast({ title: 'Image uploaded', description: 'Cover image uploaded successfully.' })
    } catch (err) {
      toast({
        title: 'Upload failed',
        description: err instanceof Error ? err.message : 'Failed to upload image',
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async () => {
    if (!title.trim() || !slug.trim() || !excerpt.trim() || !content.trim()) {
      toast({ title: 'Validation error', description: 'Title, slug, excerpt, and content are required.', variant: 'destructive' })
      return
    }

    setSaving(true)
    try {
      const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean)

      const body: Record<string, unknown> = {
        title: title.trim(),
        slug: slug.trim(),
        excerpt: excerpt.trim(),
        content: content.trim(),
        cover_image_url: coverImageUrl || null,
        category,
        tags,
        author_name: authorName.trim() || 'Nobridge Team',
        author_role: authorRole.trim() || null,
        reading_time_minutes: readingTime,
        is_published: isPublished,
        meta_title: metaTitle.trim() || null,
        meta_description: metaDescription.trim() || null,
      }

      // Set published_at if publishing for the first time
      if (isPublished) {
        body.published_at = new Date().toISOString()
      }

      const res = await fetch(`/api/admin/blog/${slugParam}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update post')
      }

      const updatedPost = await res.json()

      toast({
        title: 'Post updated',
        description: `"${title}" has been updated successfully.`,
      })

      // If slug changed, redirect to new slug
      if (updatedPost.slug !== slugParam) {
        router.push(`/admin/blog/${updatedPost.slug}/edit`)
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to update post',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-3 text-muted-foreground">Loading post...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/blog">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Blog Post</h1>
          <p className="text-muted-foreground">Editing: {title}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Post Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter post title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="url-friendly-slug"
              />
              <p className="text-xs text-muted-foreground">URL: /resources/{slug || '...'}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="excerpt">Excerpt *</Label>
              <Textarea
                id="excerpt"
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="Brief summary of the post"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Content (HTML) *</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="<h2>Section Title</h2><p>Your content here...</p>"
                rows={15}
                className="font-mono text-sm"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cover Image</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {coverImageUrl ? (
              <div className="relative">
                <img
                  src={coverImageUrl}
                  alt="Cover preview"
                  className="w-full max-h-64 object-cover rounded-lg border"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={() => setCoverImageUrl(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground mb-3">
                  Upload a cover image (JPEG, PNG, WebP, AVIF, max 5MB)
                </p>
                <label>
                  <Input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                  <Button variant="outline" asChild disabled={uploading}>
                    <span>
                      {uploading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        'Choose File'
                      )}
                    </span>
                  </Button>
                </label>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Metadata</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="news">News</SelectItem>
                    <SelectItem value="insights">Insights</SelectItem>
                    <SelectItem value="guides">Guides</SelectItem>
                    <SelectItem value="company">Company</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reading-time">Reading Time (min)</Label>
                <Input
                  id="reading-time"
                  type="number"
                  min={1}
                  max={120}
                  value={readingTime}
                  onChange={(e) => setReadingTime(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma separated)</Label>
              <Input
                id="tags"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="M&A, Southeast Asia, Valuation"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="author-name">Author Name</Label>
                <Input
                  id="author-name"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="Nobridge Team"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="author-role">Author Role</Label>
                <Input
                  id="author-role"
                  value={authorRole}
                  onChange={(e) => setAuthorRole(e.target.value)}
                  placeholder="Market Intelligence"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>SEO</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="meta-title">Meta Title</Label>
              <Input
                id="meta-title"
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                placeholder="Custom SEO title (defaults to post title)"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="meta-description">Meta Description</Label>
              <Textarea
                id="meta-description"
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                placeholder="Custom SEO description (defaults to excerpt)"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Publish toggle + Actions */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Switch
                  id="publish"
                  checked={isPublished}
                  onCheckedChange={setIsPublished}
                />
                <Label htmlFor="publish" className="cursor-pointer">
                  {isPublished ? 'Published' : 'Draft'}
                </Label>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" asChild>
                  <Link href="/admin/blog">Cancel</Link>
                </Button>
                <Button onClick={handleSubmit} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
