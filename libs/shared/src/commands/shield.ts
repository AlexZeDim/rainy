import { SlashCommandBuilder } from '@discordjs/builders';
import { ISlashCommand, ISlashCommandArgs } from "@app/shared/interface";

export const Shield: ISlashCommand = {
  name: 'shield',
  description: 'This command server threshold for incoming members',
  guildOnly: true,
  slashCommand: new SlashCommandBuilder()
    .setName('shield')
    .setDescription('Enables auto-ban protection for your server.')
    .addBooleanOption(option =>
      option.setName('status')
        .setDescription('On / off switch')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('time')
        .setDescription('Cluster time for joining the server.')
        .addChoices({
          name: '1 minute',
          value: '1m'
        }, {
          name: '5 minutes',
          value: '5m',
        }, {
          name: '10 minutes',
          value: '10m'
        })
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option.setName('joins')
        .setDescription('Allowed parallel joins at cluster time value.')
        .setRequired(true)
    ),

  async executeInteraction({ interaction, redis }: ISlashCommandArgs): Promise<void> {
    if (!interaction.isChatInputCommand()) return;
    try {
      const time: string = interaction.options.getString('time', true);
      const status: boolean = interaction.options.getBoolean('status', true);
      const joins: number = interaction.options.getInteger('joins', true);

      const shieldArgs = {
        time,
        status: status.toString(),
        joins,
      };

      const shield = await redis.hset(`shield:${interaction.guild.id}`, shieldArgs);

      shield === 1
       ? await interaction.reply({ content: `Enabled ${status}, time: ${time}, joins: ${joins}`, ephemeral: true })
       : await interaction.reply({ content: `Enabled ${status}, time: ${time}, joins: ${joins}`, ephemeral: true });
    } catch (errorOrException) {
      console.error(errorOrException);
      await interaction.reply({ content: errorOrException.message, ephemeral: true });
    }
  }
}
