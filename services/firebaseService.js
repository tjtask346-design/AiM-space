// services/firebaseService.js
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  onSnapshot,
  serverTimestamp 
} from 'firebase/firestore';
import { firebaseConfig } from '../lib/config';
import binanceService from './binanceService';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export class FirebaseService {
  
  // User Registration with Payment Verification
  async registerUser(userData, transactionHash) {
    try {
      // Step 1: Verify payment with Binance API
      const paymentVerification = await binanceService.verifyBEP20Transaction(transactionHash, 10);
      
      if (!paymentVerification.success) {
        throw new Error(`Payment verification failed: ${paymentVerification.error}`);
      }

      // Step 2: Create auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        userData.email, 
        userData.password
      );
      
      const user = userCredential.user;

      // Step 3: Generate unique codes
      const walletCode = this.generateWalletCode();
      const referralCode = this.generateReferralCode();

      // Step 4: Create user document
      const userDoc = {
        email: userData.email,
        phone: userData.phone,
        walletCode: walletCode,
        referralCode: referralCode,
        balance: 0,
        todaysEarning: 0,
        todaysReferral: 0,
        totalEarning: 0,
        totalReferral: 0,
        balanceVisible: true,
        approved: true, // Auto-approve since payment verified
        transactionPassword: null,
        registrationHash: transactionHash,
        paymentVerified: true,
        paymentAmount: paymentVerification.amount,
        paymentFrom: paymentVerification.from,
        createdAt: serverTimestamp()
      };

      await setDoc(doc(db, "users", user.uid), userDoc);

      // Step 5: Process referral if provided
      if (userData.referralCode) {
        await this.processReferralBonus(userData.referralCode, user.uid);
      }

      return { success: true, user: user, userData: userDoc };

    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  // Process referral bonus
  async processReferralBonus(referralCode, newUserId) {
    try {
      // Find user with this referral code
      const q = query(collection(db, "users"), where("referralCode", "==", referralCode));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const referrerDoc = querySnapshot.docs[0];
        const referrerData = referrerDoc.data();
        
        // Add $6 referral bonus to referrer
        await updateDoc(doc(db, "users", referrerDoc.id), {
          totalReferral: (referrerData.totalReferral || 0) + 1,
          todaysReferral: (referrerData.todaysReferral || 0) + 1,
          balance: (referrerData.balance || 0) + 6,
          totalEarning: (referrerData.totalEarning || 0) + 6
        });

        // Create referral relationship for lifetime commission
        await setDoc(doc(db, "referrals", `${referrerDoc.id}_${newUserId}`), {
          referrerId: referrerDoc.id,
          referredId: newUserId,
          createdAt: serverTimestamp(),
          lifetimeCommission: true
        });

        // Create referral transaction record
        await addDoc(collection(db, "transactions"), {
          userId: referrerDoc.id,
          type: 'referral',
          amount: 6,
          description: 'Referral bonus',
          timestamp: serverTimestamp(),
          status: 'completed'
        });
      }
    } catch (error) {
      console.error("Referral processing error:", error);
    }
  }

  // Generate 9-digit wallet code
  generateWalletCode() {
    return Math.floor(100000000 + Math.random() * 900000000).toString();
  }

  // Generate 8-character referral code
  generateReferralCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // Apply lifetime commission on transactions
  async applyLifetimeCommission(userId, transactionAmount) {
    try {
      // Find all referrers in the chain
      const q = query(
        collection(db, "referrals"), 
        where("referredId", "==", userId),
        where("lifetimeCommission", "==", true)
      );
      
      const querySnapshot = await getDocs(q);
      
      for (const doc of querySnapshot.docs) {
        const referralData = doc.data();
        const commission = transactionAmount * 0.025; // 2.5% commission
        
        // Add commission to referrer
        const referrerDoc = await getDoc(doc(db, "users", referralData.referrerId));
        if (referrerDoc.exists()) {
          const referrerData = referrerDoc.data();
          
          await updateDoc(doc(db, "users", referralData.referrerId), {
            balance: (referrerData.balance || 0) + commission,
            totalEarning: (referrerData.totalEarning || 0) + commission
          });

          // Create commission transaction
          await addDoc(collection(db, "transactions"), {
            userId: referralData.referrerId,
            type: 'commission',
            amount: commission,
            description: 'Lifetime referral commission',
            timestamp: serverTimestamp(),
            status: 'completed'
          });
        }
      }
    } catch (error) {
      console.error("Lifetime commission error:", error);
    }
  }
}

export default new FirebaseService();
