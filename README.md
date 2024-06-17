# Smarmy

This Discord bot is a personal project created for experimenting with Discord.js features and building custom commands for personal use. It\'s not intended for production use but rather as a learning and testing environment.

## Features

- Create and manage roles
- View guild information
- Update bot's avatar, username, and status via command
- LastFM API Support
- SQLite3 database for user info (Auto generated on first startup)
- Luma API Support (Not really finished, but "working")

## Getting Started

### Prerequisites

- Node.js installed
- Discord Bot token
- Discord application ID
- ID of your server for admin commands
- Your Discord ID for detailed error responses

***Optional***
- Last.fm API key (if using Last.fm commands)
- Last.fm API secret (if needed for certain API calls)

### Installation

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env` file in the root directory and add the following environment variables:

   ```
   BOT_TOKEN=your-bot-token-here
   CLIENT_ID=your-application-id-here
   GUILD_ID=your-guild-id-here
   ADMIN_ID=your-admin-id-here
   LASTFM_KEY=your-lastfm-key-here
   LASTFM_SECRET=your-lastfm-secret-here
   ```
