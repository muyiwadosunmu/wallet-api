export interface BlockchainProvider {
  createWallet(): Promise<{
    address: string;
    privateKey: string;
    mnemonic: string;
  }>;
  getBalance(address: string): Promise<string>;
  sendTransaction(
    fromPrivateKey: string,
    toAddress: string,
    amount: number,
  ): Promise<{ hash: string }>;
  getTransactionHistory(address: string): Promise<any[]>;
  getGasPrice(): Promise<string>; // Add this method
}
