# Rainy

<p align="center">
  <img src="https://user-images.githubusercontent.com/907696/221422670-61897db8-4bbc-4436-969f-bdc5cf194275.svg" width="200"/>
</p>

## [INVITE TO DISCORD](https://discord.com/oauth2/authorize?client_id=760782052986978335&scope=bot)

Rainy was born as a small discord bot, that handles only one problem, checking and renaming every user on join. But as for now, it's an exclusive administrative bot for Warcraft-related discord communities. Bot is named after `Rainon` ❤️ `Janisse`. She was co-manager of [**Monk's Temple of Five Dawns**,](https://discord.com/invite/fYSNb5U) and he is founder of [**Sanctum of Light**](https://discord.com/invite/sanctumoflight) discord community for paladin players in World of Warcraft.
[clearance.command.ts](libs%2Fshared%2Fsrc%2Fcommands%2Fclearance.command.ts)
## Permissions

Rainy needs `rename user` permission and the most top (literally) upper-bottom placed role above all others. It doesn't need an `administrator` title or any other special permissions. But anyway, since the code is open-sourced you could give to the bot any permissions and make sure that it won't abuse it.

If bot doesn't rename the user and your server mentioned in rename list, mainly because lack of permissions.


## How to invite?

If you want to add Rainy to your discord server, please use **[the following link](https://discord.com/oauth2/authorize?client_id=760782052986978335&scope=bot)**. Feel free to use.


## Contributions & Issues policy.

We are very glad to hear any relevant proposal or any kind of contribution from you. 

 - Have you found a bug? Feel free to make an issue about it [here](https://github.com/AlexZeDim/rainy/issues)
 - If you want to contribute your code, just for the repo and make a PR. We are using [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/) in description so take it as guide-line.
 - Do you have more questions? Jump in to our [Wiki](https://github.com/AlexZeDim/rainy/wiki/)



## Deployment

1. Clone the repository with `git clone` or download the code.
2. Create a `.env` file with the following content:

```
discord=your_token
redis=your_redis
port=your_port
```
3. Install all dependecies `npm install` or `yarn`.
4. Create docker image with `npm run docker:build` command.

