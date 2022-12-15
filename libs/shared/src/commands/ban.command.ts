import { SlashCommandBuilder } from '@discordjs/builders';
import { ISlashCommand, ISlashCommandArgs } from '@app/shared/interface';
import { PermissionsBitField, Snowflake } from 'discord.js';
import { DISCORD_BAN_REASON_ENUM } from '@app/shared/enums';

export const Ban: ISlashCommand = {
  name: 'ban',
  description: 'Ban user(s) by their snowflake IDs',
  guildOnly: true,
  slashCommand: new SlashCommandBuilder()
    .setName('ban')
    .setNameLocalizations({
      ru: 'Бан',
    })
    .setDescription('Ban user(s) by their snowflake IDs')
    .setDescriptionLocalizations({
      ru: 'Забанить выбранных пользователей по их ID или тэгу',
    })
    .addStringOption((option) =>
      option.setName('reason')
        .setNameLocalizations({
          ru: 'причина',
        })
        .setDescription('Spam')
        .setDescriptionLocalizations({
          ru: 'Спам',
        })
        .setMaxLength(16)
        .setRequired(false)
    )
    .addStringOption((option) =>
      option.setName('snowflakes')
      .setDescription('804648109866876998 804648321146421268 804648260467294259')
      .setMaxLength(1999)
      .setRequired(true)
    ),

  async executeInteraction({ interaction }: ISlashCommandArgs): Promise<void> {
    if (!interaction.isChatInputCommand()) return;
    try {
      let counter = 0;
      const reason = interaction.options.getString('reason', false) || DISCORD_BAN_REASON_ENUM.spam_en;
      const snowflakes = interaction.options.getString('snowflake', true);

      const snowflakesBan: Snowflake[] = snowflakes
        .replace(/\n/g, ' ')
        .split(' ')
        .map((id) => id.trim());

      if (
        !interaction.guild.members.me.permissions.has(
          PermissionsBitField.Flags.BanMembers,
          false,
        )
      ) {
        throw new Error(`Rainy doesn't have permission to ban users at ${interaction.guildId}`);
      }

      for (const snowflake of snowflakesBan) {
        try {
          await interaction.guild.members.ban(snowflake, { reason });
          counter++
        } catch (e) {
          await interaction.reply({
            content: `User ${snowflake} not banned. Probably missing access to ban.`,
            ephemeral: true,
          });
        }
      }

      await interaction.reply({
        content: `Successfully banned ${counter++} users`,
        ephemeral: false,
      });
    } catch (errorOrException) {
      console.error(errorOrException);
      await interaction.reply({
        content: errorOrException.message,
        ephemeral: true,
      });
    }
  },
};
