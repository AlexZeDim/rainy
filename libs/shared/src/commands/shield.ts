import { SlashCommandBuilder } from '@discordjs/builders';
import { ISlashCommandArgs } from "@app/shared/interface";

export const Shield = {
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
        .addChoice('1 minute', '1m')
        .addChoice('5 minutes', '5m')
        .addChoice('10 minutes', '10m')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option.setName('joins')
        .setDescription('Allowed parallel joins at cluster time value.')
        .setRequired(true)
    ),

  async executeInteraction({ interaction, redis }: ISlashCommandArgs): Promise<void> {
    if (!interaction.isCommand()) return;
    try {
      const time: string = interaction.options.getString('time', true);
      const status: boolean = interaction.options.getBoolean('status', true);
      const joins: number = interaction.options.getInteger('joins', true);

      const shieldArgs = {
        time,
        status: status.toString(),
        joins,
      };

      const shield = await redis.hmset(`shield:${interaction.guild.id}`, shieldArgs);

      shield === 'OK'
       ? await interaction.reply({ content: `Enabled ${status}, time: ${time}, joins: ${joins}`, ephemeral: true })
       : await interaction.reply({ content: `Enabled ${status}, time: ${time}, joins: ${joins}`, ephemeral: true });
    } catch (errorOrException) {
      console.error(errorOrException);
      await interaction.reply({ content: errorOrException.message, ephemeral: true });
    }
  }
}
