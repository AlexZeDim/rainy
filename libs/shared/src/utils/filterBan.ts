import { DISCORD_RELATIONS } from "@app/shared/const";
import { ButtonInteraction, Client, CollectorFilter } from "discord.js";

export const filterBan: CollectorFilter<unknown[]> = async (interaction: ButtonInteraction, client?: Client): Promise<boolean> => {
  if (interaction.customId === 'ban' && DISCORD_RELATIONS.has(interaction.user.id)) {
    const discordClassID = DISCORD_RELATIONS.get(interaction.user.id);
    const guild = client.guilds.cache.get(discordClassID);
    if (guild) {
      const ban = await guild.members.ban(interaction.customId);
      return true;
    }
    return false;
  }
  return false;
};
