import { ISlashCommand, ISlashCommandArgs } from '@app/shared';
import { SlashCommandBuilder } from '@discordjs/builders';
import { Collection, EmbedBuilder, Message, Utils } from 'discord.js';

export const Clearance: ISlashCommand = {
  name: 'clearance',
  description: 'Show users with clearance to interact with bot',
  guildOnly: true,
  slashCommand: new SlashCommandBuilder()
    .setName('clearance')
    .setNameLocalizations({
      ru: 'Доступы',
    })
    .setDescription('Show users with clearance to interact with bot')
    .setDescriptionLocalizations({
      ru: 'Показывает лист доступов для управления ботом',
    }),

  async executeInteraction({ interaction, localStorage }: ISlashCommandArgs): Promise<void> {
    if (!interaction.isChatInputCommand()) return;
    try {

      let message: string;
      const messageMap = new Collection<string, string>();

      for (const userPermission of localStorage.userPermissionStorage.values()) {
        const user =  localStorage.userStorage.get(userPermission.userId);
        const guild = localStorage.guildStorage.get(userPermission.guildId);

        if (messageMap.has(guild.name)) {
          const userString = messageMap.get(guild.name);

          messageMap.set(guild.name, `\n${userString}\n\n`);
        } else {
          messageMap.set(guild.name, `${user.username} | ${user.id}\n\n`);
        }
      }

      for (const [guildName, userString] of messageMap.entries()) {
        message = `${message}${guildName}${userString}`;
      }

      await interaction.channel.send({ content: message });
    } catch (errorOrException) {
      console.error(errorOrException);
      await interaction.reply({
        content: errorOrException.message,
        ephemeral: true,
      });
    }
  }
}
