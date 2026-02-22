# Monkey OS Architecture

**Monkey OS** is a browser-based, localized operating system built entirely on modern web technologies. It provides a seamless, immersive desktop experience without requiring any local installation or risky software downloads.

## Client-Side Execution

Security is the foundational pillar of Monkey OS. To guarantee the safety of user funds, **Monkey OS operates strictly as a client-side application.**

- **No Backend Custody:** Monkey OS does not possess a traditional backend database that stores private keys, session tokens, or transaction histories. 
- **In-Memory State:** All state management is handled locally within the user's browser memory (React state and local storage). When the tab is closed, the session evaporates.
- **Direct RPC Communication:** When an assistant formulates a Solana transaction or queries the blockchain, the OS communicates directly with decentralized RPC nodes. It does not route through a centralized server.

## The Virtual File System (VFS)

Monkey OS utilizes a Virtual File System to simulate a robust desktop environment. The VFS manages window stacking, z-indexes, process states, and inter-process communication (IPC) between the various assistant apps.

For example, when the **Trend Puncher** app identifies a trading opportunity, it can utilize the VFS IPC bridge to send the contract address directly to the **Rug Buster** app for immediate security analysis, without the user needing to copy-paste.

## Progressive Web App (PWA) Capabilities

Designed for the modern trader, Monkey OS is fully responsive and supports PWA installation. Users can "install" the OS directly to their mobile home screens, providing a native app experience with full hardware acceleration, while maintaining the strict security sandbox of the mobile browser.