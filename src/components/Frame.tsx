
"use client";

import { sdk } from '@farcaster/frame-sdk';
import { farcasterFrame as frameConnector } from '@farcaster/frame-wagmi-connector';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect, useCallback } from 'react';
import { WagmiProvider, useAccount, useConnect, useSignMessage, useWriteContract } from 'wagmi';
import { config } from './wagmiConfig';
import styles from './page.module.css';
import './globals.css';
import { parseEther } from 'viem';

const queryClient = new QueryClient();

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <AppInner />
      </QueryClientProvider>
    </WagmiProvider>
  );
}

function AppInner() {
  useEffect(() => {
    sdk.actions.ready();
  }, []);

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Word Guess Game on Base</h1>
      <ConnectMenu />
    </div>
  );
}

function ConnectMenu() {
  const { isConnected, address } = useAccount();
  const { connect } = useConnect();

  if (isConnected && address) {
    return (
      <div className={styles.connected}>
        <p className={styles.text}>
          Connected: {address.slice(0, 6)}...{address.slice(-4)}
        </p>
        <WordGuessGame address={address} />
      </div>
    );
  }

  return (
    <div className={styles.connectContainer}>
      <p className={styles.text}>Connect your wallet to play!</p>
      <button
        type="button"
        onClick={() => connect({ connector: frameConnector() })}
        className={styles.button}
      >
        Connect Wallet
      </button>
    </div>
  );
}

function WordGuessGame({ address }: { address: `0x${string}` }) {
  const words = [
    { word: "SUPERHERO", hint: "A fictional character with extraordinary powers" },
    { word: "PASADENA", hint: "A city in California, USA" },
    { word: "COMPUTER", hint: "An electronic device for processing data" },
    { word: "GUITAR", hint: "A stringed musical instrument" },
  ];
  const [wordObj, setWordObj] = useState<{ word: string; hint: string } | null>(null);
  const [guessedLetters, setGuessedLetters] = useState<string[]>([]);
  const [wrongGuesses, setWrongGuesses] = useState(0);
  const [gameStatus, setGameStatus] = useState<"playing" | "won" | "lost">("playing");
  const [showHint, setShowHint] = useState(false);
  const maxWrongGuesses = 5;

  const resetGame = useCallback(() => {
    const randomWord = words[Math.floor(Math.random() * words.length)];
    setWordObj(randomWord);
    setGuessedLetters([]);
    setWrongGuesses(0);
    setGameStatus("playing");
    setShowHint(false);
  }, []);

  useEffect(() => {
    resetGame();
  }, [resetGame]);

  const handleGuess = (letter: string) => {
    if (gameStatus !== "playing" || guessedLetters.includes(letter)) return;

    const newGuessedLetters = [...guessedLetters, letter];
    setGuessedLetters(newGuessedLetters);

    if (!wordObj?.word.includes(letter)) {
      const newWrongGuesses = wrongGuesses + 1;
      setWrongGuesses(newWrongGuesses);
      if (newWrongGuesses >= maxWrongGuesses) {
        setGameStatus("lost");
      }
    }

    const displayWord = wordObj?.word
      .split("")
      .map((char) => (newGuessedLetters.includes(char) ? char : "_"))
      .join("");
    if (displayWord === wordObj?.word) {
      setGameStatus("won");
    }
  };

  const displayWord = wordObj?.word
    .split("")
    .map((char) => (guessedLetters.includes(char) ? char : "_"))
    .join(" ") || "";

  return (
    <div className={styles.gameContainer}>
      {wordObj ? (
        <>
          <p className={styles.word}>{displayWord}</p>
          <p className={styles.text}>Wrong Guesses: {wrongGuesses} / {maxWrongGuesses}</p>
          <p className={styles.text}>Guessed Letters: {guessedLetters.join(", ") || "None"}</p>
          {showHint && <p className={styles.hint}>Hint: {wordObj.hint}</p>}

          {gameStatus === "playing" && (
            <div className={styles.input}>
              <input
                type="text"
                maxLength={1}
                onChange={(e) => {
                  const letter = e.target.value.toUpperCase();
                  if (/^[A-Z]$/.test(letter)) {
                    handleGuess(letter);
                    e.target.value = "";
                  }
                }}
                placeholder="Guess a letter"
                className={styles.inputBox}
              />
              <button
                onClick={() => setShowHint(true)}
                className={styles.button}
                disabled={showHint}
              >
                Get Hint
              </button>
            </div>
          )}

          {gameStatus === "won" && (
            <>
              <p className={styles.message}>
                Congratulations! You won! The word was <strong>{wordObj.word}</strong>.
              </p>
              <SignButton />
              <MintNFTButton word={wordObj.word} address={address} />
            </>
          )}
          {gameStatus === "lost" && (
            <p className={styles.message}>
              Game Over! The word was <strong>{wordObj.word}</strong>.
            </p>
          )}

          {(gameStatus === "won" || gameStatus === "lost") && (
            <button onClick={resetGame} className={styles.button}>
              Play Again
            </button>
          )}
        </>
      ) : (
        <p className={styles.text}>Loading...</p>
      )}
    </div>
  );
}

function SignButton() {
  const { signMessage, isPending, data, error } = useSignMessage();

  return (
    <div className={styles.signContainer}>
      <button
        type="button"
        onClick={() => signMessage({ message: 'I won the Word Guess Game!' })}
        disabled={isPending}
        className={styles.button}
      >
        {isPending ? 'Signing...' : 'Sign Victory'}
      </button>
      {data && (
        <div className={styles.result}>
          <p className={styles.text}>Signature:</p>
          <p className={styles.signature}>{data.slice(0, 10)}...{data.slice(-10)}</p>
        </div>
      )}
      {error && (
        <div className={styles.result}>
          <p className={styles.text}>Error:</p>
          <p className={styles.error}>{error.message}</p>
        </div>
      )}
    </div>
  );
}

function MintNFTButton({ word, address }: { word: string; address: `0x${string}` }) {
  const { writeContract, isPending, error } = useWriteContract();

  const handleMint = () => {
    writeContract({
      address: '0xYourNFTContractAddress', // Ganti dengan alamat kontrak NFT di Base
      abi: [
        {
          name: 'mint',
          type: 'function',
          inputs: [
            { name: 'to', type: 'address' },
            { name: 'word', type: 'string' },
          ],
          outputs: [],
          stateMutability: 'payable',
        },
      ],
      functionName: 'mint',
      args: [address, word],
      value: parseEther('0.001'),
    });
  };

  return (
    <div className={styles.mintContainer}>
      <button
        type="button"
        onClick={handleMint}
        disabled={isPending}
        className={styles.button}
      >
        {isPending ? 'Minting...' : 'Mint Victory NFT'}
      </button>
      {error && (
        <div className={styles.result}>
          <p className={styles.text}>Minting Error:</p>
          <p className={styles.error}>{error.message}</p>
        </div>
      )}
    </div>
  );
}

export default App;
