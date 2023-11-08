import { sha512_256 } from "@noble/hashes/sha512";
import { Keypair, PublicKey, Transaction } from "@solana/web3.js";
import bs58 from "bs58";

export function chunk<T>(list: T[], size: number): T[][] {
  return list.reduce((acc, cur, i) => {
    const idx = Math.floor(i / size);
    acc[idx] = acc[idx] || [];
    acc[idx].push(cur);
    return acc;
  }, [] as T[][]);
}

export function shortenSignature(sig: string, len: number = 16): string {
  return `${sig.substring(0, len)}...${sig.substring(sig.length - len)}`;
}

export function shortenPubkey(pubkey: PublicKey, len: number = 6): string {
  const address = pubkey.toBase58();
  return `${address.substring(0, len)}...${address.substring(address.length - len)}`;
}

export function getInspectorLinkWithoutSigs(tx: Transaction) {
    const message = tx.serializeMessage().toString('base64');
    return `https://explorer.solana.com/tx/inspector?message=${encodeURIComponent(encodeURIComponent(message))}\n`;
}
export function getInspectorLink(tx: Transaction) {
    const signatures = tx.signatures.map(sig => bs58.encode(sig.signature!));
    const message = tx.serializeMessage().toString('base64');
    return `https://explorer.solana.com/tx/inspector?signatures=${encodeURIComponent(encodeURIComponent(JSON.stringify(signatures)))}&message=${encodeURIComponent(encodeURIComponent(message))}\n`;
}

export function getAssociatedNonceKeypair(pubkey: PublicKey, password: string) : Keypair {
  const seeds = Buffer.from([
    Buffer.from("associated-nonce-account"),
    pubkey.toBuffer(),
    Buffer.from(password)
  ].join());
  const hash = sha512_256(seeds);
  return Keypair.fromSeed(hash);
}
