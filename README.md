# Multisig Tool

This is a tool to help you manage your multisig wallets. It is a web app that runs in your browser, and it does not send any data to a server. It is open source, and you can verify that it does not send any data to a server by inspecting the source code.

https://code-wallet.github.io/multisig-tool/

![image](https://github.com/code-wallet/multisig-tool/assets/623790/651eda17-c76d-406a-89a8-c872a7dc9298)


## Features

The tool supports the following core features:

- Standard wallet adaptor (https://github.com/solana-labs/wallet-adapter)
- No custom on-chain programs (vanilla token multi-sigs)
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

![image](https://github.com/code-wallet/multisig-tool/assets/623790/d777b1c9-5337-4f26-a970-9b5f8b97a46e)


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
