<img width="1280" alt="Code Multisig Tool" src="https://github.com/code-payments/code-multisig-tool/assets/623790/59536c69-7af3-4f92-955d-85ca2ceb485e">

# Code Multisig Tool
![license][license-image]
![version][version-image]

[version-image]: https://img.shields.io/badge/version-0.2.1-blue.svg?style=flat
[license-image]: https://img.shields.io/badge/license-MIT-blue.svg?style=flat

This project started as an in-house resource designed to simplify the management of raw multisig accounts. Although other more sophisticated tools are available, they often incorporate complex on-chain programs. Our team required a more straightforward solution. The lack of custom on-chain programs makes this tool trivial to reason about.

Before using the tool, we'd encourage you to review multisig concepts on the [official Solana docs](https://spl.solana.com/token#multisig-usage).

https://code-payments.github.io/code-multisig-tool/

![image](https://github.com/code-wallet/multisig-tool/assets/623790/093512c1-822a-4da8-8d9f-5e18e3f9ca94)

*Warning: This is not a consumer facing product, so while it is easier to use than the Solana CLI (Command-Line-Interface), it more or less replicates the features provided by the CLI.*

## Features

The tool supports the following core features:

- Standard wallet adaptor (https://github.com/solana-labs/wallet-adapter)
- No custom on-chain programs (vanilla token multisigs)
- Automatic `"associated"` durable nonce accounts

## Use-cases

- Create multisig wallets
- Create a mint
- Mint tokens
- Change authority
- Sign transactions
- Verify signatures
- Submit transactions


## Signing & Submitting

The web app will attempt to parse transactions for you so that you have confidence in what you're signing. Additionally, a list of signers is shown with their current status.

![image](https://github.com/code-wallet/multisig-tool/assets/623790/b1f45009-1c39-48f8-995a-94a7b158a94e)


## Quick Start

The project is built using [Vue 3](https://v3.vuejs.org/) and [Vite](https://vitejs.dev/). To get started, clone the repository and install the dependencies.

### Install Dependencies

```bash
npm install
```

### Run the App

```bash
npm run dev
```

### Build the App

```bash
npm run build
```
