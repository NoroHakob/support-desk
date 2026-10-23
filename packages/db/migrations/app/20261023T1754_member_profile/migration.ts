#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/43cdbf79f56ff66d043c0a2dfab9dbef3a99e19ea0b98c49a9a2694724ec14e8/contract';
import startContract from '../../snapshots/43cdbf79f56ff66d043c0a2dfab9dbef3a99e19ea0b98c49a9a2694724ec14e8/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/8bf8745dc632cc0ce30cf1a7df42d98518aa2e67c305ab05606167cef55e7d34/contract';
import endContract from '../../snapshots/8bf8745dc632cc0ce30cf1a7df42d98518aa2e67c305ab05606167cef55e7d34/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'members',
        column: col('image_url', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'members',
        column: col('name', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
