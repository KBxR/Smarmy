# Smarmy

This Discord bot is a personal project created for experimenting with Discord.js features and building custom commands for personal use. It\'s not intended for production use but rather as a learning and testing environment.

## Features

- Modular sub commands / APIs
- Postgres DB
- Server Configurations, managable by one file
- Auto updating server config + support to force create a config for a server id
- Command / Event permissions
- Bot manage commands (Username, avatar, status)
- Docker deployable (Need to provide your own docker repo for now)

- Starboard
- Daily Cat
- LastFM API support
- Phone call command (Limited support)

---
- Commands can be removed by simply removing either the subcommand file, the main command file + the sup commands, or the entire command folder
## Local Installation

```bash
  git clone https://github.com/KBxR/Smarmy.git
  cd Smarmy
  npm install
```

Edit ```example.env``` with your bot token, the guild ID you want admin commands to sync to, and your own Discord ID

Example of a filled in env
```env
#BOT CONFIG
BOT_TOKEN= Your Bot Token
GUILD_ID= Bot manage server for admin commands
ADMIN_ID= your discord id
DATABASE_URL=postgres://yourusername:yourpassword@databaseip:5432/databasename

#API KEYS

self explanitory, these can be removed if unused

LASTFM_KEY=
LASTFM_SECRET=
REBRICK_KEY=
CAT_KEY=
NASA_KEY=
```
## Deployment

To start the bot

```bash
node src/bot.js
```

To deploy commands

```bash
node src/deploycommands.js
```

## TODO

- Make this readme better