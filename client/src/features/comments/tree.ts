import type { Comment, CommentNode } from './types'

// Deleted comments stay only while they still anchor visible replies
function prune(nodes: CommentNode[]): CommentNode[] {
  return nodes
    .map((node) => ({ ...node, replies: prune(node.replies) }))
    .filter((node) => node.status === 'Published' || node.replies.length > 0)
}

export function buildCommentTree(comments: Comment[]) {
  const nodes = new Map<number, CommentNode>(
    comments.map((comment) => [comment.id, { ...comment, replies: [] }]),
  )
  const roots: CommentNode[] = []

  nodes.forEach((node) => {
    const parent = node.parentCommentId ? nodes.get(node.parentCommentId) : undefined
    if (parent) parent.replies.push(node)
    else roots.push(node)
  })

  return prune(roots)
}
