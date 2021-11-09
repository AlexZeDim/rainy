import { Snowflake } from "discord.js";
import {
  DISCORD_AUTHORIZED_ENUM,
  DISCORD_BAN_REASON_ENUM,
  DISCORD_SERVER_RENAME_ENUM,
  DISCORD_SERVERS_ENUM
} from "@app/shared/enums";

export const DISCORD_EMOJI: Map<Snowflake, Snowflake> = new Map([
  [DISCORD_SERVERS_ENUM.SanctumOfLight, '741997711678636074'],
  [DISCORD_SERVERS_ENUM.TempleOfFiveDawns, '741997711926100018'],
  [DISCORD_SERVERS_ENUM.Maelstorm, '741997712035020860'],
  [DISCORD_SERVERS_ENUM.Akerus, '741997712022438018'],
  [DISCORD_SERVERS_ENUM.DreamGroove, '741997711779168328'],
  [DISCORD_SERVERS_ENUM.HuntersLounge, '741997711548612610'],
  [DISCORD_SERVERS_ENUM.FelHammer, '895343481491423332'],
  [DISCORD_SERVERS_ENUM.BlackTemple, '741997711888351312'],
  [DISCORD_SERVERS_ENUM.HallOfTheGuardian, '741997711955460116'],
  [DISCORD_SERVERS_ENUM.SkyholdCitadel, '741997711775236127'],
  [DISCORD_SERVERS_ENUM.TempleOfVoidLight, '741997711854665798'],
  [DISCORD_SERVERS_ENUM.HallOfShadows, '741997712198860870']
]);

export const DISCORD_RELATIONS: Map<string, string> = new Map([
  [DISCORD_AUTHORIZED_ENUM.Rainon, DISCORD_SERVERS_ENUM.SanctumOfLight],
  [DISCORD_AUTHORIZED_ENUM.Solifugae, DISCORD_SERVERS_ENUM.SanctumOfLight],
  [DISCORD_AUTHORIZED_ENUM.Uchur, DISCORD_SERVERS_ENUM.SanctumOfLight],
  [DISCORD_AUTHORIZED_ENUM.Danaya, DISCORD_SERVERS_ENUM.SanctumOfLight],
  [DISCORD_AUTHORIZED_ENUM.Lapa, DISCORD_SERVERS_ENUM.SanctumOfLight],
  [DISCORD_AUTHORIZED_ENUM.SanctumOfLight, DISCORD_SERVERS_ENUM.SanctumOfLight],
  [DISCORD_AUTHORIZED_ENUM.Schneissy, DISCORD_SERVERS_ENUM.SanctumOfLight],
  [DISCORD_AUTHORIZED_ENUM.Mizzrim, DISCORD_SERVERS_ENUM.SanctumOfLight],
  [DISCORD_AUTHORIZED_ENUM.Jarisse, DISCORD_SERVERS_ENUM.TempleOfFiveDawns],
  [DISCORD_AUTHORIZED_ENUM.Nims, DISCORD_SERVERS_ENUM.TempleOfFiveDawns],
  [DISCORD_AUTHORIZED_ENUM.Diezzz, DISCORD_SERVERS_ENUM.DreamGroove],
  [DISCORD_AUTHORIZED_ENUM.Talissia, DISCORD_SERVERS_ENUM.DreamGroove],
  [DISCORD_AUTHORIZED_ENUM.Amani, DISCORD_SERVERS_ENUM.Maelstorm],
  [DISCORD_AUTHORIZED_ENUM.Orenji, DISCORD_SERVERS_ENUM.Maelstorm],
  [DISCORD_AUTHORIZED_ENUM.Daren, DISCORD_SERVERS_ENUM.Akerus],
  [DISCORD_AUTHORIZED_ENUM.Resgast, DISCORD_SERVERS_ENUM.Akerus],
  [DISCORD_AUTHORIZED_ENUM.Lengi, DISCORD_SERVERS_ENUM.HuntersLounge],
  [DISCORD_AUTHORIZED_ENUM.Freerun, DISCORD_SERVERS_ENUM.HuntersLounge],
  [DISCORD_AUTHORIZED_ENUM.Amuress, DISCORD_SERVERS_ENUM.FelHammer],
  [DISCORD_AUTHORIZED_ENUM.Sangreal, DISCORD_SERVERS_ENUM.FelHammer],
  [DISCORD_AUTHORIZED_ENUM.Rodrig, DISCORD_SERVERS_ENUM.BlackTemple],
  [DISCORD_AUTHORIZED_ENUM.Akula, DISCORD_SERVERS_ENUM.HallOfTheGuardian],
  [DISCORD_AUTHORIZED_ENUM.HardKul, DISCORD_SERVERS_ENUM.HallOfTheGuardian],
  [DISCORD_AUTHORIZED_ENUM.Annet, DISCORD_SERVERS_ENUM.HallOfTheGuardian],
  [DISCORD_AUTHORIZED_ENUM.Yadder, DISCORD_SERVERS_ENUM.SkyholdCitadel],
  [DISCORD_AUTHORIZED_ENUM.Enmerkar, DISCORD_SERVERS_ENUM.TempleOfVoidLight],
  [DISCORD_AUTHORIZED_ENUM.Restar, DISCORD_SERVERS_ENUM.TempleOfVoidLight],
  [DISCORD_AUTHORIZED_ENUM.Lowiq, DISCORD_SERVERS_ENUM.HallOfShadows],
  [DISCORD_AUTHORIZED_ENUM.Darkcat, DISCORD_SERVERS_ENUM.HallOfShadows],
]);

export const DISCORD_SERVER_RENAME: Set<Snowflake> = new Set(Object.values(DISCORD_SERVER_RENAME_ENUM));

export const DISCORD_BANS: Set<string> = new Set(Object.values(DISCORD_BAN_REASON_ENUM));

export const DISCORD_LOGS: Snowflake = '896513694488477767';
