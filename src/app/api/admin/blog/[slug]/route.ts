import { NextRequest, NextResponse } from 'next/server'
import { authServer } from '@/lib/auth-server'
import { getPostBySlugAdmin, updatePost, deletePost, updateBlogPostSchema } from '@/lib/blog'

async function verifyAdmin(request: NextRequest) {
  const user = await authServer.getCurrentUser(request)
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const profile = await authServer.getCurrentUserProfile(request)
  if (!profile || profile.role !== 'admin') return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  return { user, profile }
}

// GET /api/admin/blog/[slug] — Get a single post (including drafts)
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const auth = await verifyAdmin(request)
  if ('error' in auth) return auth.error

  try {
    const { slug } = await params
    const post = await getPostBySlugAdmin(slug)
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }
    return NextResponse.json(post)
  } catch (error) {
    console.error('[ADMIN-BLOG] Error fetching post:', error)
    return NextResponse.json({ error: 'Failed to fetch post' }, { status: 500 })
  }
}

// PATCH /api/admin/blog/[slug] — Update a post
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const auth = await verifyAdmin(request)
  if ('error' in auth) return auth.error

  try {
    const { slug } = await params
    const body = await request.json()
    const parsed = updateBlogPostSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 })
    }

    const post = await updatePost(slug, parsed.data)
    return NextResponse.json(post)
  } catch (error: unknown) {
    console.error('[ADMIN-BLOG] Error updating post:', error)
    const message = error instanceof Error ? error.message : 'Failed to update post'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// DELETE /api/admin/blog/[slug] — Delete a post
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const auth = await verifyAdmin(request)
  if ('error' in auth) return auth.error

  try {
    const { slug } = await params
    await deletePost(slug)
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('[ADMIN-BLOG] Error deleting post:', error)
    const message = error instanceof Error ? error.message : 'Failed to delete post'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
