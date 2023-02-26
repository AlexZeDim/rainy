import { ISlashCommand, ISlashCommandArgs } from '@app/shared';
import { SlashCommandBuilder } from '@discordjs/builders';
import { Collection, EmbedBuilder, TextChannel } from 'discord.js';

export const Clearance: ISlashCommand = {
  name: 'clearance',
  description: 'Show users with clearance to interact with bot',
  guildOnly: true,
  slashCommand: new SlashCommandBuilder()
    .setName('clearance')
    .setDescription('Show users with clearance to interact with bot'),

  async executeInteraction({
    interaction,
    localStorage,
  }: ISlashCommandArgs): Promise<void> {
    if (!interaction.isChatInputCommand()) return;
    try {
      const messageMap = new Collection<string, Set<string>>();

      for (const userPermission of localStorage.userPermissionStorage.values()) {
        const user = localStorage.userStorage.get(userPermission.userId);
        const guild = localStorage.guildStorage.get(userPermission.guildId);

        if (messageMap.has(guild.name)) {
          const userSet = messageMap.get(guild.name);

          userSet.add(`${user.username} | ${user.id}`);

          messageMap.set(guild.name, userSet);
        } else {
          const userSet = new Set<string>([`${user.username} | ${user.id}`]);

          messageMap.set(guild.name, userSet);
        }
      }

      for (const [guildName, userSet] of messageMap.entries()) {
        let counter = 0;
        const embed = new EmbedBuilder().setDescription(guildName);

        userSet.forEach((user) => {
          counter++;

          if (counter < 12) {
            embed.addFields({
              name: '\u200B',
              value: user,
              inline: true,
            });
          }

          if (counter === 12) {
            const length = userSet.size - counter;

            embed.addFields({
              name: '\u200B',
              value: `...and ${length} more!`,
              inline: true,
            });

            return;
          }
        });

        await (interaction.channel as TextChannel).send({ embeds: [embed] });
      }
    } catch (errorOrException) {
      console.error(errorOrException);
      await interaction.reply({
        content: errorOrException.message,
        ephemeral: true,
      });
    }
  },
};
