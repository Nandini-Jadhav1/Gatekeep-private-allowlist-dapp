import { useState, useEffect, useCallback } from 'react';

export interface MidnightWalletProvider {
  name?: string;
  icon?: string;
  apiVersion?: string;
  enable?: () => Promise<any>;
  connect?: () => Promise<any>;
  isEnabled?: () => Promise<boolean>;
  requestAccounts?: () => Promise<string[]>;
  getAccount?: () => Promise<{ address: string }>;
  state?: () => Promise<any>;
}

declare global {
  interface Window {
    midnight?: {
      lace?: MidnightWalletProvider;
      '1am'?: MidnightWalletProvider;
      oneAm?: MidnightWalletProvider;
      '1amWallet'?: MidnightWalletProvider;
      '1AM'?: MidnightWalletProvider;
      [key: string]: MidnightWalletProvider | undefined;
    };
    cardano?: {
      lace?: MidnightWalletProvider;
      '1am'?: MidnightWalletProvider;
      [key: string]: MidnightWalletProvider | undefined;
    };
    '1am'?: MidnightWalletProvider;
  }
}

export type WalletType = 'lace' | '1am' | 'cli';

export interface WalletDetectionState {
  lace: boolean;
  '1am': boolean;
  cli: boolean;
}

export interface WalletAlertError {
  title: string;
  message: string;
  walletId: WalletType;
  actionHint?: string;
}

export function getLaceProvider(): MidnightWalletProvider | null {
  if (typeof window === 'undefined') return null;
  return (
    window.midnight?.lace ||
    window.midnight?.['lace'] ||
    window.cardano?.lace ||
    null
  );
}

export function get1amProvider(): MidnightWalletProvider | null {
  if (typeof window === 'undefined') return null;
  return (
    window.midnight?.['1am'] ||
    window.midnight?.oneAm ||
    window.midnight?.['1amWallet'] ||
    window.midnight?.['1AM'] ||
    window.cardano?.['1am'] ||
    window['1am'] ||
    null
  );
}

export function useMidnightWallet() {
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletName, setWalletName] = useState<string>('Lace Wallet');
  const [activeWalletId, setActiveWalletId] = useState<WalletType | null>('lace');
  const [walletAddress, setWalletAddress] = useState<string>('midnight1q9x2a4v8h9k0l3m5n7p2r4t6v8x0z2y4w6');
  
  const [connecting, setConnecting] = useState(false);
  const [alertError, setAlertError] = useState<WalletAlertError | null>(null);

  const [detectionState, setDetectionState] = useState<WalletDetectionState>({
    lace: false,
    '1am': false,
    cli: true, // CLI prover simulation available locally
  });

  const scanProviders = useCallback(() => {
    const laceDetected = Boolean(getLaceProvider());
    const oneAmDetected = Boolean(get1amProvider());

    setDetectionState({
      lace: laceDetected,
      '1am': oneAmDetected,
      cli: true,
    });

    return { laceDetected, oneAmDetected };
  }, []);

  useEffect(() => {
    scanProviders();
    // Periodically re-check in case extensions load asynchronously after document mount
    const interval = setInterval(scanProviders, 1500);
    return () => clearInterval(interval);
  }, [scanProviders]);

  const connectWallet = async (walletId: WalletType): Promise<boolean> => {
    setConnecting(true);
    setAlertError(null);

    // Refresh dynamic window provider detection
    const { laceDetected, oneAmDetected } = scanProviders();

    try {
      if (walletId === '1am') {
        const midnightObj = typeof window !== 'undefined' ? (window as any).midnight : null;
        const provider =
          midnightObj?.['1am'] ||
          midnightObj?.oneAm ||
          midnightObj?.['1amWallet'] ||
          midnightObj?.['1AM'] ||
          (window as any)?.cardano?.['1am'] ||
          (window as any)?.['1am'];

        if (provider && typeof provider.enable === 'function') {
          console.log("Found 1AM provider. Invoking window.midnight['1am'].enable()...");
          try {
            const walletApi = await provider.enable();
            console.log("1AM Wallet connected successfully:", walletApi);
            const derivedAddress =
              walletApi?.serviceUri ||
              walletApi?.address ||
              (Array.isArray(walletApi) && walletApi[0]) ||
              walletApi?.accounts?.[0] ||
              'midnight1q8y3b5w9j1k2m4n6p8r0t2v4x6z8y1w3';

            setWalletName('1AM Wallet');
            setActiveWalletId('1am');
            setWalletAddress(derivedAddress);
            setWalletConnected(true);
            setConnecting(false);
            return true;
          } catch (err: any) {
            console.warn("1AM Wallet enable() popup dismissed or rejected:", err);
            alert("1AM Wallet connection request rejected or popup closed. Please unlock 1AM in your browser toolbar and try again.");
            setConnecting(false);
            return false;
          }
        } else {
          console.warn("1AM Wallet object not detected in window.midnight['1am']");
          // Alert user that extension is not installed/unlocked in window.midnight
          alert("1AM Wallet extension not detected in window.midnight['1am']. Please ensure the 1AM Chrome Extension is installed and unlocked, then refresh the page.");
          setAlertError({
            walletId: '1am',
            title: '1AM Wallet Extension Missing',
            message: "1AM Wallet extension object (window.midnight['1am']) was not found on your browser window.",
            actionHint: 'Please install and unlock the 1AM Chrome extension, then click "Refresh Detection".',
          });
          setConnecting(false);
          return false;
        }
      }

      if (walletId === 'lace') {
        const midnightObj = typeof window !== 'undefined' ? (window as any).midnight : null;
        const cardanoObj = typeof window !== 'undefined' ? (window as any).cardano : null;
        const provider =
          midnightObj?.lace ||
          midnightObj?.['lace'] ||
          cardanoObj?.lace ||
          cardanoObj?.['lace'];

        if (provider && typeof provider.enable === 'function') {
          console.log("Found Lace provider. Invoking provider.enable()...");
          try {
            const walletApi = await provider.enable();
            console.log("Lace Wallet connected successfully:", walletApi);
            const derivedAddress =
              walletApi?.address ||
              walletApi?.serviceUri ||
              (Array.isArray(walletApi) && walletApi[0]) ||
              walletApi?.accounts?.[0] ||
              'midnight1q9x2a4v8h9k0l3m5n7p2r4t6v8x0z2y4w6';

            setWalletName('Lace Wallet');
            setActiveWalletId('lace');
            setWalletAddress(derivedAddress);
            setWalletConnected(true);
            setConnecting(false);
            return true;
          } catch (err: any) {
            console.warn("Lace Wallet enable() popup dismissed or rejected:", err);
            alert("Lace Wallet connection request rejected or popup closed. Please unlock Lace in your browser toolbar and try again.");
            setConnecting(false);
            return false;
          }
        } else {
          console.warn("Lace Wallet object not detected in window.midnight or window.cardano");
          alert("Lace Wallet extension not detected at window.midnight.lace or window.cardano.lace. Please ensure Lace extension is installed and unlocked in your browser, then refresh the page.");
          setAlertError({
            walletId: 'lace',
            title: 'Lace Wallet Extension Missing',
            message: "Lace Wallet extension object (window.midnight.lace / window.cardano.lace) was not found on your browser window.",
            actionHint: 'Please install and unlock the Lace Wallet browser extension, then click "Refresh Detection".',
          });
          setConnecting(false);
          return false;
        }
      }

      if (walletId === 'cli') {
        // Midnight CLI Prover connection
        await new Promise((res) => setTimeout(res, 500));
        setWalletName('Midnight CLI Prover');
        setActiveWalletId('cli');
        setWalletAddress('midnight1q7z4c6x0k2m4n6p8r0t2v4x6z8y1w5');
        setWalletConnected(true);
        setConnecting(false);
        return true;
      }

      return false;
    } catch (err: any) {
      console.error(`Failed connecting to ${walletId}:`, err);
      setAlertError({
        walletId,
        title: `${walletId === '1am' ? '1AM Wallet' : walletId === 'lace' ? 'Lace Wallet' : 'Midnight CLI'} Connection Error`,
        message: err?.message || 'Connection popup was closed or authorization was rejected by the wallet extension.',
        actionHint: 'Please open your extension popup, unlock your wallet account, and retry.',
      });
      setConnecting(false);
      return false;
    }
  };

  const disconnectWallet = () => {
    setWalletConnected(false);
    setAlertError(null);
  };

  const clearAlert = () => {
    setAlertError(null);
  };

  return {
    walletConnected,
    walletName,
    activeWalletId,
    walletAddress,
    connecting,
    alertError,
    detectionState,
    scanProviders,
    connectWallet,
    disconnectWallet,
    clearAlert,
    setWalletAddress,
    setWalletConnected,
  };
}
