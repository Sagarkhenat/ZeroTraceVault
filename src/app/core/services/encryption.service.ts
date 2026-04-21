import { Injectable } from '@angular/core';
import * as CryptoJS from 'crypto-js';

@Injectable({
  providedIn: 'root'
})
export class EncryptionService {

  // In a production app, this key should be generated dynamically per user
  // and stored inside the iOS Secure Enclave or Android Keystore.
  // For this implementation step, we will use a static environment key to wire the logic.
  private readonly MASTER_KEY = 'Secure_Vault_Key_2026';

  /**
   * Applies AES-256 encryption to a raw byte array.
   * @param pdfBytes The unencrypted Uint8Array from pdf-lib
   * @returns A base64 string of the encrypted ciphertext
   */
  async encryptPdfBytes(pdfBytes: Uint8Array): Promise<string> {
    try {
      // 1. Convert the standard Uint8Array into a CryptoJS WordArray
      const wordBuffer = CryptoJS.lib.WordArray.create(pdfBytes as any);

      // 2. Apply AES-256 Encryption
      // CryptoJS handles the IV (Initialization Vector) automatically under the hood
      // when using a string-based passphrase.
      const encrypted = CryptoJS.AES.encrypt(wordBuffer, this.MASTER_KEY).toString();

      return encrypted;
    } catch (error) {
      console.error('Cryptographic failure during encryption:', error);
      throw new Error('ENCRYPTION_FAILED: Unable to secure the document.');
    }
  }

  /**
   * Reverses the AES-256 encryption back into a raw byte array.
   * @param cipherText The encrypted base64 string read from the disk
   * @returns The decrypted Uint8Array ready to be rendered
   */
  async decryptToPdfBytes(cipherText: string): Promise<Uint8Array> {
    try {
      // 1. Decrypt the ciphertext back to a WordArray
      const decrypted = CryptoJS.AES.decrypt(cipherText, this.MASTER_KEY);

      // 2. Convert the WordArray back to a standard Uint8Array
      const words = decrypted.words;
      const sigBytes = decrypted.sigBytes;
      const u8 = new Uint8Array(sigBytes);

      for (let i = 0; i < sigBytes; i++) {
        const byte = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
        u8[i] = byte;
      }

      return u8;
    } catch (error) {
      console.error('Cryptographic failure during decryption:', error);
      throw new Error('DECRYPTION_FAILED: Invalid key or corrupted file.');
    }
  }
}
