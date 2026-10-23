#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/0a61a68065fb84b5f898be812edd2dbe98538aa5b2ef668a8bd66b0a0afd6773/contract';
import startContract from '../../snapshots/0a61a68065fb84b5f898be812edd2dbe98538aa5b2ef668a8bd66b0a0afd6773/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/43cdbf79f56ff66d043c0a2dfab9dbef3a99e19ea0b98c49a9a2694724ec14e8/contract';
import endContract from '../../snapshots/43cdbf79f56ff66d043c0a2dfab9dbef3a99e19ea0b98c49a9a2694724ec14e8/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  checkExpression,
  col,
  lit,
  primaryKey,
  sql,
} from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'sources',
        columns: [
          col('created_at', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-date@1' },
          }),
          col('error', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('kind', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('mime', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('revision', 'int4', {
            notNull: true,
            default: lit(0),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('size', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('status', 'text', {
            notNull: true,
            default: lit('uploaded'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('storage_key', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('text', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('updated_at', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-date@1' },
          }),
          col('workspace_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression('sources_kind_check_6299d266', sql`"kind" IN ('file', 'text')`),
          checkExpression(
            'sources_status_check_fde2d523',
            sql`"status" IN ('uploaded', 'processing', 'ready', 'failed')`,
          ),
        ],
      }),
      this.createIndex({
        schema: 'public',
        table: 'sources',
        index: 'sources_workspace_file_name_key_53efca60',
        columns: ['workspace_id', 'name'],
        extras: { where: sql`(kind = 'file')`, unique: true },
      }),
      this.createIndex({
        schema: 'public',
        table: 'sources',
        index: 'sources_workspace_id_created_at_idx_3f0db799',
        columns: ['workspace_id', 'created_at'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'sources',
        index: 'sources_workspace_id_idx_90a9f461',
        columns: ['workspace_id'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'sources',
        foreignKey: {
          name: 'sources_workspace_id_fkey',
          columns: ['workspace_id'],
          references: { schema: 'public', table: 'workspaces', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
