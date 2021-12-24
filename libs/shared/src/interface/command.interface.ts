import { SlashCommandBuilder } from '@discordjs/builders';
import { Redis } from '@nestjs-modules/ioredis';
import { Interaction } from 'discord.js';

export interface ISlashCommandArgs {
  readonly interaction: Interaction,
  readonly redis?: Redis,
}

export interface ISlashCommand {
  readonly name: string;

  readonly guildOnly: boolean;

  readonly slashCommand: Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">;

  executeInteraction(interactionArgs: ISlashCommandArgs): Promise<void>;
}
