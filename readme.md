# Telegram Sproto/NFT Sales Bot Setup

### prereqs: nodejs 18.7.0 (check using node -v)

## Installation

### first, pull project and move into the folder
git clone https://github.com/benblast/sprotosalesbot.git
cd sprotosalesbot

### install dependencies
npm i

### make a file called ".env" where you store your sensitive keys for the program to use
### write this in the file and put your creds in
BOT_TOKEN=
reservoir_api=

### unzip files.zip into a directory called files/
### this directory contains all sproto pngs
### so it will be pretty big and cant be hosted on github (separate download link will be provided)

## running the script
node index.js
