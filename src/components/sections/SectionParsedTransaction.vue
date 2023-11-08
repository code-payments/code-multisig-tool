<script lang="ts">
import * as web3 from "@solana/web3.js";
import * as token from "@solana/spl-token";
import * as ed from '@noble/ed25519';
const { verify } = ed.sync;

(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

function tokenInstructionToString(type: token.TokenInstruction) {
  switch(type) {
    case token.TokenInstruction.InitializeMint: return 'InitializeMint';
    case token.TokenInstruction.InitializeAccount: return 'InitializeAccount';
    case token.TokenInstruction.InitializeMultisig: return 'InitializeMultisig';
    case token.TokenInstruction.Transfer: return 'Transfer';
    case token.TokenInstruction.Approve: return 'Approve';
    case token.TokenInstruction.Revoke: return 'Revoke';
    case token.TokenInstruction.SetAuthority: return 'SetAuthority';
    case token.TokenInstruction.MintTo: return 'MintTo';
    case token.TokenInstruction.Burn: return 'Burn';
    case token.TokenInstruction.CloseAccount: return 'CloseAccount';
    case token.TokenInstruction.FreezeAccount: return 'FreezeAccount';
    case token.TokenInstruction.ThawAccount: return 'ThawAccount';
    case token.TokenInstruction.TransferChecked: return 'TransferChecked';
    case token.TokenInstruction.ApproveChecked: return 'ApproveChecked';
    case token.TokenInstruction.MintToChecked: return 'MintToChecked';
    case token.TokenInstruction.BurnChecked: return 'BurnChecked';
    case token.TokenInstruction.InitializeAccount2: return 'InitializeAccount2';
    case token.TokenInstruction.SyncNative: return 'SyncNative';
    case token.TokenInstruction.InitializeAccount3: return 'InitializeAccount3';
    case token.TokenInstruction.InitializeMultisig2: return 'InitializeMultisig2';
    case token.TokenInstruction.InitializeMint2: return 'InitializeMint2';
    case token.TokenInstruction.GetAccountDataSize: return 'GetAccountDataSize';
    case token.TokenInstruction.InitializeImmutableOwner: return 'InitializeImmutableOwner';
    case token.TokenInstruction.AmountToUiAmount: return 'AmountToUiAmount';
    case token.TokenInstruction.UiAmountToAmount: return 'UiAmountToAmount';
    case token.TokenInstruction.InitializeMintCloseAuthority: return 'InitializeMintCloseAuthority';
    case token.TokenInstruction.TransferFeeExtension: return 'TransferFeeExtension';
    case token.TokenInstruction.ConfidentialTransferExtension: return 'ConfidentialTransferExtension';
    case token.TokenInstruction.DefaultAccountStateExtension: return 'DefaultAccountStateExtension';
    case token.TokenInstruction.Reallocate: return 'Reallocate';
    case token.TokenInstruction.MemoTransferExtension: return 'MemoTransferExtension';
    case token.TokenInstruction.CreateNativeMint: return 'CreateNativeMint';
    case token.TokenInstruction.InitializeNonTransferableMint: return 'InitializeNonTransferableMint';
    case token.TokenInstruction.InterestBearingMintExtension: return 'InterestBearingMintExtension';
    case token.TokenInstruction.CpiGuardExtension: return 'CpiGuardExtension';
    case token.TokenInstruction.InitializePermanentDelegate: return 'InitializePermanentDelegate';
    default: return 'Unknown';
  }
}

interface ParsedTransaction {
  feePayer: string;
  blockhash: string;
  signatures: {
    publicKey: string;
    signed: boolean;
    valid: boolean;
  }[];
  instructions: any[];
}

function getParsedTransaction(val: string): ParsedTransaction {
  const tx = web3.Transaction.from(Buffer.from(val, 'base64'));

  const feePayer = tx.feePayer?.toBase58() || '';
  const blockhash = tx.recentBlockhash || '';
  const instructions = [];
  const signatures: {
    publicKey: string;
    signed: boolean;
    valid: boolean;
  }[] = [];

  const signData = tx.serializeMessage();
  for (const sig of tx.signatures) {
    const signed = !!sig.signature;
    let valid = false;
    if (signed) {
      valid = verify(sig.signature!, signData, sig.publicKey.toBytes())
    }

    signatures.push({
      publicKey: sig.publicKey.toBase58(),
      signed,
      valid,
    });
  }

  for (const ix of tx.instructions) {
    instructions.push(decodeInstruction(ix));
  }

  return {
    feePayer,
    blockhash,
    signatures,
    instructions,
  };
}

function decodeInstruction(ix: web3.TransactionInstruction): any {
  if (ix.programId.equals(web3.SystemProgram.programId)) {
    const type = web3.SystemInstruction.decodeInstructionType(ix);

    let actions;
    switch (type) {
      case 'AdvanceNonceAccount':
        actions = web3.SystemInstruction.decodeNonceAdvance(ix);
        break;
      case 'Allocate':
        actions = web3.SystemInstruction.decodeAllocate(ix);
        break;
      case 'AllocateWithSeed':
        actions = web3.SystemInstruction.decodeAllocateWithSeed(ix);
        break;
      case 'Assign':
        actions = web3.SystemInstruction.decodeAssign(ix);
        break;
      case 'AssignWithSeed':
        actions = web3.SystemInstruction.decodeAssignWithSeed(ix);
        break;
      case 'AuthorizeNonceAccount':
        actions = web3.SystemInstruction.decodeNonceAuthorize(ix);
        break;
      case 'Create':
        actions = web3.SystemInstruction.decodeCreateAccount(ix);
        break;
      case 'CreateWithSeed':
        actions = web3.SystemInstruction.decodeCreateWithSeed(ix);
        break;
      case 'InitializeNonceAccount':
        actions = web3.SystemInstruction.decodeNonceInitialize(ix);
        break;
      case 'Transfer':
        actions = web3.SystemInstruction.decodeTransfer(ix);
        break;
      case 'TransferWithSeed':
        actions = web3.SystemInstruction.decodeTransferWithSeed(ix);
        break;
      case 'WithdrawNonceAccount':
        actions = web3.SystemInstruction.decodeNonceWithdraw(ix);
        break;
      case 'UpgradeNonceAccount':
        actions = web3.SystemInstruction.decodeNonceAuthorize(ix);
        break;
      default:
        actions = "unknown system instruction";
    }
    return {
      programId: ix.programId.toBase58(),
      type,
      actions,
    };
  }

  if (ix.programId.equals(token.TOKEN_PROGRAM_ID)) {

    return {
      programId: ix.programId.toBase58(),
      type: tokenInstructionToString(ix.data[0]),
      actions: token.decodeInstruction(ix),
    };
  }

  return {
    programId: ix.programId.toBase58(),
    type: "unknown program",
    actions: "unknown instruction",
  };
}

export default {
  props: {
    transaction: {
      type: String,
      required: true,
    },
  },

  computed: {
    parsedTransaction(): ParsedTransaction {
      return getParsedTransaction(this.transaction);
    },
  },

}
</script>

<template>
  <h3 class="text-xl font-medium leading-6 text-white mt-5">Fee Payer</h3>
  <p class="mt-3 text-sm text-slate-400">{{ parsedTransaction.feePayer }}</p>

  <h3 class="text-xl font-medium leading-6 text-white mt-5">Blockhash</h3>
  <p class="mt-3 text-sm text-slate-400">{{ parsedTransaction.blockhash }}</p>

  <h3 class="text-xl font-medium leading-6 text-white mt-5">Signers</h3>
  <table class="mt-3 min-w-full divide-y divide-gray-200">
    <thead class="bg-gray-50">
      <tr>
        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Public Key
        </th>
        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Signed
        </th>
        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Valid
        </th>
      </tr>
    </thead>
    <tbody class="bg-white divide-y divide-gray-200">
      <tr v-for="sig in parsedTransaction.signatures" :key="sig.publicKey">
        <td class="px-6 py-4 whitespace-nowrap">
          <div class="text-sm text-gray-900">{{ sig.publicKey }}</div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
          <span v-if="sig.signed" class="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">Signed</span>
          <span v-else class="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">Unsigned</span>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
          <span v-if="sig.valid" class="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">Valid</span>
          <span v-else class="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">Invalid</span>
        </td>
      </tr>
    </tbody>
  </table>  

  <h3 class="text-xl font-medium leading-6 text-white mt-5">Instructions</h3>

  <template v-for="(ix, index) in parsedTransaction.instructions" :key="ix.programId">
  <table class="mt-3 min-w-full divide-y divide-gray-200">
    <thead class="bg-gray-50">
      <tr>
        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          instruction #{{ index }}
        </th>
        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Program
        </th>
      </tr>
    </thead>
    <tbody class="bg-white divide-y divide-gray-200">
        <tr>
        <td class="px-6 py-4 whitespace-nowrap">
          <div class="text-sm text-gray-900">
            <span class="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-800">{{ ix.type }}</span>
          </div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
          <div class="text-sm text-gray-900">{{ ix.programId }}</div>
        </td>
      </tr>
      
      <tr>
        <td class="px-6 py-4" colspan="2">
          <code class="text-gray-900 text-xs code block whitespace-pre overflow-x-scroll">{{ JSON.stringify(ix.actions, null, 2) }}</code>
        </td> 
      </tr>

    </tbody>
  </table>  
    </template>

</template>