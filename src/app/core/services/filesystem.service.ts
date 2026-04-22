import { Injectable } from '@angular/core';
import { Filesystem, Directory } from '@capacitor/filesystem';

@Injectable({
  providedIn: 'root'
})
export class FilesystemService {

  // A dedicated subfolder inside the app's private data directory
  private readonly VAULT_DIR = 'zerotrace_vault';

  constructor() {
    this.initVault();
  }

  /**
   * Ensures the secure directory exists on app startup.
   */
  private async initVault() {
    try {
      await Filesystem.mkdir({
        path: this.VAULT_DIR,
        directory: Directory.Data,
        recursive: false
      });
    } catch (e) {
      // If it throws, the directory likely already exists, which is fine.
      console.log('Secure Vault directory ready.');
    }
  }

  /**
   * Writes the encrypted base64 string to the native disk.
   */
  async saveEncryptedDocument(fileName: string, encryptedBase64Data: string): Promise<string> {
    const filePath = `${this.VAULT_DIR}/${fileName}`;

    await Filesystem.writeFile({
      path: filePath,
      data: encryptedBase64Data,
      directory: Directory.Data,
    });

    return filePath;
  }

  /**
   * Reads the encrypted file back into volatile memory.
   */
  async readEncryptedDocument(filePath: string): Promise<string> {
    const contents = await Filesystem.readFile({
      path: filePath,
      directory: Directory.Data,
    });

    return contents.data as string;
  }

  /**
   * Retrieves a list of all encrypted files in the vault.
   */
  async listVaultFiles() {
    try {
      const contents = await Filesystem.readdir({
        path: this.VAULT_DIR,
        directory: Directory.Data
      });
      return contents.files;
    } catch (e) {
      console.error('Failed to read vault directory', e);
      return [];
    }
  }
}
