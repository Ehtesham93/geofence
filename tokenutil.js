// Express middleware to extract JWT from cookie header and attach claims to req
import { GetUnVerifiedClaims } from './jwtutil.js';
import { APIResponseUnauthorized } from './responseutil.js';

export const AuthenticateAccountTokenFromCookie = (req, res, next) => {
    try {
        const cookie = req.headers['Cookie'] || req.headers['cookie'];
        let token = req.headers['Cookie'] || req.headers['cookie'];
        if (!token) {
            APIResponseUnauthorized(req, res, 'TOKEN_REQUIRED', 'Token is required', 'Token is required');
            return;
        }

        // handle multiple cookies
        if (token.includes(';')) {
            const cookies = token.split(';');
            for (let eachcookie of cookies) {
                eachcookie = eachcookie.trim();
                if (eachcookie.startsWith('token=')) {
                    token = eachcookie.substring(6);
                    break;
                }
            }
        }

        if (token.startsWith('token=')) {
            token = token.substring(6);
        }

        const claims = GetUnVerifiedClaims(token);
        if (!claims) {
            APIResponseUnauthorized(req, res, 'INVALID_TOKEN', 'Invalid token', 'Invalid token');
            return;
        }

        if (!claims.userid) {
            APIResponseUnauthorized(req, res, 'INVALID_TOKEN', 'User ID is missing in token', 'User ID is missing in token');
            return;
        }

        if (!claims.accountid) {
            APIResponseUnauthorized(req, res, 'INVALID_TOKEN', 'Account ID is missing in token', 'Account ID is missing in token');
            return;
        }

        req.cookie = cookie;
        req.token = token;
        req.userid = claims.userid;
        req.accountid = claims.accountid;

        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Pragma', 'no-cache');

        next();
    } catch (error) {
        APIResponseUnauthorized(req, res, 'INVALID_TOKEN', 'Account token validation failed', 'Account token validation failed');
    }
};
