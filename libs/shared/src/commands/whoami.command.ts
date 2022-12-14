import { ISlashCommand, ISlashCommandArgs } from '@app/shared';
import { SlashCommandBuilder } from '@discordjs/builders';
import { EmbedBuilder } from 'discord.js';

export const Whoami: ISlashCommand = {
  name: 'whoami',
  description: 'Show creation info',
  guildOnly: true,
  slashCommand: new SlashCommandBuilder()
    .setName('whoami')
    .setDescription('Show creation info'),

  async executeInteraction({ interaction }: ISlashCommandArgs): Promise<void> {
    if (!interaction.isChatInputCommand()) return;

    try {
      const embed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle('AlexZeDim#2645')
        .setURL('https://github.com/AlexZeDim')
        .setDescription('Made with love & raspberry from 🍄 Mara 🍄#7593')
        .setThumbnail('https://avatars.githubusercontent.com/u/907696')
        .addFields(
          { name: 'Love', value: '❤️', inline: true },
          { name: 'Party', value: '🎉', inline: true },
          { name: 'Cake', value: '🎂', inline: true },
          { name: 'Strawberry', value: '🍓', inline: true },
          { name: 'Berry', value: '🍒', inline: true },
          { name: 'Duck', value: '🦆', inline: true },
          { name: 'Cocok', value: '🐻', inline: true },
        )
        .setTimestamp()
        .setFooter({ text: new Date().toLocaleDateString() });

      interaction.channel.send({ embeds: [ embed ]});
    } catch (errorOrException) {
      console.error(errorOrException);
      await interaction.reply({
        content: errorOrException.message,
        ephemeral: true,
      });
    }
  }
}
