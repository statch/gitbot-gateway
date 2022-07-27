import { HELP_COMMAND } from './commands.js';
import fetch from 'node-fetch';

/**
 * This file is meant to be run from the command line, and is not used by the
 * application server.  It's allowed to use node.js primitives, and only needs
 * to be run once.
 */

/* eslint-disable no-undef */

const token = process.env.DISCORD_BOT_TOKEN;
const app_id = process.env.DISCORD_APPLICATION_ID;
const test_guild_id = process.env.DISCORD_TEST_GUILD_ID;

/**
 * Register all commands with a specific guild/server. Useful during initial
 * development and testing.
 */
// eslint-disable-next-line no-unused-vars
async function register_guild_commands() {
  if (!test_guild_id) {
    throw new Error(
      'The DISCORD_TEST_GUILD_ID environment variable is required.'
    );
  }
  const url = `https://discord.com/api/v10/applications/${app_id}/guilds/${test_guild_id}/commands`;
  const res = await register_commands(url);
  const json = await res.json();
  console.log(json);
  json.forEach(async (cmd) => {
    const response = await fetch(
      `https://discord.com/api/v10/applications/${app_id}/guilds/${test_guild_id}/commands/${cmd.id}`
    );
    if (!response.ok) {
      console.error(`Problem removing command ${cmd.id}`);
    }
  });
}

/**
 * Register all commands globally.  This can take o(minutes), so wait until
 * you're sure these are the commands you want.
 */
// eslint-disable-next-line no-unused-vars
async function register_global_commands() {
  const url = `https://discord.com/api/v10/applications/${app_id}/commands`;
  await register_commands(url);
}

async function register_commands(url) {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bot ${token}`,
    },
    method: 'PUT',
    body: JSON.stringify([HELP_COMMAND]),
  });

  if (response.ok) {
    console.log('Registered all commands!');
  } else {
    console.error('Error registering commands:');
    const text = await response.text();
    console.error(text);
  }
  return response;
}

await register_global_commands();
// await register_guild_commands();