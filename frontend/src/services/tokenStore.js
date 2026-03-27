let accessToken = null;

const TOKEN_KEYS = ['access_token', 'accessToken', 'token', 'jwt'];

const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;

export const getAccessToken = () => accessToken;

export const setAccessToken = (token) => {
    accessToken = isNonEmptyString(token) ? token : null;
    return accessToken;
};

export const clearAccessToken = () => {
    accessToken = null;
};

export const extractAccessToken = (payload) => {
    if (!payload || typeof payload !== 'object') {
        return null;
    }

    for (const key of TOKEN_KEYS) {
        const tokenValue = payload[key];
        if (isNonEmptyString(tokenValue)) {
            return tokenValue;
        }
    }

    const nestedData = payload.data;
    if (nestedData && typeof nestedData === 'object') {
        for (const key of TOKEN_KEYS) {
            const tokenValue = nestedData[key];
            if (isNonEmptyString(tokenValue)) {
                return tokenValue;
            }
        }
    }

    return null;
};

