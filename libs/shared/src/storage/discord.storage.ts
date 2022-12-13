export class DiscordStorage {
  public guilds: Map<string, string> = new Map([]);
  public channels: Map<string, string> = new Map([]);
  public permissions: Map<string, string> = new Map([]);
}
