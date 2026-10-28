import { type Model, type PipelineStage } from 'mongoose';
import { z } from 'zod';
import { PAGINATION } from '../constants/index.js';
import { blankToUndefined } from './validators.js';

export interface PageParams {
  page: number;
  limit: number;
}

export interface PageRows<T = unknown> {
  data: T[];
  total: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T = unknown> {
  data: T[];
  pagination: PaginationMeta;
}

interface FacetPage<T> {
  data: T[];
  meta: { total: number }[];
}

type FacetStage = PipelineStage.FacetPipelineStage;

/**
 * The only pagination implementation. Query parsing, the Mongo `$facet`
 * page+count query, and the response metadata all live here.
 */
export class Paginator {
  static readonly query = z.object({
    page: z.preprocess(
      blankToUndefined,
      z.coerce.number().int().positive().default(PAGINATION.DEFAULT_PAGE),
    ),
    limit: z.preprocess(
      blankToUndefined,
      z.coerce.number().int().positive().max(PAGINATION.MAX_LIMIT).default(PAGINATION.DEFAULT_LIMIT),
    ),
  });

  static parse(input: unknown): PageParams {
    return Paginator.query.parse(input);
  }

  static slice(page: number, limit: number): FacetStage[] {
    return [{ $skip: (page - 1) * limit }, { $limit: limit }];
  }

  static async aggregate<T>(
    model: Model<T>,
    match: Record<string, unknown>,
    dataStages: FacetStage[],
  ): Promise<PageRows<T>> {
    const [facet] = await model.aggregate<FacetPage<T>>([
      { $match: match },
      {
        $facet: {
          data: dataStages,
          meta: [{ $count: 'total' }],
        },
      },
    ]);

    return {
      data: facet?.data ?? [],
      total: facet?.meta?.[0]?.total ?? 0,
    };
  }

  static meta(page: number, limit: number, total: number): PaginationMeta {
    return {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  static paginate<T>(page: number, limit: number, rows: PageRows<T>): Paginated<T> {
    return {
      data: rows.data,
      pagination: Paginator.meta(page, limit, rows.total),
    };
  }
}
