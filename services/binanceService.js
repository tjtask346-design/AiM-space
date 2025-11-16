// services/binanceService.js
import CryptoJS from 'crypto-js';
import axios from 'axios';
import { binanceConfig } from '../lib/config';

class BinanceService {
  constructor() {
    this.apiKey = binanceConfig.apiKey;
    this.secretKey = binanceConfig.secretKey;
    this.baseURL = binanceConfig.baseURL;
  }

  // Generate signature for Binance API
  generateSignature(queryString) {
    return CryptoJS.HmacSHA256(queryString, this.secretKey).toString(CryptoJS.enc.Hex);
  }

  // Verify BEP-20 transaction
  async verifyBEP20Transaction(txHash, expectedAmount = 10) {
    try {
      // First, try to get transaction details from BSCScan-like API
      const bscResponse = await axios.get(
        `https://api.bscscan.com/api?module=transaction&action=gettxreceiptstatus&txhash=${txHash}&apikey=YourBSCScanAPIKey`
      );

      if (bscResponse.data.status === '1') {
        // Transaction found and successful on BSC
        return await this.verifyTransactionDetails(txHash, expectedAmount);
      }
      
      return { success: false, error: 'Transaction not found or failed' };
    } catch (error) {
      console.error('Binance verification error:', error);
      return { success: false, error: 'Verification failed' };
    }
  }

  // Verify transaction details
  async verifyTransactionDetails(txHash, expectedAmount) {
    try {
      // Alternative method: Use blockchain explorer API
      const response = await axios.get(
        `https://api.bscscan.com/api?module=proxy&action=eth_getTransactionByHash&txhash=${txHash}&apikey=YourBSCScanAPIKey`
      );

      if (response.data.result) {
        const tx = response.data.result;
        
        // Check if transaction is to our wallet address
        const ourWallet = '0x742d35Cc6634C0532925a3b8D4B5e1a1C6B6a9c8'; // Your BEP-20 address
        if (tx.to.toLowerCase() === ourWallet.toLowerCase()) {
          
          // Convert wei to USDT (assuming USDT has 6 decimals)
          const amountInWei = parseInt(tx.value, 16);
          const amountInUSDT = amountInWei / 1000000000000000000; // Adjust for USDT decimals
          
          if (Math.abs(amountInUSDT - expectedAmount) <= 0.1) { // Allow small difference
            return { 
              success: true, 
              amount: amountInUSDT,
              from: tx.from,
              to: tx.to,
              confirmations: 1
            };
          }
        }
      }
      
      return { success: false, error: 'Transaction details do not match' };
    } catch (error) {
      console.error('Transaction details verification error:', error);
      return { success: false, error: 'Failed to verify transaction details' };
    }
  }

  // Check wallet balance (for admin purposes)
  async getWalletBalance() {
    try {
      const timestamp = Date.now();
      const queryString = `timestamp=${timestamp}`;
      const signature = this.generateSignature(queryString);

      const response = await axios.get(`${this.baseURL}/api/v3/account`, {
        headers: {
          'X-MBX-APIKEY': this.apiKey
        },
        params: {
          timestamp,
          signature
        }
      });

      return response.data.balances;
    } catch (error) {
      console.error('Balance check error:', error);
      throw error;
    }
  }
}

export default new BinanceService();
