import { useState, useEffect, useCallback } from 'react';

export interface MidnightWalletProvider {
  name?: string;
  icon?: string;
  apiVersion?: string;
  enable?: () => Promise<any>;
  // Per 1AM's official DApp Connector docs, connect() takes a network id, e.g. connect('preview').
  // This app specifically targets Preprod (see App.tsx networkName) — use that, not 'preview'.
  connect?: (networkId?: string) => Promise<any>;
  isEnabled?: () => Promise<boolean>;
  requestAccounts?: () => Promise<string[]>;
  getAccount?: () => Promise<{ address: string }>;
  state?: () => Promise<any>;
  request?: (args: { method: string; params?: any }) => Promise<any>;
}

// How long we're willing to poll for the extension to inject itself before
// telling the user it's genuinely not installed. Extensions inject
// asynchronously, so checking once on mount is not enough.
const DETECTION_TIMEOUT_MS = 6000;
const DETECTION_POLL_INTERVAL_MS = 300;

// Must match the network this dApp is actually deployed against (see
// App.tsx's networkName = 'Midnight Testnet (Preprod)'). If you ever move
// this app to preview/testnet, update this constant — a mismatch here is
// exactly what produces "Network mismatch" errors from the wallet.
const NETWORK_ID = 'preprod';

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
  const w = window as any;
  if (w.midnight?.lace || w.midnight?.['lace']) return w.midnight?.lace || w.midnight?.['lace'];
  if (w.cardano?.lace || w.cardano?.['lace']) return w.cardano?.lace || w.cardano?.['lace'];

  if (w.midnight) {
    for (const key of Object.keys(w.midnight)) {
      if (key.toLowerCase().includes('lace')) return w.midnight[key];
    }
  }
  if (w.cardano) {
    for (const key of Object.keys(w.cardano)) {
      if (key.toLowerCase().includes('lace')) return w.cardano[key];
    }
  }
  return null;
}

export function get1amProvider(): MidnightWalletProvider | null {
  if (typeof window === 'undefined') return null;
  const w = window as any;

  // Direct property lookups on window.midnight
  if (w.midnight) {
    if (w.midnight['1am']) return w.midnight['1am'];
    if (w.midnight.oneAm) return w.midnight.oneAm;
    if (w.midnight['1amWallet']) return w.midnight['1amWallet'];
    if (w.midnight['1AM']) return w.midnight['1AM'];
    if (w.midnight.one_am) return w.midnight.one_am;
    if (w.midnight.oneam) return w.midnight.oneam;
    if (w.midnight.wallet) return w.midnight.wallet;
    if (w.midnight.mn_wallet) return w.midnight.mn_wallet;

    if (typeof w.midnight.enable === 'function' || typeof w.midnight.connect === 'function') {
      return w.midnight;
    }

    for (const key of Object.keys(w.midnight)) {
      const lowerKey = key.toLowerCase();
      if (lowerKey.includes('1am') || lowerKey.includes('oneam') || lowerKey.includes('midnight')) {
        return w.midnight[key];
      }
    }
  }

  // Lookups on window.cardano
  if (w.cardano) {
    if (w.cardano['1am']) return w.cardano['1am'];
    if (w.cardano.oneAm) return w.cardano.oneAm;
    if (w.cardano['1AM']) return w.cardano['1AM'];
    for (const key of Object.keys(w.cardano)) {
      const lowerKey = key.toLowerCase();
      if (lowerKey.includes('1am') || lowerKey.includes('oneam')) {
        return w.cardano[key];
      }
    }
  }

  // Direct window global properties
  if (w['1am']) return w['1am'];
  if (w.oneAm) return w.oneAm;
  if (w['1AM']) return w['1AM'];

  return null;
}

export function useMidnightWallet() {
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletName, setWalletName] = useState<string>('1AM Wallet');
  const [activeWalletId, setActiveWalletId] = useState<WalletType | null>('1am');
  const [walletAddress, setWalletAddress] = useState<string>('midnight1q8y3b5w9j1k2m4n6p8r0t2v4x6z8y1w3');

  const [connecting, setConnecting] = useState(false);
  const [alertError, setAlertError] = useState<WalletAlertError | null>(null);

  // NOTE: detection now reflects reality. Do NOT force '1am' or 'lace' to
  // true here — a badge that says "Detected" when nothing is actually
  // injected is what caused the silent failure at connect-time before.
  const [detectionState, setDetectionState] = useState<WalletDetectionState>({
    lace: false,
    '1am': false,
    cli: true, // the local CLI prover is a localhost service, not a browser injection
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
    // Poll frequently for the first few seconds (extensions inject
    // asynchronously after page load), then settle into a slow background
    // poll so the badge stays accurate if the user unlocks/installs the
    // extension mid-session without reloading.
    scanProviders();
    const startedAt = Date.now();
    const fastInterval = setInterval(() => {
      scanProviders();
      if (Date.now() - startedAt >= DETECTION_TIMEOUT_MS) {
        clearInterval(fastInterval);
      }
    }, DETECTION_POLL_INTERVAL_MS);

    const slowInterval = setInterval(scanProviders, 3000);

    return () => {
      clearInterval(fastInterval);
      clearInterval(slowInterval);
    };
  }, [scanProviders]);

  const connectWallet = async (walletId: WalletType): Promise<boolean> => {
    setConnecting(true);
    setAlertError(null);

    scanProviders();

    try {
      if (walletId === '1am') {
        const provider = get1amProvider();

        console.log('=== 1AM WALLET CONNECTION ATTEMPT ===');
        console.log('window.midnight:', (window as any).midnight);
        console.log('window.cardano:', (window as any).cardano);
        console.log('Resolved 1AM Provider:', provider);

        if (provider) {
          try {
            let walletApi: any = null;
            // 1AM's own docs specify connect(networkId) as the primary
            // handshake. Try that first, then fall back to the more
            // generic enable()/requestAccounts() patterns other wallets
            // use. NETWORK_ID must match what this dApp is deployed
            // against (Preprod) and what the user's wallet is switched to.
            if (typeof provider.connect === 'function') {
              walletApi = await provider.connect(NETWORK_ID);
            } else if (typeof provider.enable === 'function') {
              walletApi = await provider.enable();
            } else if (typeof provider.requestAccounts === 'function') {
              walletApi = await provider.requestAccounts();
            } else if (typeof provider.request === 'function') {
              walletApi = await provider.request({ method: 'enable' });
            } else {
              throw new Error('Provider was found but exposes no known connect/enable method.');
            }

            console.log('1AM Wallet connect() returned:', walletApi);
            const derivedAddress =
              walletApi?.address ||
              walletApi?.state?.address ||
              (Array.isArray(walletApi) && walletApi[0]) ||
              walletApi?.accounts?.[0] ||
              null;

            if (!derivedAddress) {
              throw new Error('Wallet approved the connection but returned no address.');
            }

            setWalletName('1AM Wallet');
            setActiveWalletId('1am');
            setWalletAddress(derivedAddress);
            setWalletConnected(true);
            setConnecting(false);
            return true;
          } catch (err: any) {
            console.warn('1AM connect() popup rejected, closed, or failed:', err);
            // Surface the REAL error instead of silently faking a connected
            // session — that's what was hiding this bug in the first place.
            setAlertError({
              title: 'Could not connect to 1AM Wallet',
              message:
                err?.message ||
                'The 1AM extension was detected but did not complete the connection. It may be locked, or you may have closed/rejected its approval popup.',
              walletId: '1am',
              actionHint:
                'Open the 1AM extension icon in your toolbar, unlock it if prompted, then click "Refresh Extension Detection" and try again.',
            });
            setConnecting(false);
            return false;
          }
        } else {
          console.warn('No 1AM provider object on window.midnight[\'1am\'].');
          setAlertError({
            title: '1AM Wallet not found',
            message:
              "window.midnight['1am'] is not present on this page. Either the extension isn't installed/enabled, or another wallet extension overwrote window.midnight before 1AM could inject itself.",
            walletId: '1am',
            actionHint:
              'Confirm 1AM is installed and enabled in chrome://extensions, then click "Rescan Window". If you also have Lace installed, try disabling it temporarily to rule out a conflict.',
          });
          setConnecting(false);
          return false;
        }
      }

      if (walletId === 'lace') {
        const provider = getLaceProvider();

        if (provider) {
          try {
            let connResult: any = null;
            if (typeof provider.enable === 'function') {
              connResult = await provider.enable();
            } else if (typeof provider.connect === 'function') {
              connResult = await provider.connect();
            } else {
              throw new Error('Provider was found but exposes no known connect/enable method.');
            }

            const derivedAddress =
              connResult?.address ||
              (Array.isArray(connResult) && connResult[0]) ||
              null;

            if (!derivedAddress) {
              throw new Error('Wallet approved the connection but returned no address.');
            }

            setWalletName('Lace Wallet');
            setActiveWalletId('lace');
            setWalletAddress(derivedAddress);
            setWalletConnected(true);
            setConnecting(false);
            return true;
          } catch (err: any) {
            console.warn('Lace enable() popup rejected, closed, or failed:', err);
            setAlertError({
              title: 'Could not connect to Lace Wallet',
              message:
                err?.message ||
                'The Lace extension was detected but did not complete the connection.',
              walletId: 'lace',
              actionHint: 'Unlock Lace, switch it to the Midnight network tab, then try again.',
            });
            setConnecting(false);
            return false;
          }
        } else {
          setAlertError({
            title: 'Lace Wallet not found',
            message: "No Lace/Midnight provider was found on window.midnight or window.cardano.",
            walletId: 'lace',
            actionHint: 'Confirm Lace is installed and enabled, then click "Rescan Window".',
          });
          setConnecting(false);
          return false;
        }
      }

      if (walletId === 'cli') {
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
        title: 'Wallet connection failed',
        message: err?.message || 'An unexpected error occurred while connecting.',
        walletId,
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
