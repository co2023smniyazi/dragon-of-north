import {API_CONFIG} from '../config'

export const CSRF_COOKIE_NAME = API_CONFIG.CSRF_COOKIE_NAME || 'XSRF-TOKEN'
export const CSRF_HEADER_NAME = API_CONFIG.CSRF_HEADER_NAME || 'X-XSRF-TOKEN'

let cachedCsrfToken = null
let csrfBootstrapPromise = null

export const isStateChangingMethod = (method = 'GET') => {
    const normalizedMethod = method.toUpperCase()
    return !['GET', 'HEAD', 'OPTIONS', 'TRACE'].includes(normalizedMethod)
}

export const readCookie = (cookieName) => {
    if (typeof document === 'undefined' || !document.cookie) {
        return null
    }

    const encodedName = encodeURIComponent(cookieName)
    const cookies = document.cookie.split(';')

    for (const cookiePair of cookies) {
        const [rawKey, ...rawValueParts] = cookiePair.trim().split('=')
        if (rawKey === encodedName) {
            const rawValue = rawValueParts.join('=')
            return decodeURIComponent(rawValue)
        }
    }

    return null
}

const fetchCsrfToken = async () => {
    const endpoint = API_CONFIG.ENDPOINTS.CSRF || '/api/v1/auth/csrf'
    const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
            Accept: 'application/json',
        },
    })

    if (!response.ok) {
        throw new Error('Failed to bootstrap CSRF token')
    }

    const tokenFromCookie = readCookie(CSRF_COOKIE_NAME)
    if (!tokenFromCookie) {
        throw new Error(`CSRF cookie ${CSRF_COOKIE_NAME} was not set by backend`)
    }

    return tokenFromCookie
}

export const ensureCsrfToken = async ({forceRefresh = false} = {}) => {
    const tokenFromCookie = readCookie(CSRF_COOKIE_NAME)
    if (!forceRefresh && tokenFromCookie) {
        cachedCsrfToken = tokenFromCookie
        return tokenFromCookie
    }

    if (!forceRefresh && cachedCsrfToken && tokenFromCookie) {
        return cachedCsrfToken
    }

    if (!forceRefresh && csrfBootstrapPromise) {
        return csrfBootstrapPromise
    }

    csrfBootstrapPromise = fetchCsrfToken()
        .then((token) => {
            cachedCsrfToken = token
            return token
        })
        .finally(() => {
            csrfBootstrapPromise = null
        })

    return csrfBootstrapPromise
}
