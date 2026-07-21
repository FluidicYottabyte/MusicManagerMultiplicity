/**
 * One-time interactive bootstrap for the very first admin account.
 * Run with: npm run create-admin
 *
 * There is no --password flag on purpose - this must be typed
 * interactively so it never ends up in shell history or process listings.
 * After the first admin exists, use /admin/users in the app instead.
 */
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";

import { hash } from "bcryptjs";

import { prisma } from "../src/lib/db";

function ask(prompt: string): Promise<string> {
  const rl = createInterface({ input: stdin, output: stdout });
  return rl.question(prompt).then((answer) => {
    rl.close();
    return answer;
  });
}

const KEY_ENTER = new Set([10, 13]);
const KEY_CTRL_C = 3;
const KEY_CTRL_D = 4;
const KEY_BACKSPACE = new Set([8, 127]);

function askMasked(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    stdout.write(prompt);
    let value = "";
    const onData = (chunk: Buffer) => {
      const code = chunk[0];
      if (code === undefined) return;

      if (KEY_ENTER.has(code) || code === KEY_CTRL_D) {
        stdin.setRawMode?.(false);
        stdin.removeListener("data", onData);
        stdin.pause();
        stdout.write("\n");
        resolve(value);
        return;
      }
      if (code === KEY_CTRL_C) {
        stdout.write("\n");
        process.exit(1);
      }
      if (KEY_BACKSPACE.has(code)) {
        value = value.slice(0, -1);
        return;
      }
      value += chunk.toString("utf8");
    };
    stdin.resume();
    stdin.setRawMode?.(true);
    stdin.on("data", onData);
  });
}

async function main() {
  const existingAdmin = await prisma.user.findFirst({ where: { isAdmin: true } });
  if (existingAdmin) {
    console.log(`An admin ("${existingAdmin.username}") already exists. Use /admin/users in the app to add more.`);
    process.exit(0);
  }

  const username = (await ask("Username: ")).trim();
  if (!username) {
    console.error("Username is required.");
    process.exit(1);
  }

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    console.error(`A user named "${username}" already exists.`);
    process.exit(1);
  }

  const password = await askMasked("Password (min 8 characters): ");
  if (password.length < 8) {
    console.error("Password must be at least 8 characters.");
    process.exit(1);
  }

  const confirm = await askMasked("Confirm password: ");
  if (confirm !== password) {
    console.error("Passwords did not match.");
    process.exit(1);
  }

  const passwordHash = await hash(password, 12);
  await prisma.user.create({ data: { username, passwordHash, isAdmin: true } });

  console.log(`Admin user "${username}" created.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
