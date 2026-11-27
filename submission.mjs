#!/usr/bin/env node
/**
 * Make.fun Submission Helper for SKY WARRIOR: DOMINION
 * Competition: https://make.fun/bounty/best-flight-game-20261126-0057
 * Repository:  https://github.com/Bsp-05/sky-warrior-dominion
 *
 * Encapsulates:
 *   1. Authentication checks (~/.makefun/credentials & live CLI status/profile)
 *   2. Project structure, dossier.json, build & test verification
 *   3. Genuine transcript bundling via the official Make.fun CLI (no fabrication)
 *   4. Safe gated submission (requires explicit --yes confirmation)
 */

import { spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  statSync,
} from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const COMPETITION_SLUG = 'best-flight-game-20261126-0057';
const DEFAULT_ORIGIN = 'https://make.fun';
const DEFAULT_REPO_URL = 'https://github.com/Bsp-05/sky-warrior-dominion';
const DEFAULT_TITLE = 'SKY WARRIOR: DOMINION';
const KIT_URL = `https://make.fun/c/${COMPETITION_SLUG}/kit`;
const DEFAULT_BUNDLE_FILE = 'transcript.tr.gz';
const MAX_SCREENSHOT_BYTES = 262144;
const MAX_SCREENSHOTS = 4;

const HERE = dirname(fileURLToPath(import.meta.url));

function printHelp() {
  console.log(`SKY WARRIOR: DOMINION — Make.fun Submission Helper

Usage:
  node submission.mjs <command> [options]

Commands:
  check         Verify auth, project structure, dossier build, and kit readiness (default)
  login         Check current auth or run official makefun login (reuses existing wallet)
  bundle        Generate genuine transcript bundle via official Make.fun CLI
  submit        Validate everything and submit entry (requires --yes)

Options:
  --repo <dir>          Repository / project directory (default: script directory)
  --kit <dir>           Path to extracted ${COMPETITION_SLUG}-kit
  --download-kit        Download and extract the official kit if not found locally
  --out <file>          Transcript bundle output path (default: ${DEFAULT_BUNDLE_FILE})
  --bundle <file>       Transcript bundle path for check/submit (default: ${DEFAULT_BUNDLE_FILE})
  --repo-url <url>      GitHub repository URL (default: ${DEFAULT_REPO_URL})
  --title <text>        Submission title (default: "${DEFAULT_TITLE}")
  --build               Run unit tests, lint, Vite build, and offline game build
  --harness <name>      Optional --harness pass-through for makefun bundle
  --model <id>          Optional --model pass-through for makefun bundle
  --provider <name>     Optional --provider pass-through for makefun bundle
  --effort <level>      Optional --effort pass-through for makefun bundle
  --system-prompt <f>   Optional --system-prompt pass-through for makefun bundle
  --redact <text>       Optional --redact pass-through (repeatable)
  --new-keypair         Allow login to create a fresh wallet (only if desired)
  --yes                 Confirm live submission (required by submit)
  --help, -h            Show this help message
`);
}

function parseArgs(argv) {
  const positionals = [];
  const flags = {
    repo: HERE,
    kit: process.env.MAKEFUN_KIT || '',
    downloadKit: false,
    out: DEFAULT_BUNDLE_FILE,
    bundle: DEFAULT_BUNDLE_FILE,
    repoUrl: DEFAULT_REPO_URL,
    title: DEFAULT_TITLE,
    build: false,
    harness: '',
    model: '',
    provider: '',
    effort: '',
    systemPrompt: '',
    redact: [],
    newKeypair: false,
    yes: false,
    help: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith('-')) {
      positionals.push(arg);
      continue;
    }
    const next = () => {
      if (i + 1 >= argv.length) {
        throw new Error(`Missing value for flag ${arg}`);
      }
      return argv[++i];
    };
    switch (arg) {
      case '--help':
      case '-h':
        flags.help = true;
        break;
      case '--repo':
        flags.repo = resolve(next());
        break;
      case '--kit':
        flags.kit = resolve(next());
        break;
      case '--download-kit':
        flags.downloadKit = true;
        break;
      case '--out':
        flags.out = next();
        break;
      case '--bundle':
        flags.bundle = next();
        break;
      case '--repo-url':
        flags.repoUrl = next();
        break;
      case '--title':
        flags.title = next();
        break;
      case '--build':
        flags.build = true;
        break;
      case '--harness':
        flags.harness = next();
        break;
      case '--model':
        flags.model = next();
        break;
      case '--provider':
        flags.provider = next();
        break;
      case '--effort':
        flags.effort = next();
        break;
      case '--system-prompt':
        flags.systemPrompt = next();
        break;
      case '--redact':
        flags.redact.push(next());
        break;
      case '--new-keypair':
        flags.newKeypair = true;
        break;
      case '--yes':
        flags.yes = true;
        break;
      default:
        throw new Error(`Unknown option: ${arg}`);
    }
  }

  return {
    command: positionals[0] || 'check',
    flags,
  };
}

function runCommand(cmd, args, options = {}) {
  const result = spawnSync(cmd, args, {
    cwd: options.cwd || HERE,
    env: options.env ? { ...process.env, ...options.env } : process.env,
    encoding: 'utf8',
    stdio: options.inherit ? 'inherit' : 'pipe',
    shell: false,
  });
  return {
    status: result.status ?? 1,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
    error: result.error ?? null,
  };
}

function findKitDir(repoDir, explicitKit) {
  const candidates = [
    explicitKit,
    join(repoDir, `${COMPETITION_SLUG}-kit`),
    join(repoDir, '..', `${COMPETITION_SLUG}-kit`),
    join(repoDir, '.makefun-kit', `${COMPETITION_SLUG}-kit`),
    `/tmp/kit_inspect/${COMPETITION_SLUG}-kit`,
  ].filter(Boolean);

  for (const dir of candidates) {
    const cliPath = join(dir, 'cli', 'makefun.mjs');
    if (existsSync(cliPath)) {
      return { kitDir: resolve(dir), cliPath: resolve(cliPath) };
    }
  }
  return null;
}

function ensureKit(repoDir, explicitKit, allowDownload) {
  const existing = findKitDir(repoDir, explicitKit);
  if (existing) return existing;

  if (!allowDownload) {
    return null;
  }

  const extractBase = join(repoDir, '.makefun-kit');
  mkdirSync(extractBase, { recursive: true });
  console.log(`Downloading official kit from ${KIT_URL}...`);
  const dl = runCommand(
    'sh',
    ['-c', `curl -fsSL "${KIT_URL}" | tar xz -C "${extractBase}"`],
    { cwd: repoDir, inherit: true },
  );
  if (dl.status !== 0) {
    throw new Error(`Failed to download/extract Make.fun kit (exit ${dl.status}).`);
  }
  const downloaded = findKitDir(repoDir, join(extractBase, `${COMPETITION_SLUG}-kit`));
  if (!downloaded) {
    throw new Error(`Kit downloaded to ${extractBase}, but cli/makefun.mjs was not found.`);
  }
  return downloaded;
}

function inspectCredentials() {
  const credsPath =
    process.env.MAKEFUN_CREDENTIALS || join(homedir(), '.makefun', 'credentials');
  if (!existsSync(credsPath)) {
    return {
      ok: false,
      credsPath,
      reason: 'Credentials file not found (run Make.fun login first).',
    };
  }

  let parsed;
  try {
    parsed = JSON.parse(readFileSync(credsPath, 'utf8'));
  } catch (err) {
    return {
      ok: false,
      credsPath,
      reason: `Unable to parse credentials JSON: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  const originEntry = parsed?.keys?.[DEFAULT_ORIGIN];
  if (!originEntry || !originEntry.key) {
    return {
      ok: false,
      credsPath,
      reason: `No active API key stored for ${DEFAULT_ORIGIN}.`,
    };
  }

  const expiresMs = Date.parse(originEntry.expires_at ?? '');
  const expired = !Number.isFinite(expiresMs) || expiresMs <= Date.now();
  const keypairExists = originEntry.keypair_file
    ? existsSync(originEntry.keypair_file)
    : false;

  // Never print or expose originEntry.key
  return {
    ok: !expired,
    credsPath,
    handle: originEntry.handle || null,
    wallet: originEntry.wallet || null,
    expiresAt: originEntry.expires_at || null,
    expired,
    keypairFile: originEntry.keypair_file || null,
    keypairExists,
    hasSignerCmd: Boolean(originEntry.signer_cmd),
    reason: expired ? `Stored API key expired at ${originEntry.expires_at}` : null,
  };
}

function checkAuth(kit) {
  console.log('\n[1/4] Checking Make.fun authentication...');
  const creds = inspectCredentials();
  if (!creds.ok) {
    console.log(`  FAIL: ${creds.reason}`);
    if (creds.wallet) {
      console.log(`  Configured wallet: ${creds.wallet} (@${creds.handle ?? 'unknown'})`);
    }
    return { ok: false, creds };
  }

  console.log(`  OK: Credentials present for @${creds.handle ?? 'unknown'} (${creds.credsPath})`);
  console.log(`  Wallet: ${creds.wallet ?? 'none'}`);
  console.log(`  Expires: ${creds.expiresAt}`);
  if (creds.keypairFile) {
    console.log(
      `  Keypair: ${creds.keypairFile} (${creds.keypairExists ? 'present' : 'missing'})`,
    );
  }

  if (kit) {
    const statusRes = runCommand(
      'node',
      [kit.cliPath, 'status', '--competition', COMPETITION_SLUG],
      { cwd: kit.kitDir },
    );
    if (statusRes.status === 0) {
      console.log('  OK: Live Make.fun API authenticated.');
      for (const line of statusRes.stdout.trim().split('\n').slice(0, 8)) {
        if (line.trim()) console.log(`    ${line}`);
      }
    } else {
      console.log(`  WARN: makefun status exited ${statusRes.status}:`);
      console.log(`    ${(statusRes.stderr || statusRes.stdout).trim()}`);
      return { ok: false, creds };
    }
  }

  return { ok: true, creds };
}

function checkProjectStructure(repoDir) {
  console.log('\n[2/4] Verifying project structure & Make.fun deliverables...');
  const failures = [];
  const warnings = [];

  const requiredFiles = [
    'main.ts',
    'LICENSE',
    'vendor/makefun-game.ts',
    'shots.json',
    'README.md',
    'package.json',
    'game/index.html',
    'src/App.tsx',
    'src/game/engine.ts',
    'src/game/rules.ts',
    'src/game/rules.test.ts',
  ];

  for (const rel of requiredFiles) {
    const full = join(repoDir, rel);
    if (!existsSync(full)) {
      failures.push(`Missing required file: ${rel}`);
    }
  }

  // LICENSE check
  const licensePath = join(repoDir, 'LICENSE');
  if (existsSync(licensePath)) {
    const lic = readFileSync(licensePath, 'utf8');
    if (!/MIT License|SPDX-License-Identifier:\s*MIT|Apache License|ISC License/i.test(lic)) {
      warnings.push('LICENSE does not explicitly match standard MIT/Apache/ISC text.');
    }
  }

  // README badge check
  const readmePath = join(repoDir, 'README.md');
  if (existsSync(readmePath)) {
    const readme = readFileSync(readmePath, 'utf8');
    if (!readme.includes(COMPETITION_SLUG)) {
      failures.push(`README.md does not reference ${COMPETITION_SLUG} (required by repo_readme).`);
    }
  }

  // .makefun/owner.json check
  const ownerPath = join(repoDir, '.makefun', 'owner.json');
  if (!existsSync(ownerPath)) {
    warnings.push('.makefun/owner.json missing (required if GitHub login differs from Make.fun login).');
  } else {
    try {
      const owner = JSON.parse(readFileSync(ownerPath, 'utf8'));
      if (!owner?.wallet || typeof owner.wallet !== 'string') {
        failures.push('.makefun/owner.json is missing a valid "wallet" string.');
      } else {
        console.log(`  OK: .makefun/owner.json wallet = ${owner.wallet}`);
      }
    } catch (err) {
      failures.push(`Invalid .makefun/owner.json: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // game/ offline check (no external Google Fonts links)
  const gameHtmlPath = join(repoDir, 'game', 'index.html');
  if (existsSync(gameHtmlPath)) {
    const html = readFileSync(gameHtmlPath, 'utf8');
    if (/fonts\.googleapis\.com|fonts\.gstatic\.com|https?:\/\/cdn/i.test(html)) {
      failures.push('game/index.html still references external CDN/font URLs (must run offline).');
    } else {
      console.log('  OK: game/index.html is offline-ready (no external font/CDN links).');
    }
  }

  // shots.json & screenshots check
  const shotsPath = join(repoDir, 'shots.json');
  if (existsSync(shotsPath)) {
    try {
      const shots = JSON.parse(readFileSync(shotsPath, 'utf8'));
      if (!Array.isArray(shots) || shots.length === 0) {
        failures.push('shots.json must be a non-empty JSON array.');
      } else {
        if (shots.length > MAX_SCREENSHOTS) {
          failures.push(`shots.json has ${shots.length} entries (max ${MAX_SCREENSHOTS}).`);
        }
        for (const shot of shots) {
          if (!shot?.name) {
            failures.push('shots.json entry missing "name".');
            continue;
          }
          const imgPath = join(repoDir, 'screenshots', shot.name);
          if (!existsSync(imgPath)) {
            failures.push(`Missing screenshot: screenshots/${shot.name}`);
            continue;
          }
          const bytes = statSync(imgPath).size;
          if (bytes === 0 || bytes > MAX_SCREENSHOT_BYTES) {
            failures.push(
              `screenshots/${shot.name} size is ${bytes} bytes (must be 1..${MAX_SCREENSHOT_BYTES}).`,
            );
          } else {
            console.log(`  OK: screenshots/${shot.name} (${Math.round(bytes / 1024)} KB)`);
          }
        }
      }
    } catch (err) {
      failures.push(`Invalid shots.json: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // Dossier build dry test via main.ts
  if (existsSync(join(repoDir, 'main.ts')) && existsSync(join(repoDir, 'game', 'index.html'))) {
    const tmpOut = mkdtempSync(join(tmpdir(), 'sky-warrior-dossier-'));
    try {
      const mainRes = runCommand('node', ['main.ts'], {
        cwd: repoDir,
        env: { MAKEFUN_OUTPUT_DIR: tmpOut },
      });
      if (mainRes.status !== 0) {
        failures.push(`node main.ts failed: ${(mainRes.stderr || mainRes.stdout).trim()}`);
      } else {
        const dossierPath = join(tmpOut, 'dossier.json');
        if (!existsSync(dossierPath)) {
          failures.push('node main.ts finished without writing dossier.json.');
        } else {
          const dossier = JSON.parse(readFileSync(dossierPath, 'utf8'));
          const imageCount = Array.isArray(dossier.images) ? dossier.images.length : 0;
          console.log(
            `  OK: main.ts produced ${dossier.schema ?? 'dossier.json'} (${Math.round(statSync(dossierPath).size / 1024)} KB, ${imageCount} screenshots).`,
          );
        }
      }
    } finally {
      rmSync(tmpOut, { recursive: true, force: true });
    }
  }

  // Git repository status
  const gitCheck = runCommand('git', ['rev-parse', '--is-inside-work-tree'], { cwd: repoDir });
  let gitInfo = { isRepo: false, head: null, remote: null, dirty: false };
  if (gitCheck.status === 0 && gitCheck.stdout.trim() === 'true') {
    const head = runCommand('git', ['rev-parse', 'HEAD'], { cwd: repoDir }).stdout.trim();
    const remote = runCommand('git', ['remote', 'get-url', 'origin'], { cwd: repoDir }).stdout.trim();
    const status = runCommand('git', ['status', '--porcelain'], { cwd: repoDir }).stdout.trim();
    gitInfo = { isRepo: true, head, remote, dirty: status.length > 0 };
    console.log(`  OK: Git repo HEAD = ${head} (origin: ${remote || 'none'})`);
    if (gitInfo.dirty) {
      warnings.push('Git working tree has uncommitted changes.');
    }
  } else {
    warnings.push(
      `${repoDir} is not a Git repository yet (required by makefun bundle and GitHub submission).`,
    );
  }

  for (const w of warnings) console.log(`  WARN: ${w}`);
  for (const f of failures) console.log(`  FAIL: ${f}`);

  return { ok: failures.length === 0, failures, warnings, gitInfo };
}

function runBuildAndTests(repoDir) {
  console.log('\n[2b/4] Running unit tests, TypeScript lint, and production builds...');
  const steps = [
    { name: 'Unit tests', cmd: 'npx', args: ['--yes', 'tsx', '--test', 'src/game/rules.test.ts'] },
    { name: 'TypeScript lint', cmd: 'npm', args: ['run', 'lint'] },
    { name: 'App build (dist/)', cmd: 'npm', args: ['run', 'build'] },
    { name: 'Offline Make.fun build (game/)', cmd: 'npm', args: ['run', 'build:game'] },
  ];

  for (const step of steps) {
    console.log(`  Running ${step.name}...`);
    const res = runCommand(step.cmd, step.args, { cwd: repoDir });
    if (res.status !== 0) {
      console.log(`  FAIL: ${step.name} failed (exit ${res.status}):`);
      console.log((res.stderr || res.stdout).trim());
      return false;
    }
    console.log(`  OK: ${step.name} passed.`);
  }
  return true;
}

function buildBundleArgs(flags, repoDir, outPath, dryRun) {
  const args = ['bundle', '--repo', repoDir, '--out', outPath];
  if (flags.harness) args.push('--harness', flags.harness);
  if (flags.model) args.push('--model', flags.model);
  if (flags.provider) args.push('--provider', flags.provider);
  if (flags.effort) args.push('--effort', flags.effort);
  if (flags.systemPrompt) args.push('--system-prompt', flags.systemPrompt);
  for (const r of flags.redact) args.push('--redact', r);
  if (dryRun) args.push('--dry-run');
  return args;
}

function generateTranscriptBundle(kit, repoDir, flags) {
  console.log('\n[3/4] Generating transcript bundle via official Make.fun CLI...');
  if (!kit) {
    console.log(
      `  FAIL: Official Make.fun kit CLI not found. Re-run with --kit <dir> or --download-kit.`,
    );
    return { ok: false, bundlePath: null };
  }

  const gitCheck = runCommand('git', ['rev-parse', '--is-inside-work-tree'], { cwd: repoDir });
  if (gitCheck.status !== 0) {
    console.log(
      `  FAIL: ${repoDir} is not a Git repository. Clone ${DEFAULT_REPO_URL}, sync these files, and run a supported coding agent locally before bundling.`,
    );
    return { ok: false, bundlePath: null };
  }

  const outPath = resolve(repoDir, flags.out);
  const dryArgs = buildBundleArgs(flags, repoDir, outPath, true);
  const dryRes = runCommand('node', [kit.cliPath, ...dryArgs], { cwd: kit.kitDir });
  const dryText = `${dryRes.stdout}\n${dryRes.stderr}`;

  if (dryRes.status !== 0 || /0 session files so far|no session files found/i.test(dryText)) {
    console.log('  FAIL: No genuine coding-agent session logs found for this repository.');
    console.log(
      '  Refusing to fabricate transcripts. Run a Make.fun-supported client (Superbot, Gemini CLI, Claude Code, Codex CLI, or Cursor) inside this cloned repository first.',
    );
    if (dryText.trim()) {
      console.log(`  CLI output:\n${dryText.trim()}`);
    }
    return { ok: false, bundlePath: null };
  }

  const realArgs = buildBundleArgs(flags, repoDir, outPath, false);
  const bundleRes = runCommand('node', [kit.cliPath, ...realArgs], {
    cwd: kit.kitDir,
    inherit: true,
  });
  if (bundleRes.status !== 0 || !existsSync(outPath)) {
    console.log(`  FAIL: makefun bundle failed (exit ${bundleRes.status}).`);
    return { ok: false, bundlePath: null };
  }

  console.log(`  OK: Genuine transcript bundle created at ${outPath}`);
  return { ok: true, bundlePath: outPath };
}

function runKitCheck(kit, repoDir, bundlePath, useWorktree) {
  console.log('\n[4/4] Running official Make.fun gate check...');
  if (!kit) {
    console.log('  SKIP: Kit CLI not present (pass --kit <dir> or --download-kit).');
    return false;
  }

  const args = [kit.cliPath, 'check', '--kit', kit.kitDir, '--repo', repoDir];
  if (useWorktree) args.push('--worktree');
  if (bundlePath && existsSync(bundlePath)) {
    args.push('--transcripts', bundlePath);
  }
  const res = runCommand('node', args, { cwd: kit.kitDir, inherit: true });
  return res.status === 0;
}

function main() {
  let parsed;
  try {
    parsed = parseArgs(process.argv.slice(2));
  } catch (err) {
    console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
    printHelp();
    process.exit(2);
  }

  const { command, flags } = parsed;
  if (flags.help) {
    printHelp();
    process.exit(0);
  }

  let kit;
  try {
    kit = ensureKit(flags.repo, flags.kit, flags.downloadKit);
  } catch (err) {
    console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }

  if (kit) {
    console.log(`Using Make.fun kit CLI: ${kit.cliPath}`);
  } else {
    console.log(
      `Make.fun kit not found locally (pass --kit <dir> or --download-kit to fetch ${KIT_URL}).`,
    );
  }

  if (command === 'login') {
    if (!kit) {
      console.error('Error: --kit or --download-kit is required for login.');
      process.exit(1);
    }
    const creds = inspectCredentials();
    if (creds.ok && !flags.newKeypair) {
      console.log(
        `Already authenticated as @${creds.handle ?? 'unknown'} (wallet ${creds.wallet}, expires ${creds.expiresAt}).`,
      );
      process.exit(0);
    }
    const loginArgs = [kit.cliPath, 'login', '--origin', DEFAULT_ORIGIN];
    if (flags.newKeypair) loginArgs.push('--new-keypair');
    const loginRes = runCommand('node', loginArgs, { cwd: kit.kitDir, inherit: true });
    process.exit(loginRes.status);
  }

  if (command === 'check') {
    const auth = checkAuth(kit);
    if (flags.build) {
      const built = runBuildAndTests(flags.repo);
      if (!built) process.exit(1);
    }
    const structure = checkProjectStructure(flags.repo);
    const bundlePath = resolve(flags.repo, flags.bundle);
    const hasBundle = existsSync(bundlePath);
    const gateOk = runKitCheck(
      kit,
      flags.repo,
      hasBundle ? bundlePath : null,
      !structure.gitInfo.isRepo,
    );
    if (!auth.ok || !structure.ok || !gateOk) {
      process.exit(1);
    }
    process.exit(0);
  }

  if (command === 'bundle') {
    const structure = checkProjectStructure(flags.repo);
    if (!structure.ok) {
      process.exit(1);
    }
    const bundled = generateTranscriptBundle(kit, flags.repo, flags);
    if (!bundled.ok) {
      process.exit(1);
    }
    const gateOk = runKitCheck(kit, flags.repo, bundled.bundlePath, false);
    process.exit(gateOk ? 0 : 1);
  }

  if (command === 'submit') {
    const auth = checkAuth(kit);
    if (!auth.ok || !kit) {
      process.exit(1);
    }
    if (flags.build && !runBuildAndTests(flags.repo)) {
      process.exit(1);
    }
    const structure = checkProjectStructure(flags.repo);
    if (!structure.ok || !structure.gitInfo.isRepo || !structure.gitInfo.head) {
      console.error('Submit aborted: valid Git repository commit required.');
      process.exit(1);
    }
    if (structure.gitInfo.dirty) {
      console.error('Submit aborted: commit and push all working-tree changes first.');
      process.exit(1);
    }

    const pushed = runCommand(
      'git',
      ['branch', '-r', '--contains', structure.gitInfo.head],
      { cwd: flags.repo },
    );
    if (pushed.status !== 0 || !pushed.stdout.trim()) {
      console.error(
        `Submit aborted: commit ${structure.gitInfo.head} is not pushed to a remote branch yet.`,
      );
      process.exit(1);
    }

    const bundlePath = resolve(flags.repo, flags.bundle);
    if (!existsSync(bundlePath)) {
      console.error(
        `Submit aborted: transcript bundle not found at ${bundlePath}. Run "node submission.mjs bundle --out ${flags.bundle}" first.`,
      );
      process.exit(1);
    }

    const gateOk = runKitCheck(kit, flags.repo, bundlePath, false);
    if (!gateOk) {
      console.error('Submit aborted: makefun check failed.');
      process.exit(1);
    }

    if (!flags.yes) {
      console.error(
        'Dry guard active: all checks passed, but --yes was not specified so nothing was submitted.',
      );
      process.exit(2);
    }

    const submitArgs = [
      kit.cliPath,
      'submit',
      '--competition',
      COMPETITION_SLUG,
      '--repo-url',
      flags.repoUrl,
      '--commit',
      structure.gitInfo.head,
      '--title',
      flags.title,
      '--bundle',
      bundlePath,
    ];
    if (auth.creds.keypairFile && auth.creds.keypairExists) {
      submitArgs.push('--keypair', auth.creds.keypairFile);
    }

    console.log('\nSubmitting entry to Make.fun...');
    const submitRes = runCommand('node', submitArgs, { cwd: kit.kitDir, inherit: true });
    process.exit(submitRes.status);
  }

  console.error(`Unknown command: ${command}`);
  printHelp();
  process.exit(2);
}

main();
