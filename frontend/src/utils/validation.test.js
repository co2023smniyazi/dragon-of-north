import { describe, it, expect } from 'vitest';
import {
    isEmail,
    isPhone,
    normalizePhone,
    validateIdentifier,
    validatePassword,
    getIdentifierType,
} from './validation';

describe('isEmail', () => {
    it('returns true for valid email addresses', () => {
        expect(isEmail('user@example.com')).toBe(true);
        expect(isEmail('user.name+tag@sub.domain.org')).toBe(true);
    });

    it('returns false for non-email strings', () => {
        expect(isEmail('')).toBe(false);
        expect(isEmail('notanemail')).toBe(false);
        expect(isEmail('missing@')).toBe(false);
        expect(isEmail('@nodomain.com')).toBe(false);
    });

    it('trims whitespace before checking', () => {
        expect(isEmail('  user@example.com  ')).toBe(true);
    });
});

describe('normalizePhone', () => {
    it('strips all non-digit characters', () => {
        expect(normalizePhone('+44 7911 123456')).toBe('447911123456');
        expect(normalizePhone('(123) 456-7890')).toBe('1234567890');
    });

    it('returns empty string for empty input', () => {
        expect(normalizePhone('')).toBe('');
    });
});

describe('isPhone', () => {
    it('returns true for valid phone with + prefix', () => {
        expect(isPhone('+12345678901')).toBe(true);
    });

    it('returns true for 10-digit number without formatting', () => {
        expect(isPhone('1234567890')).toBe(true);
    });

    it('returns false for too-short numbers', () => {
        expect(isPhone('12345')).toBe(false);
    });

    it('returns false for empty string', () => {
        expect(isPhone('')).toBe(false);
    });
});

describe('validateIdentifier', () => {
    it('returns error for empty input', () => {
        expect(validateIdentifier('')).toBeTruthy();
        expect(validateIdentifier('   ')).toBeTruthy();
    });

    it('returns empty string for valid email', () => {
        expect(validateIdentifier('user@example.com')).toBe('');
    });

    it('returns empty string for valid phone', () => {
        expect(validateIdentifier('+12345678901')).toBe('');
    });

    it('returns error for invalid input that is neither email nor phone', () => {
        expect(validateIdentifier('notvalid')).toBeTruthy();
    });
});

describe('validatePassword', () => {
    it('returns no errors for strong password', () => {
        expect(validatePassword('SecurePass1!')).toHaveLength(0);
    });

    it('returns error when password is too short', () => {
        const errors = validatePassword('Ab1!');
        expect(errors).toContain('At least 8 characters.');
    });

    it('returns error when no uppercase letter', () => {
        const errors = validatePassword('lowercase1!');
        expect(errors).toContain('At least one uppercase letter.');
    });

    it('returns error when no lowercase letter', () => {
        const errors = validatePassword('UPPERCASE1!');
        expect(errors).toContain('At least one lowercase letter.');
    });

    it('returns error when no digit', () => {
        const errors = validatePassword('NoDigitHere!');
        expect(errors).toContain('At least one number.');
    });

    it('returns error when no special character', () => {
        const errors = validatePassword('NoSpecial1');
        expect(errors).toContain('At least one special character.');
    });

    it('returns multiple errors for weak password', () => {
        const errors = validatePassword('weak');
        expect(errors.length).toBeGreaterThan(1);
    });
});

describe('getIdentifierType', () => {
    it('returns EMAIL for email input', () => {
        expect(getIdentifierType('user@example.com')).toBe('EMAIL');
    });

    it('returns PHONE for phone input', () => {
        expect(getIdentifierType('+12345678901')).toBe('PHONE');
    });
});
