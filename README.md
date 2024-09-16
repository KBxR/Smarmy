![smarmy](smarmy.png)
# Smarmy

Cat Gacha Discord bot made for a private server but can be deployed for other servers

## Features

- Modular sub commands / APIs
- Postgres DB
- Server Configurations, managable by one file
- Auto updating server config + support to force create a config for a server id
- Command / Event permissions
- Bot management commands (Username, avatar, status)
- Docker deployable (Need to provide your own docker repo for now)

- Starboard
- Cat Gacha
- Don Cheadle Word of the Day

---
- Commands can be removed by simply removing either the subcommand file, the main command file + the sup commands, or the entire command folder
## Local Installation

```bash
  git clone https://github.com/KBxR/Smarmy.git
  cd Smarmy
  npm install
```

Edit ```example.env``` with your bot token, the guild ID you want admin commands to sync to, and your own Discord ID
Then change the file name to just ```.env```

Example of a filled in env
```env
#BOT CONFIG
BOT_TOKEN= Your Bot Token
CLIENT_ID= Application token
GUILD_ID= Bot manage server for admin commands
ADMIN_ID= your discord id
DATABASE_URL= postgres://yourusername:yourpassword@databaseip:5432/databasename

#API KEYS

CAT_KEY=
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