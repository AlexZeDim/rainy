# Rainy

Rainy was born as a small discord bot, that handles only one problem, it renames every user on join event. But as for now, it's an exclusive administrative bot for Warcraft-related discord communities. Bot is named after `Rainon` and his [**Sanctum of Light**](https://discord.com/invite/sanctumoflight) discord community for paladin players in World of Warcraft. But sometimes is may be known as `Janisse` in the name of l

## Permissions

Rainy needs `rename user` permission and the most top (literally) upper-bottom placed role above all others. It doesn't need an `administrator` title or any other special permissions. But anyway, since the code is open-sourced you could give to the bot any permissions and make sure that it won't abuse it.

If bot doesn't rename the user, well, mainly because lack of permissions.


## How to invite?

If you want to add Rainy to your discord server, please use **[the following link](https://discord.com/oauth2/authorize?client_id=760782052986978335&scope=bot)**. Feel free to use.


## Contributon & Issues policy.

We are very glad to hear any relevant proposal or any kinf of contribution from you. 

 - Have you found a bug? Feel free to make an issue about it [here](https://github.com/AlexZeDim/rainy/issues)
 - If you want to contribute your code, just for the repo and make a PR. We are using [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/) in description so take it as guide-line.
 - Do you have more questions? Jump in to our [Wiki](https://github.com/AlexZeDim/rainy/wiki/)



## Deployment

1. Clone the repository with `git clone` or download the code.
2. Create a `.env` file with the following content:

```
discord=your_token
redis=_your_redis
port=your_port
```
3. Install all dependecies `npm install` or `yarn`.
4. Create docker image with `npm run docker:build` command.

