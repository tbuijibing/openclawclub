import * as migration_20260307_224735 from './20260307_224735';
import * as migration_migrate_from_typeorm from './migrate-from-typeorm';

export const migrations = [
  {
    up: migration_20260307_224735.up,
    down: migration_20260307_224735.down,
    name: '20260307_224735',
  },
  {
    up: migration_migrate_from_typeorm.up,
    down: migration_migrate_from_typeorm.down,
    name: 'migrate-from-typeorm'
  },
];
