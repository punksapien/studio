import { NextRequest, NextResponse } from 'next/server'
import { authServer } from '@/lib/auth-server'
import { getAllPosts, createPost, createBlogPostSchema, listBlogPostsSchema, type BlogCategory } from '@/lib/blog'

async function verifyAdmin(request: NextRequest) {
  const user = await authServer.getCurrentUser(request)
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const profile = await authServer.getCurrentUserProfile(request)
  if (!profile || profile.role !== 'admin') return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  return { user, profile }
}

// GET /api/admin/blog — List all posts (including drafts)
export async function GET(request: NextRequest) {
  const auth = await verifyAdmin(request)
  if ('error' in auth) return auth.error

  try {
    const url = new URL(request.url)
    const params = {
      page: url.searchParams.get('page') ? Number(url.searchParams.get('page')) : 1,
      limit: url.searchParams.get('limit') ? Number(url.searchParams.get('limit')) : 20,
      category: (url.searchParams.get('category') as BlogCategory) || undefined,
      search: url.searchParams.get('search') || undefined,
      status: (url.searchParams.get('status') as 'all' | 'published' | 'draft') || 'all',
    }

    const parsed = listBlogPostsSchema.safeParse(params)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid parameters', details: parsed.error.flatten() }, { status: 400 })
    }

    const { posts, total } = await getAllPosts(params)

    return NextResponse.json({
      posts,
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    })
  } catch (error) {
    console.error('[ADMIN-BLOG] Error fetching posts:', error)
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })
  }
}

// POST /api/admin/blog — Create a new blog post
export async function POST(request: NextRequest) {
  const auth = await verifyAdmin(request)
  if ('error' in auth) return auth.error

  try {
    const body = await request.json()
    const parsed = createBlogPostSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 })
    }

    const post = await createPost(parsed.data)
    return NextResponse.json(post, { status: 201 })
  } catch (error: unknown) {
    console.error('[ADMIN-BLOG] Error creating post:', error)
    const message = error instanceof Error ? error.message : 'Failed to create post'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
