export interface ThemeVersion {
  id: string;
  themeId: string;
  versionName: string | null;
  versionNumber: number;
  state: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  isCurrent: boolean;
  parentVersionId: string | null;
  createdFromVersionId: string | null;
  changeSummary: string | null;
  config: any;
  isPublished: boolean;
  createdBy: string | null;
  createdAt: Date | null;
}

export interface CreateThemeVersionDTO {
  themeId: string;
  versionName?: string | null;
  versionNumber: number;
  state?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  isCurrent?: boolean;
  parentVersionId?: string | null;
  createdFromVersionId?: string | null;
  changeSummary?: string | null;
  config?: any;
  isPublished?: boolean;
  createdBy?: string | null;
}

export interface ThemeVersionEvent {
  tenantId: string;
  themeId: string;
  versionId: string | null;
  eventType: string;
  actorId: string;
  metadata: any;
}

export interface IThemeVersionRepository {
  getVersionById(id: string): Promise<ThemeVersion | null>;
  getTheme(themeId: string): Promise<{ id: string, tenantId: string } | null>;
  getLatestVersion(themeId: string): Promise<ThemeVersion | null>;
  createVersion(data: CreateThemeVersionDTO): Promise<ThemeVersion>;
  logEvent(event: ThemeVersionEvent): Promise<void>;
}
