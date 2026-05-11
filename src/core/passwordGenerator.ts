/**
 * Password Generator Module
 * Generates secure, random passwords with customizable options
 */

import crypto from 'crypto';

export interface GeneratorOptions {
  length?: number;
  useUppercase?: boolean;
  useLowercase?: boolean;
  useNumbers?: boolean;
  useSymbols?: boolean;
  excludeAmbiguous?: boolean;
  minNumbers?: number;
  minSymbols?: number;
}

const CHARSET = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  numbers: '0123456789',
  symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
  ambiguous: 'il1Lo0O', // Characters that look similar
};

export class PasswordGenerator {
  private static readonly DEFAULT_OPTIONS: GeneratorOptions = {
    length: 16,
    useUppercase: true,
    useLowercase: true,
    useNumbers: true,
    useSymbols: true,
    excludeAmbiguous: true,
    minNumbers: 1,
    minSymbols: 1,
  };

  /**
   * Generates a random password with the specified options
   */
  static generate(options: GeneratorOptions = {}): string {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };

    if ((opts.length || 0) < 4) {
      throw new Error('Password length must be at least 4 characters');
    }

    let charset = '';
    const requiredChars: string[] = [];

    // Build character set and required characters
    if (opts.useUppercase) {
      charset += this.removeAmbiguous(CHARSET.uppercase, opts.excludeAmbiguous);
      requiredChars.push(
        this.getRandomChar(this.removeAmbiguous(CHARSET.uppercase, opts.excludeAmbiguous))
      );
    }

    if (opts.useLowercase) {
      charset += this.removeAmbiguous(CHARSET.lowercase, opts.excludeAmbiguous);
      requiredChars.push(
        this.getRandomChar(this.removeAmbiguous(CHARSET.lowercase, opts.excludeAmbiguous))
      );
    }

    if (opts.useNumbers) {
      const numberChars = this.removeAmbiguous(CHARSET.numbers, opts.excludeAmbiguous);
      charset += numberChars;
      for (let i = 0; i < (opts.minNumbers || 1); i++) {
        requiredChars.push(this.getRandomChar(numberChars));
      }
    }

    if (opts.useSymbols) {
      const symbolChars = this.removeAmbiguous(CHARSET.symbols, opts.excludeAmbiguous);
      charset += symbolChars;
      for (let i = 0; i < (opts.minSymbols || 1); i++) {
        requiredChars.push(this.getRandomChar(symbolChars));
      }
    }

    if (!charset) {
      throw new Error('At least one character type must be selected');
    }

    // Generate remaining password characters
    const remaining = (opts.length || 16) - requiredChars.length;
    for (let i = 0; i < remaining; i++) {
      requiredChars.push(this.getRandomChar(charset));
    }

    // Shuffle the password
    return this.shuffle(requiredChars).join('');
  }

  /**
   * Gets a random character from a charset
   */
  private static getRandomChar(charset: string): string {
    const randomIndex = crypto.randomInt(0, charset.length);
    return charset[randomIndex];
  }

  /**
   * Removes ambiguous characters if enabled
   */
  private static removeAmbiguous(charset: string, exclude: boolean | undefined): string {
    if (!exclude) return charset;
    return charset.split('').filter((char) => !CHARSET.ambiguous.includes(char)).join('');
  }

  /**
   * Shuffles an array (Fisher-Yates)
   */
  private static shuffle<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = crypto.randomInt(0, i + 1);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Generates multiple passwords
   */
  static generateMultiple(count: number, options: GeneratorOptions = {}): string[] {
    return Array.from({ length: count }, () => this.generate(options));
  }
}

export default PasswordGenerator;
