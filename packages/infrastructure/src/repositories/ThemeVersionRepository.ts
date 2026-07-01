// @ts-nocheck
import { eq, and, sql } from 'drizzle-orm';
import { 
  themes,
  themeDrafts, 
  themeVersions, 
  themeVersionAssetReferences, 
  themeVersionEvents, 
  themePublications 
} from '../../../../infrastructure/src/schema/theme';

export class ThemeVersionRepository {
  constructor(private readonly db: any) {}

  async getTheme(themeId: string): Promise<{ id: string, tenantId: string } | null> {
    const res = await this.db.select({ id: themes.id, tenantId: themes.tenantId }).from(themes).where(eq(themes.id, themeId)).limit(1);
    return res[0] || null;
  }

  async getDraftConfig(tx: any, themeId: string) {
    const drafts = await tx.select().from(themeDrafts).where(eq(themeDrafts.themeId, themeId)).limit(1);
    return drafts[0] || null;
  }

  async getNextVersionNumber(tx: any, themeId: string): Promise<number> {
    const res = await tx.select({ versionNumber: themeVersions.versionNumber })
      .from(themeVersions)
      .where(eq(themeVersions.themeId, themeId))
      .orderBy(sql`${themeVersions.versionNumber} DESC`)
      .limit(1);
    return res[0] ? res[0].versionNumber + 1 : 1;
  }

  async createVersion(tx: any, data: any): Promise<string> {
    const [res] = await tx.insert(themeVersions).values(data).returning({ id: themeVersions.id });
    return res.id;
  }

  async unsetCurrentForOthers(tx: any, themeId: string, currentVersionId: string): Promise<void> {
    await tx.update(themeVersions)
      .set({ isCurrent: false })
      .where(and(eq(themeVersions.themeId, themeId), sql`${themeVersions.id} != ${currentVersionId}`));
  }

  async addAssetReferences(tx: any, tenantId: string, versionId: string, assetIds: string[]): Promise<void> {
    if (assetIds.length === 0) return;
    const values = assetIds.map(assetId => ({
      tenantId,
      versionId,
      assetId
    }));
    await tx.insert(themeVersionAssetReferences).values(values);
  }

  async logEvent(tx: any, data: any): Promise<void> {
    await tx.insert(themeVersionEvents).values(data);
  }

  async updatePublication(tx: any, themeId: string, versionId: string, actorId: string): Promise<void> {
    await tx.insert(themePublications).values({
      themeId,
      activeVersionId: versionId,
      publishedBy: actorId
    }).onConflictDoUpdate({
      target: themePublications.themeId,
      set: {
        activeVersionId: versionId,
        publishedBy: actorId,
        publishedAt: new Date()
      }
    });
  }
}
