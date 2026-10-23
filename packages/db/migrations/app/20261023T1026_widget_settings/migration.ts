#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/0a61a68065fb84b5f898be812edd2dbe98538aa5b2ef668a8bd66b0a0afd6773/contract';
import endContract from '../../snapshots/0a61a68065fb84b5f898be812edd2dbe98538aa5b2ef668a8bd66b0a0afd6773/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/28cac544cd32f1a6dca349ac76ee890caa2bec74709f21fdfa75729217376956/contract';
import startContract from '../../snapshots/28cac544cd32f1a6dca349ac76ee890caa2bec74709f21fdfa75729217376956/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  col,
  fn,
  lit,
  sql,
} from '@prisma/orm-postgres/migration';
import postgres from '@prisma/orm-postgres/runtime';
import { contractFromJson } from '@prisma/orm-postgres/static';

const db = postgres({ contract: contractFromJson<End>(endContract) });

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'workspaces',
        column: col('agent_avatar_key', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'workspaces',
        column: col('allowed_domains', 'text[]', {
          notNull: true,
          default: fn(sql`'{}'`),
          codecRef: { codecId: 'pg/text@1', many: true },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'workspaces',
        column: col('greeting', 'text', {
          notNull: true,
          default: lit('Hi there! How can we help you today?'),
          codecRef: { codecId: 'pg/text@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'workspaces',
        column: col('snippet_installed_at', 'timestamptz', {
          codecRef: { codecId: 'pg/timestamptz-date@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'workspaces',
        column: col('suggested_questions', 'text[]', {
          notNull: true,
          default: fn(sql`'{}'`),
          codecRef: { codecId: 'pg/text@1', many: true },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'workspaces',
        column: col('widget_color', 'text', {
          notNull: true,
          default: lit('blue'),
          codecRef: { codecId: 'pg/text@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'workspaces',
        column: col('widget_position', 'text', {
          notNull: true,
          default: lit('bottom-right'),
          codecRef: { codecId: 'pg/text@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'workspaces',
        column: col('agent_name', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.dataTransform(db.contract, 'backfill-workspaces-agent_name', {
        backfillsColumn: { schema: 'public', table: 'workspaces', column: 'agent_name' },
        check: () =>
          db.sql.public.workspaces
            .select('id')
            .where((f, fns) => fns.eq(f.agent_name, null))
            .limit(1),
        run: () =>
          db.raw.sql`UPDATE "workspaces" SET "agent_name" = "name" || ' Agent' WHERE "agent_name" IS NULL`.affectedCount(),
      }),
      this.setNotNull({ schema: 'public', table: 'workspaces', column: 'agent_name' }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'workspaces',
        constraint: 'workspaces_allowed_domains_elem_not_null_50f9fffb',
        expression: sql`array_position("allowed_domains", NULL) IS NULL`,
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'workspaces',
        constraint: 'workspaces_suggested_questions_elem_not_null_4bc52d93',
        expression: sql`array_position("suggested_questions", NULL) IS NULL`,
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'workspaces',
        constraint: 'workspaces_widget_color_check_eb1bcf52',
        expression: sql`"widget_color" IN ('blue', 'indigo', 'violet', 'pink', 'red', 'orange', 'green')`,
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'workspaces',
        constraint: 'workspaces_widget_position_check_58d2c3c7',
        expression: sql`"widget_position" IN ('bottom-left', 'bottom-right')`,
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
