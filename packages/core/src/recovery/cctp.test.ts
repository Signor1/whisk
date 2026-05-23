import { describe, expect, it } from "vitest";
import {
  EVM_MAINNET_MESSAGE_TRANSMITTER,
  EVM_TESTNET_MESSAGE_TRANSMITTER,
  RECEIVE_MESSAGE_ABI,
  SOLANA_MESSAGE_TRANSMITTER,
  buildReceiveMessageCall,
  messageTransmitterAddress,
} from "./cctp.js";

const validMessage = "0xdeadbeef";
const validAttestation = "0xfeedface";

describe("buildReceiveMessageCall", () => {
  it("returns the expected call descriptor for an EVM testnet destination", () => {
    const call = buildReceiveMessageCall(
      "Base_Sepolia",
      validMessage,
      validAttestation,
    );
    expect(call).not.toBeNull();
    expect(call?.destinationChain).toBe("Base_Sepolia");
    expect(call?.address).toBe(EVM_TESTNET_MESSAGE_TRANSMITTER);
    expect(call?.functionName).toBe("receiveMessage");
    expect(call?.args).toEqual([validMessage, validAttestation]);
    expect(call?.abi).toBe(RECEIVE_MESSAGE_ABI);
  });

  it("uses the mainnet MessageTransmitter for mainnet chains", () => {
    const call = buildReceiveMessageCall(
      "Base",
      validMessage,
      validAttestation,
    );
    expect(call?.address).toBe(EVM_MAINNET_MESSAGE_TRANSMITTER);
  });

  it("returns null for Solana destinations (different call surface)", () => {
    const call = buildReceiveMessageCall(
      "Solana_Devnet",
      validMessage,
      validAttestation,
    );
    expect(call).toBeNull();
  });

  it("throws TypeError when message is not 0x-prefixed", () => {
    expect(() =>
      buildReceiveMessageCall("Base_Sepolia", "deadbeef", validAttestation),
    ).toThrow(TypeError);
  });

  it("throws TypeError when attestation is not 0x-prefixed", () => {
    expect(() =>
      buildReceiveMessageCall("Base_Sepolia", validMessage, "feedface"),
    ).toThrow(TypeError);
  });

  it("throws TypeError when message is empty", () => {
    expect(() =>
      buildReceiveMessageCall("Base_Sepolia", "", validAttestation),
    ).toThrow(TypeError);
  });

  it("throws TypeError when attestation is empty", () => {
    expect(() =>
      buildReceiveMessageCall("Base_Sepolia", validMessage, ""),
    ).toThrow(TypeError);
  });
});

describe("messageTransmitterAddress", () => {
  it("returns the mainnet address for EVM mainnet chains", () => {
    expect(messageTransmitterAddress("Base")).toBe(
      EVM_MAINNET_MESSAGE_TRANSMITTER,
    );
  });

  it("returns the testnet address for EVM testnet chains", () => {
    expect(messageTransmitterAddress("Base_Sepolia")).toBe(
      EVM_TESTNET_MESSAGE_TRANSMITTER,
    );
  });

  it("returns the Solana program address for Solana chains regardless of cluster", () => {
    expect(messageTransmitterAddress("Solana")).toBe(
      SOLANA_MESSAGE_TRANSMITTER,
    );
    expect(messageTransmitterAddress("Solana_Devnet")).toBe(
      SOLANA_MESSAGE_TRANSMITTER,
    );
  });
});
