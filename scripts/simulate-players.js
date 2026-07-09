#!/usr/bin/env node
// Manual-testing helper: spins up N headless/headed browser dummy players
// that join a real room code (from a game you're hosting yourself in an
// actual browser) and drive the real join UI, so you don't have to manually
// operate every player during a manual pass through the app.
//
// Usage:
//   npm run simulate -- --code=ABCD --players=5
//   npm run simulate -- --code=ABCD --players=1 --headed --url=http://localhost:5173
//
// Run this AFTER you've created a room as Storyteller (Host Game > Standard
// or Whale Buffet) and are still on the setup screen — the bots just join
// like any other player and wait for you to assign roles and open the
// Grimoire.
//
// Note on scope: unlike a turn-based game, players in this app are almost
// entirely passive observers of the Storyteller's grimoire — the only
// message a player ever sends back is `player_join` (initial join, pronoun
// updates, and Whale-Bucket preference submission). There's no voting or
// night-action UI reaching the host. So these bots join, pick random
// Whale-Bucket preferences if that's the game type, and then just wait for
// one of three things you can trigger from the Storyteller's screen:
//   - Open the Grimoire: the bot logs its assigned character token, then
//     keeps watching in case you reset the game later (see below).
//   - Reset the game, keeping players connected (`game_reset`): silently
//     sends everyone back to the lobby (and Whale-Bucket players back to
//     preferences) to await a new token — the bot detects this, resubmits
//     preferences if needed, and loops back to wait for the next reveal.
//   - Boot a player, or fully quit/disconnect: shows an in-app dialog, which
//     the bot logs, dismisses, and then attempts to resubmit/rejoin after a
//     few seconds, logging whether that succeeded.
// That's the whole interactive surface available to automate here.

import { chromium } from '@playwright/test';

function parseArgs(argv) {
  const args = { players: 1, url: 'http://localhost:5173', headless: true, code: null, stagger: 2500 };
  for (const arg of argv) {
    const stripped = arg.replace(/^--/, '');
    const eq = stripped.indexOf('=');
    const key = eq === -1 ? stripped : stripped.slice(0, eq);
    const value = eq === -1 ? 'true' : stripped.slice(eq + 1);
    if (key === 'players') args.players = parseInt(value, 10);
    else if (key === 'code') args.code = value.toUpperCase();
    else if (key === 'url') args.url = value.replace(/\/$/, '');
    else if (key === 'headless') args.headless = value !== 'false';
    else if (key === 'headed') args.headless = false;
    else if (key === 'stagger') args.stagger = parseInt(value, 10);
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));
if (!args.code || args.code.length !== 4 || !Number.isInteger(args.players) || args.players < 1) {
  console.error('Usage: npm run simulate -- --code=ABCD [--players=5] [--stagger=2500] [--url=http://localhost:5173] [--headed]');
  process.exit(1);
}
if (!Number.isInteger(args.stagger) || args.stagger < 0) {
  console.error('--stagger must be a non-negative integer (milliseconds between each bot connecting).');
  process.exit(1);
}

const BOT_NAMES = ['Nora', 'Theo', 'Priya', 'Milo', 'Suki', 'Dax', 'Wren', 'Ezra', 'Talia', 'Otto', 'Juno', 'Remy'];
const PRONOUNS = ['He/Him', 'She/Her', 'They/Them', 'Ask Me'];

function randomDelay(minMs, maxMs) {
  return new Promise((resolve) => setTimeout(resolve, minMs + Math.random() * (maxMs - minMs)));
}

// Fixed-duration sleep (randomDelay is for jittered human-like waits).
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Bots start their connections `--stagger` ms apart (see the launcher at the
// bottom; default 2.5s) so their joins don't hit the ntfy broker as a single
// burst — a large simultaneous burst gets rate-limited and silently dropped,
// which is why some players never register with the Storyteller. A bot that
// still fails to reach the lobby retries its initial join a few times before
// giving up, so a missed ack isn't lost for the rest of the session.
const RECONNECT_DELAY_MS = 5000;
const MAX_JOIN_ATTEMPTS = 5;

async function waitVisible(locator, timeout) {
  return locator.waitFor({ timeout }).then(() => true).catch(() => false);
}

// Waits to land in the lobby (or the Whale-Bucket preferences screen, which
// leads back to the lobby), submitting random preferences if needed. Used
// both right after the initial join AND after a `game_reset` — the
// Storyteller resetting the game while keeping players connected sends
// everyone back to this exact same screen, silently (no dialog), to await a
// fresh character token. Returns false on timeout rather than throwing, so
// callers can distinguish "never happened" from a real error.
async function settleIntoWaitingRoom(page, log, timeoutMs) {
  const waitingOrPrefs = page.locator('#waiting-screen').or(page.getByText('Submit Your Preferences'));
  if (!(await waitVisible(waitingOrPrefs, timeoutMs))) return false;

  if (await page.getByText('Submit Your Preferences').isVisible()) {
    // Whale-Bucket only: pick a random role for each of the 4 teams via the
    // picker's own "Select Random" button (opens that team's modal, picks a
    // random eligible role, and closes the modal), then submit. Preferences
    // are technically optional, but this exercises the real selection flow
    // instead of just leaving it empty.
    for (const team of ['townsfolk', 'outsider', 'minion', 'demon']) {
      await randomDelay(200, 800);
      await page.getByRole('button', { name: new RegExp(`Select ${team} preference`, 'i') }).click();
      await page.getByRole('button', { name: 'Select Random' }).click();
    }
    log('picked random preferences for all 4 teams');
    await randomDelay(300, 1500);
    await page.getByRole('button', { name: 'Submit Character Preferences' }).click();
    log('submitted character preferences');
  }

  await page.locator('#waiting-screen').waitFor({ timeout: 15_000 });
  return true;
}

// Watches for a disconnect notice (booted, or the Storyteller quitting) for
// the rest of this bot's lifetime, independently of the reveal-wait in
// runBot. This has to run as its own perpetual, un-awaited loop rather than
// only during the reveal wait — a boot or full reset can happen at *any*
// point, including well after this bot already revealed its token, and
// runBot's own wait has already resolved and returned by then. Both notices
// render as the same #dialog-modal (a custom in-app dialog, not a native
// browser alert()).
async function watchForDisconnects(page, log, code, name) {
  const dialog = page.locator('#dialog-modal');
  for (;;) {
    const appeared = await waitVisible(dialog, 20 * 60_000);
    if (!appeared) continue; // nothing yet — keep watching

    const dialogText = await dialog.innerText().catch(() => '');
    if (!dialogText.trim()) continue; // page likely closed; keep looping harmlessly

    if (/booted/i.test(dialogText)) {
      log(`DISCONNECT NOTICE (booted): "${dialogText.trim()}"`);
    } else if (/quit/i.test(dialogText)) {
      log(`DISCONNECT NOTICE (storyteller quit): "${dialogText.trim()}"`);
    } else {
      log(`unexpected dialog appeared: "${dialogText.trim()}"`);
    }
    await page.locator('#dialog-confirm-button').click().catch(() => {});
    log('dismissed the dialog — this bot has been returned to the join screen.');

    // See whether a resubmit actually gets back in — booted players might
    // legitimately be blocked, and there's nobody left to ack a rejoin once
    // the Storyteller has quit, so either outcome here is meaningful.
    await randomDelay(3000, 6000);
    log('attempting to resubmit and rejoin...');
    try {
      await page.getByPlaceholder('e.g. KVTQ').fill(code);
      await page.getByPlaceholder('Enter your name...').fill(name);
      await page.getByRole('button', { name: 'Join Game Room' }).click();
      const rejoined = await waitVisible(
        page.locator('#waiting-screen').or(page.getByText('Submit Your Preferences')),
        15_000
      );
      log(rejoined
        ? 'rejoin succeeded — back in the lobby.'
        : 'rejoin did not succeed within 15s (Storyteller may be gone, or this player is still blocked).');
    } catch (err) {
      log(`rejoin attempt errored: ${String(err.message || err).split('\n')[0]}`);
    }
    // Loop back around — keep watching in case of a later disconnect too.
  }
}

// One initial-join attempt: (re)navigate to the join screen, submit the join
// form, and wait to land in the lobby / preferences screen. Returns true on
// success, false on timeout — so runBot can retry (reconnect).
async function attemptJoin(page, url, code, name, log) {
  await page.goto(`${url}/#/join?code=${code}`);
  await page.getByPlaceholder('e.g. KVTQ').fill(code);
  await page.getByPlaceholder('Enter your name...').fill(name);
  await page.getByRole('button', { name: 'Join Game Room' }).click();
  log('sent join request, waiting for the Storyteller to acknowledge...');
  return settleIntoWaitingRoom(page, log, 30_000);
}

async function runBot(browser, index, code, url) {
  const name = index < BOT_NAMES.length ? BOT_NAMES[index] : `Bot${index}`;
  const log = (msg) => console.log(`[${name}] ${msg}`);

  try {
    const context = await browser.newContext();
    const page = await context.newPage();

    // Retry the initial join a few times: during a staggered join burst a bot
    // can miss the Storyteller's ack, and reconnecting is cheaper than losing
    // the bot for the rest of the run.
    let joined = false;
    for (let attempt = 1; attempt <= MAX_JOIN_ATTEMPTS && !joined; attempt++) {
      try {
        joined = await attemptJoin(page, url, code, name, log);
        if (!joined) log(`join attempt ${attempt}/${MAX_JOIN_ATTEMPTS} never reached the lobby.`);
      } catch (err) {
        // A thrown navigation/selector error is just as retryable as a timeout,
        // so reconnect on it too rather than letting it end the bot.
        log(`join attempt ${attempt}/${MAX_JOIN_ATTEMPTS} errored: ${String(err.message || err).split('\n')[0]}`);
      }
      if (!joined && attempt < MAX_JOIN_ATTEMPTS) {
        log(`reconnecting in ${RECONNECT_DELAY_MS / 1000}s...`);
        await sleep(RECONNECT_DELAY_MS);
      }
    }
    if (!joined) {
      log(`never reached the lobby after ${MAX_JOIN_ATTEMPTS} attempts — giving up.`);
      return;
    }
    log(`joined the lobby as "${name}"`);

    // Optionally set a pronoun — the only other message a player can send
    // pre-reveal, purely cosmetic, harmless to skip.
    if (Math.random() < 0.5) {
      await randomDelay(200, 1500);
      const pronoun = PRONOUNS[Math.floor(Math.random() * PRONOUNS.length)];
      await page.getByRole('button', { name: pronoun }).click();
      log(`set pronouns to ${pronoun}`);
    }

    // Runs independently for the rest of this bot's life — see the
    // function doc for why this can't just be part of the loop below.
    watchForDisconnects(page, log, code, name).catch(() => {});

    // Loops reveal <-> reset: a Storyteller can reset the game while
    // keeping players connected (`game_reset`), which sends everyone back
    // to this exact lobby screen — silently, no dialog — to await a fresh
    // token. That can happen any number of times in one session.
    const revealButton = page.getByRole('button', { name: 'Open Player Game Tracker' });
    for (;;) {
      const revealed = await waitVisible(revealButton, 10 * 60_000);
      if (!revealed) {
        log('still waiting on the Storyteller to open the Grimoire after 10 minutes — leaving this browser open.');
        break;
      }

      // The card-back face (team badge + role name) is present in the DOM
      // the moment the role is assigned, regardless of the cosmetic
      // flip-card animation state, since it's rendered on both the front
      // and back faces of the same 3D-transformed card.
      const cardBack = page.locator('div.rotate-y-180.backface-hidden');
      const team = (await cardBack.locator('span').first().textContent().catch(() => null))?.trim();
      const roleName = (await cardBack.locator('h3').first().textContent().catch(() => null))?.trim();
      if (roleName) {
        log(`received the "${roleName}" token${team ? ` (${team})` : ''}.`);
      } else {
        log('Storyteller opened the Grimoire, but could not read the assigned role name from the page.');
      }

      const backToLobby = await settleIntoWaitingRoom(page, log, 30 * 60_000);
      if (!backToLobby) {
        log('no game reset detected after 30 minutes — leaving this browser open with its current token.');
        break;
      }
      log('Storyteller reset the game — back in the lobby, waiting for a new character token...');
    }
  } catch (err) {
    log(`stopped early due to an error: ${String(err.message || err).split('\n')[0]}`);
  }
}

const browser = await chromium.launch({ headless: args.headless });
console.log(`Spawning ${args.players} bot(s) into room ${args.code} at ${args.url}...\n`);

// Launch bots `args.stagger` ms apart so their connections arrive staggered
// rather than as a single simultaneous burst. Each runBot keeps running once
// started; the sleep only spaces out when the *next* bot begins connecting.
const bots = [];
for (let i = 0; i < args.players; i++) {
  if (i > 0) await sleep(args.stagger);
  bots.push(runBot(browser, i, args.code, args.url));
}
await Promise.all(bots);

console.log('\nAll bots finished their run. Press Ctrl+C to close the browsers.');
process.stdin.resume();
process.on('SIGINT', async () => {
  await browser.close();
  process.exit(0);
});
