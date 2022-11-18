import { SlashCommandBuilder } from '@discordjs/builders';
import { ISlashCommand, ISlashCommandArgs } from '@app/shared/interface';
import { PermissionsBitField, Snowflake } from 'discord.js';
import { DISCORD_BAN_REASON_ENUM } from '@app/shared/enums';

export const Massban: ISlashCommand = {
  name: 'massban',
  description: 'Use ban function for the selected snowflake IDs ',
  guildOnly: true,
  slashCommand: new SlashCommandBuilder()
    .setName('massban')
    .setDescription('Ban following users')
    .addStringOption((option) =>
      option
        .setName('snowflakes')
        .setDescription('425046052597661697, 198923317124530177')
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName('reason')
        .setDescription('(OPTIONAL) Ban reason, "shield" by default.'),
    ),

  async executeInteraction({ interaction }: ISlashCommandArgs): Promise<void> {
    if (!interaction.isChatInputCommand()) return;
    try {
      const snowflakes: string = interaction.options.getString(
        'snowflakes',
        true,
      );

      let reason: string = interaction.options.getString('reason', false);
      if (!reason) reason = DISCORD_BAN_REASON_ENUM.shield_en;

      const snowflakesBan: Snowflake[] = snowflakes
        .split(',')
        .map((id) => id.trim());

      if (
        !interaction.guild.members.me.permissions.has(
          PermissionsBitField.Flags.BanMembers,
          false,
        )
      ) {
        throw new Error('Not permission to ban on this server.');
      }

      for (const snowflakeBan of snowflakesBan) {
        await interaction.guild.members.ban(snowflakeBan, { reason });
      }

      await interaction.reply({
        content: `Successfully banned ${snowflakesBan.length} users`,
        ephemeral: true,
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
