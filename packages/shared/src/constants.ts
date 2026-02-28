// ===== Monad Networks =====

export const MONAD_TESTNET = {
  chainId: 10143,
  name: 'Monad Testnet',
  rpcUrl: 'https://testnet-rpc.monad.xyz',
  explorers: {
    socialscan: 'https://monad-testnet.socialscan.io',
    monadVision: 'https://testnet.monadvision.com',
    monadscan: 'https://testnet.monadscan.com',
  },
  faucet: 'https://faucet.monad.xyz',
  agentFaucetAPI: 'https://agents.devnads.com/v1/faucet',
  agentVerifyAPI: 'https://agents.devnads.com/v1/verify',
  nativeCurrency: {
    name: 'MON',
    symbol: 'MON',
    decimals: 18,
  },
} as const;

export const MONAD_MAINNET = {
  chainId: 143,
  name: 'Monad Mainnet',
  rpcUrl: 'https://rpc.monad.xyz',
  explorers: {
    socialscan: 'https://monad.socialscan.io',
    monadVision: 'https://monadvision.com',
    monadscan: 'https://monadscan.com',
  },
  nativeCurrency: {
    name: 'MON',
    symbol: 'MON',
    decimals: 18,
  },
} as const;

// ===== Contract Addresses (updated after deploy) =====

export const CONTRACTS = {
  SoulProfile: '0x2933c44D040EB73C07483e9103660DCeeba840E8',
  MatchRegistry: '0x2A5Ec86774B41D6052c262fCe06729b40b75a37D',
} as const;

// ===== Soulpair Config =====

export const SOULPAIR_CONFIG = {
  // Heartbeat interval (30 minutes in ms)
  HEARTBEAT_INTERVAL_MS: 30 * 60 * 1000,

  // Agent limits
  MAX_CONCURRENT_CONVERSATIONS: 5,
  MAX_ACTIVE_MATCHES: 2,

  // Conversation
  CONVERSATION_TIMEOUT_MS: 5 * 60 * 1000, // 5 minutes
  MAX_MESSAGES_PER_CONVERSATION: 30,

  // Matchmaking
  REMATCH_COOLDOWN_MS: 24 * 60 * 60 * 1000, // 24 hours

  // Match fee (in MON, as wei string)
  BASE_MATCH_FEE: '10000000000000000', // 0.01 MON

  // Fee multipliers
  FEE_MULTIPLIERS: {
    NEW: 0.5,      // 0-5 matches
    ACTIVE: 1.0,   // 5-20 matches
    POPULAR: 0.8,  // 20-50 matches
    STAR: 0.5,     // 50+ matches
  },

  // IPFS
  PINATA_GATEWAY: 'https://gateway.pinata.cloud/ipfs/',

  // flirt.md max size
  FLIRT_MD_MAX_SIZE_BYTES: 50 * 1024, // 50KB
} as const;

// ===== API Endpoints =====

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
export const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';
