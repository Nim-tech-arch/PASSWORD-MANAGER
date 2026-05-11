/**
 * CLI Entry Point
 * Command-line interface for the Password Manager
 */

import { Command } from 'commander';
import * as inquirer from 'inquirer';
import chalk from 'chalk';
import DatabaseService from '../core/database';
import PasswordGenerator from '../core/passwordGenerator';
import PasswordValidator from '../core/passwordValidator';
import ImportExportService from '../utils/importExport';
import { PasswordEntry } from '../core/types';

class PasswordManagerCLI {
  private db: DatabaseService;
  private program: Command;
  private importExport: ImportExportService;

  constructor() {
    this.db = new DatabaseService('./data/passwords.db');
    this.program = new Command();
    this.importExport = new ImportExportService();
    this.setupCommands();
  }

  private setupCommands(): void {
    this.program
      .name('password-manager')
      .description('A secure password manager CLI')
      .version('0.1.0');

    // Master password setup
    this.program
      .command('setup')
      .description('Setup master password (first time only)')
      .action(() => this.setupMasterPassword());

    // Add password
    this.program
      .command('add')
      .description('Add a new password entry')
      .action(() => this.addPassword());

    // Get password
    this.program
      .command('get <service>')
      .description('Retrieve a password by service name')
      .action((service) => this.getPassword(service));

    // List all passwords
    this.program
      .command('list')
      .description('List all password entries')
      .action(() => this.listPasswords());

    // Search passwords
    this.program
      .command('search <query>')
      .description('Search for password entries')
      .action((query) => this.searchPasswords(query));

    // Generate password
    this.program
      .command('generate')
      .description('Generate a strong random password')
      .option('-l, --length <number>', 'Password length (default: 16)', '16')
      .option('--no-uppercase', 'Exclude uppercase letters')
      .option('--no-lowercase', 'Exclude lowercase letters')
      .option('--no-numbers', 'Exclude numbers')
      .option('--no-symbols', 'Exclude symbols')
      .action((options) => this.generatePassword(options));

    // Check password strength
    this.program
      .command('strength <password>')
      .description('Check password strength')
      .action((password) => this.checkStrength(password));

    // Update password
    this.program
      .command('update <service>')
      .description('Update a password entry')
      .action((service) => this.updatePassword(service));

    // Delete password
    this.program
      .command('delete <service>')
      .description('Delete a password entry')
      .action((service) => this.deletePassword(service));

    // Export
    this.program
      .command('export <file>')
      .description('Export all passwords (encrypted)')
      .option('-f, --format <type>', 'Export format: json or csv (default: json)', 'json')
      .action((file, options) => this.exportPasswords(file, options));

    // Import
    this.program
      .command('import <file>')
      .description('Import passwords from file')
      .option('-f, --format <type>', 'Import format: json or csv (default: json)', 'json')
      .action((file, options) => this.importPasswords(file, options));

    // Lock/Close
    this.program
      .command('lock')
      .description('Lock and close the application')
      .action(() => this.lock());
  }

  async run(args: string[]): Promise<void> {
    try {
      // Initialize database
      await this.db.initialize();

      // Check if master password is set
      const hasMasterPassword = await this.db.hasMasterPassword();

      if (!hasMasterPassword && !args.includes('setup')) {
        console.log(chalk.yellow('⚠️  Master password not set. Please run: password-manager setup'));
        process.exit(1);
      }

      // Verify master password (unless running setup)
      if (hasMasterPassword && !args.includes('setup')) {
        const isVerified = await this.verifyMasterPassword();
        if (!isVerified) {
          console.log(chalk.red('❌ Incorrect master password'));
          process.exit(1);
        }
      }

      // Parse and run command
      await this.program.parseAsync(args);
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    } finally {
      await this.db.close();
    }
  }

  private async setupMasterPassword(): Promise<void> {
    const answers = await inquirer.prompt([
      {
        type: 'password',
        name: 'password',
        message: 'Enter master password:',
        mask: '*',
      },
      {
        type: 'password',
        name: 'confirm',
        message: 'Confirm master password:',
        mask: '*',
      },
    ]);

    if (answers.password !== answers.confirm) {
      console.log(chalk.red('❌ Passwords do not match'));
      return;
    }

    // Validate password strength
    const strength = PasswordValidator.checkStrength(answers.password);
    if (strength.score < 3) {
      console.log(chalk.yellow('⚠️  Weak master password!'));
      strength.feedback.forEach((f) => console.log(`  - ${f}`));
      return;
    }

    await this.db.setMasterPassword(answers.password);
    console.log(chalk.green('✅ Master password set successfully'));
  }

  private async verifyMasterPassword(): Promise<boolean> {
    const answers = await inquirer.prompt([
      {
        type: 'password',
        name: 'password',
        message: 'Enter master password:',
        mask: '*',
      },
    ]);

    return await this.db.verifyMasterPassword(answers.password);
  }

  private async addPassword(): Promise<void> {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'service',
        message: 'Service name (e.g., Gmail, GitHub):',
        validate: (value) => value.trim().length > 0 || 'Service name is required',
      },
      {
        type: 'input',
        name: 'username',
        message: 'Username/Email:',
        validate: (value) => value.trim().length > 0 || 'Username is required',
      },
      {
        type: 'input',
        name: 'password',
        message: 'Password:',
        mask: '*',
        validate: (value) => value.length > 0 || 'Password is required',
      },
      {
        type: 'input',
        name: 'url',
        message: 'URL (optional):',
      },
      {
        type: 'input',
        name: 'notes',
        message: 'Notes (optional):',
      },
    ]);

    const entry = await this.db.addEntry({
      service: answers.service,
      username: answers.username,
      password: answers.password,
      url: answers.url || undefined,
      notes: answers.notes || undefined,
    });

    console.log(chalk.green(`✅ Password added for ${entry.service}`));
  }

  private async getPassword(service: string): Promise<void> {
    const entries = await this.db.searchEntries(service);

    if (entries.length === 0) {
      console.log(chalk.yellow(`No passwords found for "${service}"`));
      return;
    }

    if (entries.length === 1) {
      this.displayEntry(entries[0]);
      return;
    }

    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'selected',
        message: 'Multiple entries found. Select one:',
        choices: entries.map((e, i) => ({
          name: `${e.service} - ${e.username}`,
          value: i,
        })),
      },
    ]);

    this.displayEntry(entries[answers.selected]);
  }

  private async listPasswords(): Promise<void> {
    const entries = await this.db.getAllEntries();

    if (entries.length === 0) {
      console.log(chalk.yellow('No password entries found'));
      return;
    }

    console.log(chalk.blue(`\n📋 All Passwords (${entries.length} total)\n`));
    entries.forEach((entry) => {
      console.log(`${chalk.cyan(entry.service)} - ${chalk.gray(entry.username)}`);
    });
    console.log();
  }

  private async searchPasswords(query: string): Promise<void> {
    const entries = await this.db.searchEntries(query);

    if (entries.length === 0) {
      console.log(chalk.yellow(`No results found for "${query}"`));
      return;
    }

    console.log(chalk.blue(`\n🔍 Search Results (${entries.length} found)\n`));
    entries.forEach((entry) => {
      console.log(`${chalk.cyan(entry.service)} - ${chalk.gray(entry.username)}`);
    });
    console.log();
  }

  private generatePassword(options: any): void {
    const password = PasswordGenerator.generate({
      length: parseInt(options.length),
      useUppercase: options.uppercase !== false,
      useLowercase: options.lowercase !== false,
      useNumbers: options.numbers !== false,
      useSymbols: options.symbols !== false,
    });

    console.log(`\n${chalk.green('Generated Password:')}`);
    console.log(chalk.bold(password));
    console.log();

    const strength = PasswordValidator.checkStrength(password);
    console.log(`Strength: ${this.getStrengthColor(strength.level)(strength.level)}`);
  }

  private checkStrength(password: string): void {
    const strength = PasswordValidator.checkStrength(password);

    console.log(`\n${chalk.blue('Password Strength Analysis')}\n`);
    console.log(`Level: ${this.getStrengthColor(strength.level)(strength.level)}`);
    console.log(`Score: ${strength.score}/5`);
    console.log(`\nFeedback:`);
    strength.feedback.forEach((f) => console.log(`  • ${f}`));
    console.log();
  }

  private async updatePassword(service: string): Promise<void> {
    const entries = await this.db.searchEntries(service);

    if (entries.length === 0) {
      console.log(chalk.yellow(`No passwords found for "${service}"`));
      return;
    }

    let selected = entries[0];
    if (entries.length > 1) {
      const answers = await inquirer.prompt([
        {
          type: 'list',
          name: 'selectedIndex',
          message: 'Select entry to update:',
          choices: entries.map((e, i) => ({
            name: `${e.service} - ${e.username}`,
            value: i,
          })),
        },
      ]);
      selected = entries[answers.selectedIndex];
    }

    const updates = await inquirer.prompt([
      {
        type: 'input',
        name: 'username',
        message: 'New username (leave empty to keep current):',
      },
      {
        type: 'password',
        name: 'password',
        message: 'New password (leave empty to keep current):',
        mask: '*',
      },
      {
        type: 'input',
        name: 'url',
        message: 'New URL (leave empty to keep current):',
      },
      {
        type: 'input',
        name: 'notes',
        message: 'New notes (leave empty to keep current):',
      },
    ]);

    const updateData: Partial<PasswordEntry> = {};
    if (updates.username) updateData.username = updates.username;
    if (updates.password) updateData.password = updates.password;
    if (updates.url) updateData.url = updates.url;
    if (updates.notes) updateData.notes = updates.notes;

    if (Object.keys(updateData).length === 0) {
      console.log(chalk.yellow('No updates provided'));
      return;
    }

    await this.db.updateEntry(selected.id, updateData);
    console.log(chalk.green(`✅ Updated password for ${selected.service}`));
  }

  private async deletePassword(service: string): Promise<void> {
    const entries = await this.db.searchEntries(service);

    if (entries.length === 0) {
      console.log(chalk.yellow(`No passwords found for "${service}"`));
      return;
    }

    let selected = entries[0];
    if (entries.length > 1) {
      const answers = await inquirer.prompt([
        {
          type: 'list',
          name: 'selectedIndex',
          message: 'Select entry to delete:',
          choices: entries.map((e, i) => ({
            name: `${e.service} - ${e.username}`,
            value: i,
          })),
        },
      ]);
      selected = entries[answers.selectedIndex];
    }

    const confirm = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmed',
        message: `Are you sure you want to delete "${selected.service}"?`,
        default: false,
      },
    ]);

    if (confirm.confirmed) {
      await this.db.deleteEntry(selected.id);
      console.log(chalk.green(`✅ Deleted password for ${selected.service}`));
    }
  }

  private async exportPasswords(filePath: string, options: any): Promise<void> {
    const entries = await this.db.getAllEntries();
    const format = options.format || 'json';

    if (format === 'json') {
      const masterPassword = (await inquirer.prompt([
        {
          type: 'password',
          name: 'password',
          message: 'Enter master password for export encryption:',
          mask: '*',
        },
      ])).password;

      await this.importExport.exportToJSON(entries, filePath, masterPassword);
    } else if (format === 'csv') {
      await this.importExport.exportToCSV(entries, filePath);
      console.log(chalk.yellow('⚠️  CSV export contains unencrypted passwords. Handle with care!'));
    }

    console.log(chalk.green(`✅ Exported ${entries.length} entries to ${filePath}`));
  }

  private async importPasswords(filePath: string, options: any): Promise<void> {
    const format = options.format || 'json';
    const entries: Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt'>[] = [];

    if (format === 'json') {
      const masterPassword = (await inquirer.prompt([
        {
          type: 'password',
          name: 'password',
          message: 'Enter master password for decryption:',
          mask: '*',
        },
      ])).password;

      const imported = await this.importExport.importFromJSON(filePath, masterPassword);
      entries.push(...imported);
    } else if (format === 'csv') {
      entries.push(...(await this.importExport.importFromCSV(filePath)));
    }

    for (const entry of entries) {
      try {
        await this.db.addEntry(entry);
      } catch (error) {
        console.log(chalk.yellow(`⚠️  Skipped duplicate: ${entry.service} - ${entry.username}`));
      }
    }

    console.log(chalk.green(`✅ Imported ${entries.length} entries`));
  }

  private async lock(): Promise<void> {
    console.log(chalk.blue('🔒 Locking password manager...'));
    process.exit(0);
  }

  private displayEntry(entry: PasswordEntry): void {
    console.log(chalk.blue(`\n🔐 ${entry.service}\n`));
    console.log(`Username: ${chalk.cyan(entry.username)}`);
    console.log(`Password: ${chalk.dim('*'.repeat(entry.password.length))}`);
    if (entry.url) console.log(`URL: ${chalk.gray(entry.url)}`);
    if (entry.notes) console.log(`Notes: ${entry.notes}`);
    console.log();
  }

  private getStrengthColor(level: string) {
    const colors: Record<string, (s: string) => string> = {
      'Very Weak': chalk.red,
      Weak: chalk.red,
      Fair: chalk.yellow,
      Good: chalk.blue,
      Strong: chalk.green,
      'Very Strong': chalk.green,
    };
    return colors[level] || chalk.gray;
  }
}

// Main execution
if (require.main === module) {
  const cli = new PasswordManagerCLI();
  cli.run(process.argv.slice(2));
}

export default PasswordManagerCLI;
