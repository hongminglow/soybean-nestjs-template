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
    output: `${result.stdout || ''}\n${result.stderr || ''}`,
  };
}

function getPendingMigrations(output) {
  let marker = 'Following migrations have not yet been applied:';
  let markerIndex = output.indexOf(marker);
  
  if (markerIndex === -1) {
    marker = 'Following migration have not yet been applied:';
    markerIndex = output.indexOf(marker);
  }
  
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

function baselinePendingMigrations() {
  const statusResult = runCapture('pnpm', ['db:status']);
  const pendingMigrations = getPendingMigrations(statusResult.output);

  if (pendingMigrations.length === 0) {
    console.error('Could not detect pending migrations for baseline.');
    return statusResult.status || 1;
  }

  for (const migrationName of pendingMigrations) {
    const resolveStatus = run('pnpm', [
      'prisma',
      'migrate',
      'resolve',
      '--applied',
      migrationName,
    ]);
    if (resolveStatus !== 0) return resolveStatus;
  }

  const verifyStatus = run('pnpm', ['db:status']);
  return verifyStatus;
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
    const trimmed = sql.trimStart();
    const isRepairMigration = trimmed.startsWith('-- IdempotentRepair');

    if (!isRepairMigration) continue;

    const relativeMigrationFile = path
      .relative(path.join(__dirname, '..'), migrationFile)
      .split(path.sep)
      .join('/');

    console.log(`Applying idempotent repair SQL: ${relativeMigrationFile}`);
    const executeStatus = run('pnpm', [
      'prisma',
      'db',
      'execute',
      '--file',
      relativeMigrationFile,
    ]);
    if (executeStatus !== 0) return executeStatus;
  }

  return 0;
}

const generateStatus = run('pnpm', ['prisma:generate']);
if (generateStatus !== 0) process.exit(generateStatus);

const deployResult = runCapture('pnpm', ['db:deploy']);

if (deployResult.status !== 0) {
  const isSchemaNotEmpty = deployResult.output.includes('P3005');
  const isAlreadyExists = /already exists/i.test(deployResult.output);

  if (!isSchemaNotEmpty && !isAlreadyExists) {
    process.exit(deployResult.status);
  }

  console.log(
    isSchemaNotEmpty
      ? 'Detected P3005 (schema not empty). Baseline pending migrations, then continue with seed.'
      : 'Detected existing schema objects (already exists). Baseline pending migrations, then retry deploy and continue with seed.',
  );

  const baselineStatus = baselinePendingMigrations();
  if (baselineStatus !== 0) process.exit(baselineStatus);

  const retryDeployResult = runCapture('pnpm', ['db:deploy']);
  if (retryDeployResult.status !== 0) process.exit(retryDeployResult.status);
}

const repairStatus = runIdempotentMigrationRepairs();
if (repairStatus !== 0) process.exit(repairStatus);

const seedStatus = run('pnpm', ['db:seed']);
process.exit(seedStatus);
