"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
exports.optionalAuthenticate = optionalAuthenticate;
exports.authenticateApiKey = authenticateApiKey;
const admin = __importStar(require("firebase-admin"));
const domain_1 = require("@house-finder/domain");
const v2_1 = require("firebase-functions/v2");
/**
 * Authentication Middleware
 * Verifies Firebase ID token and attaches user context to request
 */
async function authenticate(req, res) {
    try {
        // Extract token from Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'Missing or invalid Authorization header',
            });
            return;
        }
        const token = authHeader.split('Bearer ')[1];
        // Verify the ID token
        const decodedToken = await admin.auth().verifyIdToken(token);
        // Attach decoded token to request
        req.user = decodedToken;
        // Build auth context
        const authContext = {
            uid: decodedToken.uid,
            email: decodedToken.email,
            emailVerified: decodedToken.email_verified || false,
            role: decodedToken.role || domain_1.UserRole.USER,
            workspaceId: decodedToken.workspaceId || decodedToken.uid,
            customClaims: decodedToken.role ? {
                role: decodedToken.role,
                workspaceId: decodedToken.workspaceId || decodedToken.uid,
                permissions: decodedToken.permissions,
                subscriptionPlan: decodedToken.subscriptionPlan,
            } : undefined,
            token: {
                iat: decodedToken.iat,
                exp: decodedToken.exp,
                aud: decodedToken.aud,
                iss: decodedToken.iss,
                sub: decodedToken.sub,
            },
        };
        req.auth = authContext;
        v2_1.logger.info('User authenticated', {
            uid: authContext.uid,
            role: authContext.role,
            workspaceId: authContext.workspaceId,
        });
        ;
    }
    catch (error) {
        v2_1.logger.error('Authentication failed', { error });
        if (error instanceof Error) {
            if (error.message.includes('expired')) {
                res.status(401).json({
                    error: 'TokenExpired',
                    message: 'Authentication token has expired',
                });
                return;
            }
            if (error.message.includes('revoked')) {
                res.status(401).json({
                    error: 'TokenRevoked',
                    message: 'Authentication token has been revoked',
                });
                return;
            }
        }
        res.status(401).json({
            error: 'Unauthorized',
            message: 'Invalid authentication token',
        });
    }
}
/**
 * Optional Authentication Middleware
 * Attaches user context if token is present, but doesn't require it
 */
async function optionalAuthenticate(req, res) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        // No token provided, continue without auth context
        ;
        return;
    }
    try {
        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await admin.auth().verifyIdToken(token);
        req.user = decodedToken;
        const authContext = {
            uid: decodedToken.uid,
            email: decodedToken.email,
            emailVerified: decodedToken.email_verified || false,
            role: decodedToken.role || domain_1.UserRole.USER,
            workspaceId: decodedToken.workspaceId || decodedToken.uid,
            customClaims: decodedToken.role ? {
                role: decodedToken.role,
                workspaceId: decodedToken.workspaceId || decodedToken.uid,
                permissions: decodedToken.permissions,
                subscriptionPlan: decodedToken.subscriptionPlan,
            } : undefined,
            token: {
                iat: decodedToken.iat,
                exp: decodedToken.exp,
                aud: decodedToken.aud,
                iss: decodedToken.iss,
                sub: decodedToken.sub,
            },
        };
        req.auth = authContext;
    }
    catch (error) {
        v2_1.logger.warn('Optional authentication failed, continuing without auth', { error });
    }
    ;
}
/**
 * API Key Authentication Middleware
 * For service-to-service authentication
 */
async function authenticateApiKey(req, res) {
    try {
        const apiKey = req.headers['x-api-key'];
        if (!apiKey) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'Missing API key',
            });
            return;
        }
        // Verify API key in Firestore
        const apiKeyDoc = await admin.firestore()
            .collection('apiKeys')
            .where('key', '==', apiKey)
            .where('status', '==', 'active')
            .limit(1)
            .get();
        if (apiKeyDoc.empty) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'Invalid API key',
            });
            return;
        }
        const apiKeyData = apiKeyDoc.docs[0].data();
        // Check expiration
        if (apiKeyData.expiresAt && apiKeyData.expiresAt.toDate() < new Date()) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'API key has expired',
            });
            return;
        }
        // Update last used
        await apiKeyDoc.docs[0].ref.update({
            lastUsedAt: admin.firestore.FieldValue.serverTimestamp(),
            usageCount: admin.firestore.FieldValue.increment(1),
        });
        // Build auth context from API key
        const authContext = {
            uid: `api_key:${apiKeyDoc.docs[0].id}`,
            email: undefined,
            emailVerified: true,
            role: domain_1.UserRole.USER, // API keys have limited permissions
            workspaceId: apiKeyData.workspaceId,
            token: {
                iat: Math.floor(Date.now() / 1000),
                exp: Math.floor(Date.now() / 1000) + 3600,
                aud: 'house-finder-api',
                iss: 'house-finder-api',
                sub: `api_key:${apiKeyDoc.docs[0].id}`,
            },
        };
        req.auth = authContext;
        v2_1.logger.info('API key authenticated', {
            apiKeyId: apiKeyDoc.docs[0].id,
            workspaceId: authContext.workspaceId,
        });
        ;
    }
    catch (error) {
        v2_1.logger.error('API key authentication failed', { error });
        res.status(401).json({
            error: 'Unauthorized',
            message: 'API key authentication failed',
        });
    }
}
//# sourceMappingURL=auth-middleware.js.map