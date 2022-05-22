# LifeXP: Gamified Journalling Chatbot

LifeXP combines gamification and journalling into a chatbot. It aims to provide a safe, fun and convenient way for you to pen down your thoughts and even organise them for browsing later. At the end of your journalling sessions, you are rewarded with experience points to reward you for your effort.

## Demo

<img alt="demo" src="assets/readme%20demo.png" width="400px"/>

[Full demo](demo.md)

## Principles

**Convenient**: We bring our phones with us everywhere we go, and we spend a large part of our time communicating with people through chat apps like Telegram. Journalling has never been easier — it’s only one text message away.

**Conversational**: We tell stories to other people all the time. Conversations are a natural way of telling people about what happened and how we felt. LifeXP combines this organic conversation together with an introspective journalling session to reflect.

**Flexible**: Journal in whatever way that works best for you. LifeXP does not interfere with your entries; it’s only there to facilitate your thoughts.

## Using the Bot

LifeXP has been deployed to Heroku for public use. You may access the bot at the username [@lifexp_bot](https://t.me/lifexp_bot). If the bot does not respond immediately, please be patient as it may have fallen asleep 😴

## Tech Stack

![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white) ![NodeJS](https://img.shields.io/badge/node.js-%2343853D.svg?style=for-the-badge&logo=node-dot-js&logoColor=white) ![Postgres](https://img.shields.io/badge/postgres-%23316192.svg?style=for-the-badge&logo=postgresql&logoColor=white) ![Heroku](https://img.shields.io/badge/heroku-%23430098.svg?style=for-the-badge&logo=heroku&logoColor=white) ![Telegram](https://img.shields.io/badge/Telegram-2CA5E0?style=for-the-badge&logo=telegram&logoColor=white ) ![ESLint](https://img.shields.io/badge/ESLint-4B3263?style=for-the-badge&logo=eslint&logoColor=white )

## Building and Installing

It is highly unlikely that you will need to build, install and run the Telegram bot directly yourself, as the bot has already been deployed for public use. However, here are some overall instructions in the event that you need to do so.

1. Clone the repository.
2. Create a Telegram bot and set up the environment variables as instructed [here](https://github.com/odditive/heroku-node-telegram-bot).

## Acknowledgements

- Telegram Bot API for NodeJS: [node-telegram-bot-api](https://github.com/yagop/node-telegram-bot-api)
- Starter pack for running telegram bot on the Heroku using Node.js: [heroku-node-telegram-bot](https://github.com/odditive/heroku-node-telegram-bot)
