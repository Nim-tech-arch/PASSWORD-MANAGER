/**
 * Password Strength Validator
 * Checks password strength and provides feedback for improvements
 */

import { PasswordStrength } from './types';

export class PasswordValidator {
  /**
   * Analyzes password strength and returns detailed feedback
   */
  static checkStrength(password: string): PasswordStrength {
    const feedback: string[] = [];
    let score = 0;

    if (!password || password.length === 0) {
      return {
        score: 0,
        level: 'Very Weak',
        feedback: ['Password is empty'],
      };
    }

    // Length checks
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (password.length >= 16) score++;

    if (password.length < 8) {
      feedback.push('Password should be at least 8 characters long');
    } else if (password.length < 12) {
      feedback.push('Consider using 12+ characters for better security');
    }

    // Uppercase checks
    if (/[A-Z]/.test(password)) {
      score++;
    } else {
      feedback.push('Add uppercase letters (A-Z)');
    }

    // Lowercase checks
    if (/[a-z]/.test(password)) {
      score++;
    } else {
      feedback.push('Add lowercase letters (a-z)');
    }

    // Numbers checks
    if (/\d/.test(password)) {
      score++;
    } else {
      feedback.push('Add numbers (0-9)');
    }

    // Special characters checks
    if (/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) {
      score++;
    } else {
      feedback.push('Add special characters (!@#$%^&*)');
    }

    // Detect common patterns
    if (this.hasCommonPatterns(password)) {
      feedback.push('Avoid common patterns like sequential numbers or repeated characters');
      score = Math.max(0, score - 1);
    }

    // Entropy estimation
    const entropy = this.calculateEntropy(password);
    if (entropy < 50) {
      feedback.push('Password entropy is too low, add more variety');
    }

    // Determine level
    const level = this.getLevel(score);

    return {
      score: Math.min(5, Math.max(0, score)),
      level,
      feedback: feedback.length > 0 ? feedback : ['Strong password!'],
    };
  }

  /**
   * Detects common password patterns
   */
  private static hasCommonPatterns(password: string): boolean {
    const commonPatterns = [
      /^[a-zA-Z]+\d+$/, // Only letters followed by numbers
      /(.)\1{2,}/, // Repeated characters (e.g., "aaa")
      /(?:0123|1234|2345|3456|4567|5678|6789|9876)/, // Sequential numbers
      /^password/, // Starts with "password"
      /^123/, // Starts with sequential numbers
      /qwerty/, // Keyboard patterns
      /^admin/, // Common usernames
    ];

    return commonPatterns.some((pattern) => pattern.test(password));
  }

  /**
   * Calculates password entropy (in bits)
   */
  private static calculateEntropy(password: string): number {
    let poolSize = 0;

    if (/[a-z]/.test(password)) poolSize += 26;
    if (/[A-Z]/.test(password)) poolSize += 26;
    if (/\d/.test(password)) poolSize += 10;
    if (/[^a-zA-Z0-9]/.test(password)) poolSize += 32;

    if (poolSize === 0) return 0;

    const entropy = password.length * Math.log2(poolSize);
    return entropy;
  }

  /**
   * Determines password strength level
   */
  private static getLevel(
    score: number
  ): 'Very Weak' | 'Weak' | 'Fair' | 'Good' | 'Strong' | 'Very Strong' {
    const levels: Record<number, 'Very Weak' | 'Weak' | 'Fair' | 'Good' | 'Strong' | 'Very Strong'> = {
      0: 'Very Weak',
      1: 'Very Weak',
      2: 'Weak',
      3: 'Fair',
      4: 'Good',
      5: 'Strong',
      6: 'Very Strong',
    };

    return levels[Math.min(6, score)] || 'Very Weak';
  }

  /**
   * Checks if password meets minimum requirements
   */
  static meetsRequirements(
    password: string,
    options: {
      minLength?: number;
      requireUppercase?: boolean;
      requireLowercase?: boolean;
      requireNumbers?: boolean;
      requireSymbols?: boolean;
      minStrengthLevel?: number;
    } = {}
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const {
      minLength = 8,
      requireUppercase = true,
      requireLowercase = true,
      requireNumbers = true,
      requireSymbols = false,
      minStrengthLevel = 2,
    } = options;

    if (password.length < minLength) {
      errors.push(`Password must be at least ${minLength} characters long`);
    }

    if (requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (requireSymbols && !/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    const strength = this.checkStrength(password);
    if (strength.score < minStrengthLevel) {
      errors.push(`Password strength is too weak (score: ${strength.score}/${5})`);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export default PasswordValidator;
