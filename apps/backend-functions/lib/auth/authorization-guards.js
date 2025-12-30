"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = requireRole;
exports.requirePermission = requirePermission;
exports.requireEmailVerified = requireEmailVerified;
exports.requireWorkspaceOwnership = requireWorkspaceOwnership;
exports.requireResourceOwnership = requireResourceOwnership;
exports.requireSubscription = requireSubscription;
exports.getRateLimitKeyFromAuth = getRateLimitKeyFromAuth;
const domain_1 = require("@house-finder/domain");
const v2_1 = require("firebase-functions/v2");
/**
 * Role-Based Authorization Guard
 * Requires user to have at least one of the specified roles
 */
function requireRole(...allowedRoles) {
    if (!req.auth) {
        res.status(401).json({
            error: 'Unauthorized',
            message: 'Authentication required',
        });
        return;
    }
    const userRole = req.auth.role;
    if (!allowedRoles.includes(userRole)) {
        v2_1.logger.warn('Insufficient permissions', {
            uid: req.auth.uid,
            userRole,
            requiredRoles: allowedRoles,
        });
        res.status(403).json({
            error: 'Forbidden',
            message: 'Insufficient permissions',
            required: allowedRoles,
            current: userRole,
        });
        return;
    }
    ;
}
;
/**
 * Permission-Based Authorization Guard
 * Requires user to have specific permission for a resource
 */
function requirePermission(resource, action) {
    if (!req.auth) {
        res.status(401).json({
            error: 'Unauthorized',
            message: 'Authentication required',
        });
        return;
    }
    const userRole = req.auth.role;
    const rolePermissions = domain_1.ROLE_PERMISSIONS[userRole];
    // Check if user has wildcard permission
    const hasWildcard = rolePermissions.some(p => p.resource === '*' && p.actions.includes(action));
    if (hasWildcard) {
        ;
        return;
    }
    // Check if user has specific permission
    const hasPermission = rolePermissions.some(p => p.resource === resource && p.actions.includes(action));
    if (!hasPermission) {
        v2_1.logger.warn('Permission denied', {
            uid: req.auth.uid,
            userRole,
            resource,
            action,
        });
        res.status(403).json({
            error: 'Forbidden',
            message: `Permission denied for ${action} on ${resource}`,
        });
        return;
    }
    ;
}
;
/**
 * Email Verification Guard
 * Requires user to have verified email
 */
function requireEmailVerified(req, res) {
    if (!req.auth) {
        res.status(401).json({
            error: 'Unauthorized',
            message: 'Authentication required',
        });
        return;
    }
    if (!req.auth.emailVerified) {
        res.status(403).json({
            error: 'EmailNotVerified',
            message: 'Email verification required',
        });
        return;
    }
    ;
}
/**
 * Workspace Ownership Guard
 * Ensures user can only access their own workspace data
 */
function requireWorkspaceOwnership(req, res) {
    if (!req.auth) {
        res.status(401).json({
            error: 'Unauthorized',
            message: 'Authentication required',
        });
        return;
    }
    // Extract workspace ID from request (can be in params, query, or body)
    const requestedWorkspaceId = req.params.workspaceId || req.query.workspaceId || req.body?.workspaceId;
    if (!requestedWorkspaceId) {
        // If no workspace ID in request, inject user's workspace ID
        req.params.workspaceId = req.auth.workspaceId;
        ;
        return;
    }
    // Check if user is accessing their own workspace
    if (requestedWorkspaceId !== req.auth.workspaceId) {
        // Allow admins to access any workspace
        if (req.auth.role === domain_1.UserRole.ADMIN || req.auth.role === domain_1.UserRole.SUPER_ADMIN) {
            ;
            return;
        }
        v2_1.logger.warn('Workspace access denied', {
            uid: req.auth.uid,
            userWorkspaceId: req.auth.workspaceId,
            requestedWorkspaceId,
        });
        res.status(403).json({
            error: 'Forbidden',
            message: 'Access denied to this workspace',
        });
        return;
    }
    ;
}
/**
 * Resource Ownership Guard
 * Ensures user can only access resources they own
 */
function requireResourceOwnership(resourceField = 'userId') {
    if (!req.auth) {
        res.status(401).json({
            error: 'Unauthorized',
            message: 'Authentication required',
        });
        return;
    }
    // Extract resource owner ID from request
    const resourceOwnerId = req.params[resourceField] || req.query[resourceField] || req.body?.[resourceField];
    if (!resourceOwnerId) {
        // If no owner ID specified, inject current user's ID
        if (req.body) {
            req.body[resourceField] = req.auth.uid;
        }
        else {
            req.body = { [resourceField]: req.auth.uid };
        }
        ;
        return;
    }
    // Check if user owns the resource
    if (resourceOwnerId !== req.auth.uid) {
        // Allow admins to access any resource
        if (req.auth.role === domain_1.UserRole.ADMIN || req.auth.role === domain_1.UserRole.SUPER_ADMIN) {
            ;
            return;
        }
        v2_1.logger.warn('Resource access denied', {
            uid: req.auth.uid,
            resourceOwnerId,
        });
        res.status(403).json({
            error: 'Forbidden',
            message: 'Access denied to this resource',
        });
        return;
    }
    ;
}
;
/**
 * Subscription Tier Guard
 * Requires user to have at least the specified subscription tier
 */
function requireSubscription(...allowedPlans) {
    if (!req.auth) {
        res.status(401).json({
            error: 'Unauthorized',
            message: 'Authentication required',
        });
        return;
    }
    const userPlan = req.auth.customClaims?.subscriptionPlan || 'free';
    if (!allowedPlans.includes(userPlan)) {
        res.status(403).json({
            error: 'SubscriptionRequired',
            message: 'Upgrade your subscription to access this feature',
            required: allowedPlans,
            current: userPlan,
        });
        return;
    }
    ;
}
;
/**
 * Rate Limiting Helper
 * Can be used with external rate limiting libraries
 */
function getRateLimitKeyFromAuth(req) {
    if (req.auth) {
        // Authenticated users: use UID
        return `user:${req.auth.uid}`;
    }
    else {
        // Anonymous users: use IP address
        return `ip:${req.ip}`;
    }
}
//# sourceMappingURL=authorization-guards.js.map