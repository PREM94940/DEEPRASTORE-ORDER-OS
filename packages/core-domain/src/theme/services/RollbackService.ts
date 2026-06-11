import { 
  IThemeVersionRepository, 
  ThemeVersion, 
  CreateThemeVersionDTO 
} from '../repositories/IThemeVersionRepository';

export class RollbackService {
  constructor(private readonly repository: IThemeVersionRepository) {}

  /**
   * Reverts a theme to a historical version by creating a new snapshot.
   * 
   * Features:
   * - Linear rollback: NEVER mutates historical versions.
   * - Example: Reverting V2 to V1 creates V3 (a snapshot of V1).
   * - Populates `parentVersionId` with the current latest version.
   * - Populates `createdFromVersionId` with the target rollback version.
   * - Logs a `VERSION_ROLLED_BACK` event.
   */
  async rollback(
    tenantId: string,
    themeId: string,
    targetRollbackVersionId: string,
    actorId: string
  ): Promise<ThemeVersion> {
    const theme = await this.repository.getTheme(themeId);
    if (!theme) {
      throw new Error(`Theme ${themeId} not found.`);
    }
    if (theme.tenantId !== tenantId) {
      throw new Error('Authorization failed: Theme does not belong to the given tenant.');
    }

    const targetVersion = await this.repository.getVersionById(targetRollbackVersionId);
    if (!targetVersion) {
      throw new Error(`Target version ${targetRollbackVersionId} not found.`);
    }

    if (targetVersion.themeId !== themeId) {
      throw new Error(`Target version does not belong to theme ${themeId}.`);
    }

    const latestVersion = await this.repository.getLatestVersion(themeId);
    if (!latestVersion) {
      throw new Error(`No versions found for theme ${themeId}.`);
    }

    // Determine new version number
    const newVersionNumber = latestVersion.versionNumber + 1;
    
    // Create new version snapshot from target version
    const newVersionDTO: CreateThemeVersionDTO = {
      themeId,
      versionName: targetVersion.versionName 
        ? `Rollback of ${targetVersion.versionName}` 
        : `Rollback to V${targetVersion.versionNumber}`,
      versionNumber: newVersionNumber,
      state: 'DRAFT', // Kept as DRAFT until explicitly published
      isCurrent: false, // Not active until published
      parentVersionId: latestVersion.id, // The version that was active/latest before rollback
      createdFromVersionId: targetVersion.id, // The version we are reverting to
      changeSummary: `Rolled back to version ${targetVersion.versionNumber}`,
      config: targetVersion.config, // Copy the exact config from historical version
      isPublished: false,
      createdBy: actorId,
    };

    const createdVersion = await this.repository.createVersion(newVersionDTO);

    // Integrate themeVersionEvents logging
    await this.repository.logEvent({
      tenantId,
      themeId,
      versionId: createdVersion.id,
      eventType: 'VERSION_ROLLED_BACK',
      actorId,
      metadata: {
        rolledBackToVersionId: targetVersion.id,
        rolledBackToVersionNumber: targetVersion.versionNumber,
        previousLatestVersionId: latestVersion.id,
      },
    });

    return createdVersion;
  }
}
