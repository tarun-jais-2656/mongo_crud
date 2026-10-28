import { PostModel } from '../model/post.model.js';

export interface BlogStats {
  publishedPosts: number;
  topTags: { tag: string; count: number }[];
  topAuthors: { authorId: unknown; name: string; posts: number }[];
  mostCommentedPosts: { _id: unknown; title: string; commentCount: number }[];
}

export class StatsRepository {

  async getStats(): Promise<BlogStats> {
    const [facet] = await PostModel.aggregate<{
      publishedPosts: { total: number }[];
      topTags: { tag: string; count: number }[];
      topAuthors: { authorId: unknown; name: string; posts: number }[];
      mostCommentedPosts: { _id: unknown; title: string; commentCount: number }[];
    }>([
      { $match: { status: 'published' } },
      {
        $facet: {
          publishedPosts: [{ $count: 'total' }],

          topTags: [
            { $unwind: '$tags' },
            { $group: { _id: '$tags', count: { $sum: 1 } } },
            { $sort: { count: -1, _id: 1 } },
            { $limit: 10 },
            { $project: { _id: 0, tag: '$_id', count: 1 } },
          ],

          topAuthors: [
            { $group: { _id: '$author', posts: { $sum: 1 } } },
            { $sort: { posts: -1 } },
            { $limit: 5 },
            {
              $lookup: {
                from: 'users',
                localField: '_id',
                foreignField: '_id',
                as: 'user',
              },
            },
            { $unwind: '$user' },
            { $project: { _id: 0, authorId: '$_id', name: '$user.name', posts: 1 } },
          ],

          mostCommentedPosts: [
            { $sort: { commentCount: -1, createdAt: -1 } },
            { $limit: 5 },
            { $project: { _id: 1, title: 1, commentCount: 1 } },
          ],
        },
      },
    ]);

    return {
      publishedPosts: facet?.publishedPosts?.[0]?.total ?? 0,
      topTags: facet?.topTags ?? [],
      topAuthors: facet?.topAuthors ?? [],
      mostCommentedPosts: facet?.mostCommentedPosts ?? [],
    };
  }
}
