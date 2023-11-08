import { createApp } from 'vue'
import App from './App.vue'
import MultisigTool from '../src/index'
import WalletButton from "solana-wallets-vue";
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import {
  PhantomWalletAdapter,
  SlopeWalletAdapter,
  SolflareWalletAdapter,
  SolletExtensionWalletAdapter,
  SolletWalletAdapter,
  TorusWalletAdapter,
} from "@solana/wallet-adapter-wallets";

import "solana-wallets-vue/styles.css";
import './style.css'

const network = WalletAdapterNetwork.Mainnet;
const walletOptions = {
  wallets: [
    new PhantomWalletAdapter(),
    new SlopeWalletAdapter(),
    new SolflareWalletAdapter({ network }),
    new TorusWalletAdapter(),
    new SolletWalletAdapter({ network }),
    new SolletExtensionWalletAdapter({ network }),
  ],
  autoConnect: false,
};

const opt = {
  rpcUrl: "https://explorer-rpc.getcode.com",
}

const app = createApp(App);
app.use(WalletButton, walletOptions);
app.use(MultisigTool, opt);
app.mount("#app");

