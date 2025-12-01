import { z } from 'zod';

// ============================================
// User schemas
// ============================================
export const ApiUserSchema = z.object({
	id: z.string().min(1),
	username: z.string().optional(),
	avatar: z.string().url().optional().nullable(),
	balance: z.number().min(0),
	stats: z.object({
		spinsCount: z.number().int().min(0),
		lastAuthAt: z.number().nullable()
	}).optional(),
	telegram: z.object({
		id: z.number().int(),
		firstName: z.string(),
		lastName: z.string().optional(),
		username: z.string().optional(),
		hasPhoto: z.boolean().optional(),
		registeredAt: z.number()
	}).optional(),
	perks: z.object({
		freeSpins: z.boolean().optional(),
		unlimitedBalance: z.boolean().optional()
	}).optional(),
	shards: z.record(z.string(), z.number().int().min(0)).optional(),
	shardUpdatedAt: z.record(z.string(), z.number()).optional()
});

export const ApiUserPatchSchema = z.object({
	balance: z.number().min(0).optional(),
	stats: z.object({
		spinsCount: z.number().int().min(0).optional(),
		lastAuthAt: z.number().nullable().optional()
	}).optional()
}).passthrough(); // Allow extra fields for extensibility

// ============================================
// Prize schemas
// ============================================
export const ApiPrizeSchema = z.object({
	id: z.number().int(),
	name: z.string().min(1),
	price: z.number().min(0),
	image: z.string(),
	rarity: z.enum(['common', 'rare', 'epic', 'legendary']).optional(),
	isShard: z.boolean().optional(),
	benefit: z.object({
		type: z.enum(['bigwin', 'multiplier', 'bonus']),
		value: z.number().optional()
	}).optional(),
	nonRemovableGift: z.boolean().optional()
});

// ============================================
// Case schemas
// ============================================
export const ApiCaseSchema = z.object({
	id: z.string().min(1),
	name: z.string().min(1),
	price: z.number().min(0),
	image: z.string(),
	items: z.array(ApiPrizeSchema).min(1),
	featured: z.boolean().optional(),
	category: z.string().optional()
});

// ============================================
// Inventory schemas
// ============================================
export const ApiInventoryItemSchema = z.object({
	id: z.string().min(1),
	prize: ApiPrizeSchema,
	wonAt: z.number(),
	fromCase: z.string(),
	status: z.enum(['active', 'sold', 'received']).optional()
});

// ============================================
// Spin schemas
// ============================================
export const SpinRequestSchema = z.object({
  caseId: z.union([z.string(), z.number()]).transform(val => String(val)),
  items: z.array(z.object({
    id: z.number().int(),
    ev: z.number().min(0),
    rarity: z.enum(['common', 'rare', 'epic', 'legendary']).optional(),
    benefitType: z.enum(['bigwin', 'multiplier', 'bonus']).optional()
  })).min(1)
});

export const SpinResponseSchema = z.object({
	prizeId: z.number().int(),
	position: z.number().optional(),
	serverPrize: z.object({
		id: z.number().int(),
		name: z.string().optional(),
		price: z.number().min(0).optional(),
		rarity: z.enum(['common', 'rare', 'epic', 'legendary']).optional(),
		image: z.string().optional()
	}).optional(),
	userPatch: ApiUserPatchSchema.optional(),
	raw: z.unknown().optional()
});

// ============================================
// Banner schemas
// ============================================
export const ApiBannerSchema = z.object({
	id: z.string().min(1),
	imageUrl: z.string().url(),
	title: z.string().optional(),
	description: z.string().optional(),
	linkUrl: z.string().optional(),
	order: z.number().int().optional()
});

// ============================================
// Product schemas
// ============================================
export const ApiProductSchema = z.object({
	id: z.string().min(1),
	name: z.string().min(1),
	description: z.string().optional(),
	price: z.number().min(0),
	image: z.string(),
	category: z.string().optional(),
	available: z.boolean().optional()
});

// ============================================
// Auth schemas
// ============================================
export const AuthResponseSchema = z.object({
	token: z.string().min(1),
	refreshToken: z.string().optional(),
	expiresIn: z.number().int().positive().optional(),
	expiresAt: z.union([z.string(), z.number()]).optional(),
	accessToken: z.string().optional(),
	user: z.unknown().optional()
});

// ============================================
// Generic API response wrapper
// ============================================
export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) => z.object({
	success: z.boolean(),
	data: dataSchema.optional(),
	error: z.object({
		code: z.string(),
		message: z.string(),
		details: z.unknown().optional()
	}).optional(),
	meta: z.object({
		timestamp: z.number().optional(),
		requestId: z.string().optional()
	}).optional()
});

// ============================================
// Type exports
// ============================================
export type ApiUser = z.infer<typeof ApiUserSchema>;
export type ApiUserPatch = z.infer<typeof ApiUserPatchSchema>;
export type ApiPrize = z.infer<typeof ApiPrizeSchema>;
export type ApiCase = z.infer<typeof ApiCaseSchema>;
export type ApiInventoryItem = z.infer<typeof ApiInventoryItemSchema>;
export type SpinRequest = z.infer<typeof SpinRequestSchema>;
export type SpinResponse = z.infer<typeof SpinResponseSchema>;
export type ApiBanner = z.infer<typeof ApiBannerSchema>;
export type ApiProduct = z.infer<typeof ApiProductSchema>;
export type AuthResponse = z.infer<typeof AuthResponseSchema>;
