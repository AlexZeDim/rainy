import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { capitalizeFirstLetter, normalizeDiacritics } from 'normalize-text';
import {
  CROSS_CLASS_CHANNELS, DISCORD_BANS, DISCORD_EMOJI,
  DISCORD_RELATIONS,
  DISCORD_SERVER_RENAME,
  DISCORD_SERVERS_ENUM,
  PALADIN_ROLES
} from '@app/shared';
import {
  Intents,
  Client,
  MessageActionRow,
  MessageButton,
  MessageEmbed,
  ButtonInteraction,
  Snowflake,
  TextChannel,
  Channel
} from 'discord.js';

@Injectable()
export class AppService implements OnApplicationBootstrap {
  private client: Client

  private banUserID: Snowflake;

  private timeout: number = 1000 * 60 * 60 * 12;

  private banList: Map<Snowflake, Snowflake> = new Map([]);

  private filterBan = async (interaction: ButtonInteraction): Promise<boolean> => {
    if (interaction.customId === this.banUserID && DISCORD_RELATIONS.has(interaction.user.id)) {
      const discordClassID = DISCORD_RELATIONS.get(interaction.user.id);
      const guild = this.client.guilds.cache.get(discordClassID);
      if (guild) {
        await guild.members.ban(interaction.customId, { reason: 'Cross Ban Rainy' });
        return true;
      }
      return false;
    }
    return false;
  };

  private readonly logger = new Logger(
    AppService.name, { timestamp: true },
  );

  async onApplicationBootstrap(): Promise<void> {
    this.client = new Client({
      partials: ['USER', 'CHANNEL', 'GUILD_MEMBER'],
      intents: [
        Intents.FLAGS.GUILD_BANS,
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MEMBERS,
        Intents.FLAGS.GUILD_INVITES,
        Intents.FLAGS.GUILD_MESSAGES,
      ],
      presence: {
        status: 'online'
      }
    });
    await this.client.login(process.env.discord);
    await this.bot();
  }

  async bot(): Promise<void> {
    this.client.on('ready', async () =>
      this.logger.log(`Logged in as ${this.client.user.tag}!`)
    )

    this.client.on('messageCreate', async (message) => {
      if (message.author.bot) return;

      if (message.guildId === DISCORD_SERVERS_ENUM.SanctumOfLight) {

        const guildMember = message.guild.members.cache.get(message.author.id);
        if (!guildMember.roles.cache.has(PALADIN_ROLES.PaladinMember)) {
          await guildMember.roles.add(PALADIN_ROLES.PaladinMember);
        }
      }
    });

    this.client.on('guildBanAdd', async (ban) => {
      try {
        const guildBan = await ban.fetch();

        if (guildBan.reason && DISCORD_BANS.has(guildBan.reason.toLowerCase())) {
          if (!this.banList.has(guildBan.user.id)) {
            this.banUserID = guildBan.user.id;

            const channel: Channel | null = await this.client.channels.fetch(CROSS_CLASS_CHANNELS.Test);
            if (!channel || channel.type !== 'GUILD_TEXT') return;

            const buttons = new MessageActionRow()
              .addComponents(
                new MessageButton()
                  .setCustomId(this.banUserID)
                  .setLabel(`Ban ${guildBan.user.username}#${guildBan.user.discriminator}`)
                  .setStyle('DANGER')
                ,
              );

            const collector = (channel as TextChannel).createMessageComponentCollector({ filter: this.filterBan, time: this.timeout });

            this.banList.set(guildBan.user.id, channel.id);

            const emoji = this.client.emojis.cache.get(DISCORD_EMOJI.get(guildBan.guild.id));

            const embed =
              new MessageEmbed()
                .setDescription(`Источник: ${emoji} **${guildBan.guild.name}**\n\nЗаблокирован на:`)
                .addFields({ name: '\u200B', value: `${emoji} - ✅`, inline: true });

            const discordServerAction: Set<Snowflake> = new Set();

            collector.on('collect', async (i) => {
              if (i.customId === this.banUserID) {
                const discordServer: Snowflake = DISCORD_RELATIONS.get(i.user.id);

                if (!discordServerAction.has(discordServer)) {
                  discordServerAction.add(discordServer);

                  const emojiEdit = this.client.emojis.cache.get(DISCORD_EMOJI.get(discordServer));
                  const newEmbed = embed.addField('\u200B', `${emojiEdit} - ✅`, true);

                  await i.update({ embeds: [ newEmbed ] });
                }
              }
            });

            const message = await (channel as TextChannel).send({ embeds: [embed], components: [buttons] });
            setTimeout(() => message.delete(), this.timeout);
          }
        }
      } catch (errorOrException) {
        this.logger.error(errorOrException);
      }
    });

    this.client.on('guildMemberAdd', async (guildMember) => {

      if (!DISCORD_SERVER_RENAME.has(guildMember.guild.id)) return;

      const oldUsername = guildMember.user.username;
      let username = guildMember.user.username;
      username = username.toLowerCase();
      username = username.normalize("NFD");
      username = normalizeDiacritics(username);
      username = username
        .replace('͜', '')
        .replace('1', 'i')
        .replace('$', 's')
        .replace(/\[.*?]/gi, '')
        .replace(/\(.*?\)/gi, '')
        .replace(/{.*?}/gi, '')
        .replace(/[`~!@#$%^€&*()_|̅+\-=?;:'",.<>{}\[\]\\\/]/gi, '')
        .replace(/\d/g,'')

      const C = username.replace(/[^a-zA-Z]/g, '').length;
      const L = username.replace(/[^а-яА-Я]/g, '').length;

      (L >= C)
        ? username = username.replace(/[^а-яА-Я]/g, '')
        : username = username.replace(/[^a-zA-Z]/g, '')

      username = username.length === 0 ? 'Username' : capitalizeFirstLetter(username);

      await guildMember.setNickname(username);
      this.logger.log(`Rename user from ${oldUsername} to ${username}`)
    });
  }
}
