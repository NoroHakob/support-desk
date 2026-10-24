#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/037164dec59bbe9a3a877ad888436c1dfd07c4581bee67c3cc5b06e7762c90cd/contract';
import startContract from '../../snapshots/037164dec59bbe9a3a877ad888436c1dfd07c4581bee67c3cc5b06e7762c90cd/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/97e9074f60bb84fbc33b85db810c79de6af4b75095e90422fef83dfe8af52a87/contract';
import endContract from '../../snapshots/97e9074f60bb84fbc33b85db810c79de6af4b75095e90422fef83dfe8af52a87/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, lit, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'chunks',
        columns: [
          col('content', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('created_at', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-date@1' },
          }),
          col('embedding', 'vector(1024)', {
            notNull: true,
            codecRef: { codecId: 'pg/vector@1', typeParams: { length: 1024 } },
          }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('position', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('source_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('workspace_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addColumn({
        schema: 'public',
        table: 'sources',
        column: col('etag', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'workspaces',
        column: col('knowledge_version', 'int4', {
          notNull: true,
          default: lit(0),
          codecRef: { codecId: 'pg/int4@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'workspaces',
        column: col('suggested_questions_version', 'int4', {
          notNull: true,
          default: lit(0),
          codecRef: { codecId: 'pg/int4@1' },
        }),
      }),
      this.createIndex({
        schema: 'public',
        table: 'chunks',
        index: 'chunks_source_id_idx_b2d19e21',
        columns: ['source_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'chunks',
        index: 'chunks_source_id_position_idx_6221f888',
        columns: ['source_id', 'position'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'chunks',
        index: 'chunks_workspace_id_idx_90a9f461',
        columns: ['workspace_id'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'chunks',
        foreignKey: {
          name: 'chunks_workspace_id_fkey',
          columns: ['workspace_id'],
          references: { schema: 'public', table: 'workspaces', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'chunks',
        foreignKey: {
          name: 'chunks_source_id_fkey',
          columns: ['source_id'],
          references: { schema: 'public', table: 'sources', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
