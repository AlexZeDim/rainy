import { SlashCommandBuilder } from '@discordjs/builders';
import { ISlashCommandArgs } from '@app/shared/interface';

export const VoteUnban = {
  name: 'vote_unban',
  description: 'Start voting for unban selected user',
  guildOnly: true,
  slashCommand: new SlashCommandBuilder()
    .setName('vote_unban')
    .setDescription('Start vote procedure for unban selected user')
    .addStringOption((option) =>
      option
        .setName('snowflake')
        .setDescription('425046052597661697')
        .setRequired(true),
    ),

  async executeInteraction({ interaction }: ISlashCommandArgs): Promise<void> {
    if (!interaction.isChatInputCommand()) return;
    try {
      // TODO frame
    } catch (errorOrException) {
      console.error(errorOrException);
      await interaction.reply({
        content: errorOrException.message,
        ephemeral: true,
      });
    }
  },
};
