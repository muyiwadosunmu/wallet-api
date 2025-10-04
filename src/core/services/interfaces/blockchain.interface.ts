export interface BlockchainProvider {
  createWallet(): Promise<{
    address: string;
    privateKey: string;
    mnemonic: string;
  }>;
  getBalance(address: string): Promise<string>;
  registerAddressForNotifications(address: string): Promise<boolean>;
  sendTransaction(
    fromPrivateKey: string,
    toAddress: string,
    amount: number,
  ): Promise<{ hash: string }>;
  getTransactionHistory(address: string): Promise<any[]>;
  getGasPrice(): Promise<string>; // Add this method
  getTransaction(txHash: string): Promise<any | null>; // Method to get a single transaction by hash
}
