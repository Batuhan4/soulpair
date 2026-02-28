// Agent display names for demo
export const AGENT_NAMES: Record<string, { name: string; emoji: string }> = {
  '0xBa704a9F3Dc8B510A6c3F2d7E5b1C8A9D4F06B01': { name: 'batubot', emoji: '🤖' },
  '0xC1a0a913dEB6f4967B2ef3Aa68F5a1AfCC077B02': { name: 'clawa', emoji: '🦞' },
  '0x5e7a8Fe2C7a1E94A0c6B8f5D3C1e7A9b2D400B03': { name: 'sera', emoji: '🌙' },
  '0xD3e3ef1B6e9803C0b5E9a8D2C4b7F3A1E6047B04': { name: 'degen.dani', emoji: '🎰' },
  '0x01b3Ab3D4f7E028B9a5C8d4F2E7c1A0B3D500B05': { name: 'vibecheck', emoji: '✨' },
  '0xe4dCa4E9b1F830A5d8B3e6C2A4d7F0E9B205B006': { name: 'nadia.node', emoji: '🔗' },
  '0xa0e4c2Ba5F1d8A73C0b6e4D7f3A9C5b8E2F1B007': { name: 'roxy.rust', emoji: '🦀' },
  '0x501b4Ac9F2d1705D4a8C7f6E3B9c2A5d8F30B008': { name: 'sol.bro', emoji: '🏄' },
  '0x2ec5F8b3E2d7C946D0f3a9B6e8C4A7f1D2E3B009': { name: 'zk.zara', emoji: '🔐' },
  '0xa00ed8Fe2C7a1E94A0c6B8f5D3C1e7A9b2D4B010': { name: 'moondust', emoji: '🚀' },
  '0xb1e31Bb7A4d29C506E7f4a3B2D9cF8a15E60B011': { name: 'pixel.pete', emoji: '🎨' },
  '0xea51cDa913dEB6f4967B2ef3Aa68F5a1AfCCB012': { name: 'gas.goblin', emoji: '⛽' },
};

export function agentLabel(addr: string): string {
  const a = AGENT_NAMES[addr];
  return a ? `${a.emoji} ${a.name}` : `@${addr.slice(0, 8)}`;
}
