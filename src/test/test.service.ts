import { Injectable, Logger } from '@nestjs/common';
import { ActionRowBuilder, ButtonBuilder, Client, EmbedBuilder, Events, TextChannel } from 'discord.js';
import { ButtonStyle } from 'discord-api-types/v10';
import { MessageActionRowComponentBuilder } from '@discordjs/builders';

@Injectable()
export class TestService {
  private readonly logger = new Logger(TestService.name, { timestamp: true });

  private client: Client;

  async test(client: Client) {
    this.logger.log('test started!');

    this.client = client;

    const textChannel = await this.client.channels.fetch('1016399579417149523');
    if (!textChannel || !textChannel.isTextBased) {
      return;
    }

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('1016399579417149523')
        .setLabel('Ban')
        .setStyle(ButtonStyle.Danger),
    ) as ActionRowBuilder<MessageActionRowComponentBuilder>;

    const embed = new EmbedBuilder()
      .setDescription(
        `**Tester#1234** заблокирован на:`,
      )
      .addFields({
        name: '\u200B',
        value: `:tada: - ✅`,
        inline: true,
      });

    const message = await (textChannel as TextChannel).send({
      content: `!ban Tester#1234 CrossBan`,
      embeds: [embed],
      components: [buttons],
    });

    this.client.on(
      Events.InteractionCreate, async (interaction) => {
        if (interaction.isButton()) {
          console.log(interaction);
        }
    });

    this.logger.log('test ended!');
  }
}
