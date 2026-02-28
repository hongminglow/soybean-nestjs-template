const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

function run(command, args) {
  const result = spawnSync(command, args, { stdio: 'inherit', shell: true });
  return result.status ?? 1;
}

function runCapture(command, args) {
  const result = spawnSync(command, args, { encoding: 'utf8', shell: true });

  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);

  return {
    status: result.status ?? 1,
    output: `${result.stdout || ''}\n${result.stderr || ''}`
  };
}

function getPendingMigrations(output) {
  const marker = 'Following migrations have not yet been applied:';
  const markerIndex = output.indexOf(marker);
  if (markerIndex === -1) return [];

  const section = output.slice(markerIndex + marker.length);
  const lines = section.split(/\r?\n/).map(line => line.trim());
  const migrations = [];

  for (const line of lines) {
    if (!line) continue;
    if (line.startsWith('To apply')) break;
    if (line.startsWith('Loaded Prisma config')) continue;
    if (line.startsWith('Prisma schema loaded')) continue;
    if (line.startsWith('Datasource')) continue;
    if (line.startsWith('Error:')) continue;
    if (line.startsWith('ELIFECYCLE')) continue;
    migrations.push(line);
  }

  return migrations;
}

function runIdempotentMigrationRepairs() {
  const migrationsRoot = path.join(__dirname, '..', 'prisma', 'migrations');

  if (!fs.existsSync(migrationsRoot)) return 0;

  const migrationDirs = fs
    .readdirSync(migrationsRoot, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .sort();

  for (const migrationDir of migrationDirs) {
    const migrationFile = path.join(migrationsRoot, migrationDir, 'migration.sql');
    if (!fs.existsSync(migrationFile)) continue;

    const sql = fs.readFileSync(migrationFile, 'utf8');
    const hasIdempotentCreate = /IF\s+NOT\s+EXISTS/i.test(sql);

    if (!hasIdempotentCreate) continue;

    const relativeMigrationFile = path
      .relative(path.join(__dirname, '..'), migrationFile)
      .split(path.sep)
      .join('/');

    console.log(`Applying idempotent repair SQL: ${relativeMigrationFile}`);
    const executeStatus = run('pnpm', ['prisma', 'db', 'execute', '--file', relativeMigrationFile]);
    if (executeStatus !== 0) return executeStatus;
  }

  return 0;
}

const generateStatus = run('pnpm', ['prisma:generate']);
if (generateStatus !== 0) process.exit(generateStatus);

const deployResult = runCapture('pnpm', ['db:deploy']);
if (deployResult.status !== 0 && !deployResult.output.includes('P3005')) {
  process.exit(deployResult.status);
}

if (deployResult.status !== 0 && deployResult.output.includes('P3005')) {
  console.log('Detected P3005 (schema not empty). Baseline pending migrations, then continue with seed.');

  const statusResult = runCapture('pnpm', ['db:status']);
  const pendingMigrations = getPendingMigrations(statusResult.output);

  if (pendingMigrations.length === 0) {
    console.error('Could not detect pending migrations for baseline.');
    process.exit(statusResult.status || 1);
  }

  for (const migrationName of pendingMigrations) {
    const resolveStatus = run('pnpm', ['prisma', 'migrate', 'resolve', '--applied', migrationName]);
    if (resolveStatus !== 0) process.exit(resolveStatus);
  }

  const verifyStatus = run('pnpm', ['db:status']);
  if (verifyStatus !== 0) process.exit(verifyStatus);
}

const repairStatus = runIdempotentMigrationRepairs();
if (repairStatus !== 0) process.exit(repairStatus);

const seedStatus = run('pnpm', ['db:seed']);
process.exit(seedStatus);