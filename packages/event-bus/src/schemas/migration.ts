export interface MigrationEvent<T> {
  id: string;
  name: `system.migration.${string}`;
  timestamp: string;
  data: T;
}
