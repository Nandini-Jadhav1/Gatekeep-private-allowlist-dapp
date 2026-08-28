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
        const oneAmProvider = midnightObj ? midnightObj['1am'] || midnightObj.oneAm || (window as any)['1am'] : null;

        if (midnightObj && oneAmProvider) {
          try {
            const api = await oneAmProvider.enable();
            console.log("1AM Connected successfully", api);
            const derivedAddress =
              api?.address ||
              (Array.isArray(api) && api[0]) ||
              api?.accounts?.[0] ||
              'midnight1q8y3b5w9j1k2m4n6p8r0t2v4x6z8y1w3';

            setWalletName('1AM Wallet');
            setActiveWalletId('1am');
            setWalletAddress(derivedAddress);
            setWalletConnected(true);
            setConnecting(false);
            return true;
          } catch (err) {
            console.error("1AM connection error:", err);
            alert("Please unlock your 1AM Wallet extension from the browser toolbar first!");
            setConnecting(false);
            return false;
          }
        } else {
          alert("1AM Wallet extension not detected in window.midnight['1am']");
          setAlertError({
            walletId: '1am',
            title: '1AM Wallet Not Detected',
            message: "1AM Wallet extension not detected in window.midnight['1am']",
            actionHint: 'Please make sure the 1AM Chrome extension is installed, enabled, and unlocked in your browser extension menu, then click "Refresh Detection".',
          });
          setConnecting(false);
          return false;
        }
      }

      if (walletId === 'lace') {
        const provider = getLaceProvider();

        if (!provider && !laceDetected) {
          setAlertError({
            walletId: 'lace',
            title: 'Lace Wallet Not Detected',
            message: "Midnight Lace extension provider object (window.midnight.lace) was not found on your browser window.",
            actionHint: 'Please ensure Lace Wallet extension is installed and unlocked, or refresh your browser.',
          });
          setConnecting(false);
          return false;
        }

        // Explicitly invoke Lace Wallet provider method
        let connResult: any = null;
        if (provider) {
          if (typeof provider.enable === 'function') {
            connResult = await provider.enable();
          } else if (typeof provider.connect === 'function') {
            connResult = await provider.connect();
          }
        }

        const derivedAddress =
          connResult?.address ||
          (Array.isArray(connResult) && connResult[0]) ||
          'midnight1q9x2a4v8h9k0l3m5n7p2r4t6v8x0z2y4w6';

        setWalletName('Lace Wallet');
        setActiveWalletId('lace');
        setWalletAddress(derivedAddress);
        setWalletConnected(true);
        setConnecting(false);
        return true;
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
