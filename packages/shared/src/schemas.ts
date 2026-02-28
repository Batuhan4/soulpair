import { z } from 'zod';

// ===== Validation Schemas =====

export const ethereumAddressSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address');

export const ipfsCIDSchema = z
  .string()
  .min(10, 'Invalid IPFS CID')
  .max(100, 'Invalid IPFS CID');

export const signatureSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]+$/, 'Invalid signature');

// ===== API Request Schemas =====

export const createProfileSchema = z.object({
  walletAddress: ethereumAddressSchema,
  flirtMdCID: ipfsCIDSchema,
  twitterHandle: z.string().optional(),
  instagramHandle: z.string().optional(),
  linkedinHandle: z.string().optional(),
  signature: signatureSchema,
});

export const heartbeatSchema = z.object({
  walletAddress: ethereumAddressSchema,
  agentId: z.string().min(1).max(100),
  status: z.enum(['ready', 'busy', 'offline']),
  signature: signatureSchema,
});

export const matchResultSchema = z.object({
  conversationId: z.string().uuid(),
  result: z.object({
    outcome: z.enum(['match', 'no-match']),
    confidence: z.number().min(0).max(1),
    commonalities: z.array(z.string()),
    differences: z.array(z.string()),
    reasoning: z.string(),
    feedback: z
      .object({
        strengths: z.array(z.string()),
        weaknesses: z.array(z.string()),
        suggestions: z.array(z.string()),
      })
      .optional(),
  }),
  agentAddress: ethereumAddressSchema,
  signature: signatureSchema,
});

export const matchApprovalSchema = z.object({
  matchId: z.string().uuid(),
  approved: z.boolean(),
  walletAddress: ethereumAddressSchema,
  signature: signatureSchema,
});

// ===== flirt.md Schema =====

export const flirtMdSchema = z.object({
  basics: z.object({
    location: z.string().optional(),
    age: z.number().optional(),
    occupation: z.string().optional(),
  }),
  personality: z.object({
    mbtiEstimate: z.string().optional(),
    energy: z.string().optional(),
    communicationStyle: z.string().optional(),
  }),
  interests: z.object({
    music: z.array(z.string()).default([]),
    books: z.array(z.string()).default([]),
    hobbies: z.array(z.string()).default([]),
    tech: z.array(z.string()).default([]),
    other: z.array(z.string()).default([]),
  }),
  relationship: z.object({
    lookingFor: z.string().optional(),
    dealbreakers: z.array(z.string()).default([]),
    type: z.string().optional(),
  }),
  behavior: z.object({
    postingPattern: z.string().optional(),
    aesthetic: z.string().optional(),
    socialCircle: z.string().optional(),
  }),
  availability: z.object({
    days: z.array(z.string()).default([]),
    preferredTime: z.string().optional(),
  }),
});

export type FlirtMdData = z.infer<typeof flirtMdSchema>;
