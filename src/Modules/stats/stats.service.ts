import { StatsRepository, type BlogStats } from '../../Repository/stats.repository.js';

export class StatsService {
  constructor(private readonly stats = new StatsRepository()) {}

  getStats(): Promise<BlogStats> {
    return this.stats.getStats();
  }
}
