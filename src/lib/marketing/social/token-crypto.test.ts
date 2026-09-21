import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { randomBytes } from "node:crypto";
import {
  encryptSocialToken,
  decryptSocialToken,
  reencryptSocialToken,
  currentSocialTokenKeyVersion,
  isSocialTokenEncryptionConfigured,
} from "./token-crypto";

const ORIGINAL_ENV = { ...process.env };

function setKey(version: number, keyBase64?: string) {
  process.env[`SOCIAL_TOKEN_ENC_KEY_V${version}`] = keyBase64 ?? randomBytes(32).toString("base64");
}

describe("token-crypto", () => {
  beforeEach(() => {
    delete process.env.SOCIAL_TOKEN_ENC_KEY_CURRENT_VERSION;
    delete process.env.SOCIAL_TOKEN_ENC_KEY_V1;
    delete process.env.SOCIAL_TOKEN_ENC_KEY_V2;
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it("round-trips a fresh token under the current key version", () => {
    setKey(1);
    const plaintext = "EAABsomeReallyLongMetaAccessTokenValue1234567890";
    const { encoded, keyVersion } = encryptSocialToken(plaintext);
    expect(keyVersion).toBe(1);
    expect(encoded.startsWith("v1:")).toBe(true);
    expect(decryptSocialToken(encoded, keyVersion)).toBe(plaintext);
  });

  it("produces different ciphertext for the same plaintext (random IV)", () => {
    setKey(1);
    const plaintext = "same-plaintext-token";
    const first = encryptSocialToken(plaintext);
    const second = encryptSocialToken(plaintext);
    expect(first.encoded).not.toBe(second.encoded);
    expect(decryptSocialToken(first.encoded)).toBe(plaintext);
    expect(decryptSocialToken(second.encoded)).toBe(plaintext);
  });

  it("supports a rotated key: old rows keep decrypting under their original version while new encryptions use the new current version", () => {
    setKey(1);
    process.env.SOCIAL_TOKEN_ENC_KEY_CURRENT_VERSION = "1";
    const oldToken = encryptSocialToken("token-encrypted-under-v1");

    setKey(2);
    process.env.SOCIAL_TOKEN_ENC_KEY_CURRENT_VERSION = "2";
    expect(currentSocialTokenKeyVersion()).toBe(2);

    // Old row, still stored under v1, must still decrypt correctly.
    expect(decryptSocialToken(oldToken.encoded, 1)).toBe("token-encrypted-under-v1");

    // A fresh encryption now uses the new current version.
    const newToken = encryptSocialToken("token-encrypted-under-v2");
    expect(newToken.keyVersion).toBe(2);

    // reencryptSocialToken migrates an old row forward.
    const migrated = reencryptSocialToken(oldToken.encoded, 1);
    expect(migrated.keyVersion).toBe(2);
    expect(decryptSocialToken(migrated.encoded, 2)).toBe("token-encrypted-under-v1");
  });

  it("throws instead of decrypting when the expected key version does not match the encoded value", () => {
    setKey(1);
    setKey(2);
    const token = encryptSocialToken("some-token");
    expect(() => decryptSocialToken(token.encoded, 2)).toThrow();
  });

  it("throws on tampered ciphertext (GCM auth tag failure), never returning corrupted plaintext", () => {
    setKey(1);
    const { encoded } = encryptSocialToken("do-not-tamper-with-me");
    const [version, iv, ciphertext, authTag] = encoded.split(":");
    const tamperedCiphertextByte = Buffer.from(ciphertext, "base64");
    tamperedCiphertextByte[0] = tamperedCiphertextByte[0] ^ 0xff;
    const tampered = [version, iv, tamperedCiphertextByte.toString("base64"), authTag].join(":");
    expect(() => decryptSocialToken(tampered)).toThrow();
  });

  it("throws on a tampered auth tag", () => {
    setKey(1);
    const { encoded } = encryptSocialToken("another-token");
    const [version, iv, ciphertext, authTag] = encoded.split(":");
    const tamperedTagByte = Buffer.from(authTag, "base64");
    tamperedTagByte[0] = tamperedTagByte[0] ^ 0xff;
    const tampered = [version, iv, ciphertext, tamperedTagByte.toString("base64")].join(":");
    expect(() => decryptSocialToken(tampered)).toThrow();
  });

  it("throws on malformed encoded input", () => {
    setKey(1);
    expect(() => decryptSocialToken("not-a-valid-encoded-token")).toThrow();
    expect(() => decryptSocialToken("v1:onlytwoparts")).toThrow();
  });

  it("rejects a key that is not exactly 32 bytes decoded", () => {
    setKey(1, Buffer.from("too-short").toString("base64"));
    expect(() => encryptSocialToken("x")).toThrow();
  });

  it("isSocialTokenEncryptionConfigured reflects whether the current key is present and valid", () => {
    expect(isSocialTokenEncryptionConfigured()).toBe(false);
    setKey(1);
    expect(isSocialTokenEncryptionConfigured()).toBe(true);
  });
});
