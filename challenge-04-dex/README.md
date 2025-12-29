# Build a DEX (SpeedrunEthereum – Challenge 4)

Workspace này được tạo từ template `challenge-dex` và đã hoàn thành đầy đủ các phần chính của challenge “Build a DEX” theo hướng dẫn: https://speedrunethereum.com/challenge/dex

## 1) Tổng quan kiến trúc

- **Smart contracts (Hardhat)**: nằm trong [packages/hardhat](packages/hardhat)
  - Contract DEX: [`DEX.sol`](packages/hardhat/contracts/DEX.sol)
  - Token ERC20: [`Balloons.sol`](packages/hardhat/contracts/Balloons.sol)
  - Deploy scripts: [packages/hardhat/deploy](packages/hardhat/deploy)
    - [`00_deploy_dex.ts`](packages/hardhat/deploy/00_deploy_dex.ts)
- **Frontend (Next.js)**: nằm trong [packages/nextjs](packages/nextjs)
  - Cấu hình mạng frontend: [scaffold.config.ts](packages/nextjs/scaffold.config.ts)
  - Trang DEX UI: [packages/nextjs/app/dex/page.tsx](packages/nextjs/app/dex/page.tsx)
  - Debug/Blockexplorer: [packages/nextjs/app/debug/page.tsx](packages/nextjs/app/debug/page.tsx)
  - Contracts addresses/ABIs auto-generate: [deployedContracts.ts](packages/nextjs/contracts/deployedContracts.ts)
- **Cấu hình Hardhat/network**: [hardhat.config.ts](packages/hardhat/hardhat.config.ts)

## 2) Chạy project (3 terminal)

> Các lệnh dưới đây chạy từ **root** của repo (thư mục có `package.json`).

### Bước 1 — Terminal #1: chạy blockchain local (Hardhat)

```sh
yarn chain
```

### Bước 2 — Terminal #2: deploy contracts

```sh
yarn deploy
```

### Bước 3 — Terminal #3: chạy frontend

```sh
yarn start
```

## 3) Giải thích Challenge flow (theo hướng dẫn SpeedrunEthereum)

### Checkpoint 0 — Environment

Mục tiêu: Chạy được **chain + deploy + start** (3 terminal). Đảm bảo UI hoạt động, contracts được deploy, pool được init.

### Checkpoint 1 — The Structure

Mục tiêu: Đọc code [`DEX.sol`](packages/hardhat/contracts/DEX.sol), hiểu init pool, nạp ETH và Balloons vào DEX.

- Đảm bảo contract DEX và Balloons được deploy, gọi init() để nạp ETH và Balloons vào pool (có thể chỉnh số lượng trong script deploy).

### Checkpoint 2 — Reserves

Mục tiêu: Quản lý tổng thanh khoản và thanh khoản từng user.

- Sử dụng biến [`totalLiquidity`](packages/hardhat/contracts/DEX.sol) và mapping [`liquidity`](packages/hardhat/contracts/DEX.sol) để theo dõi.
- Viết hàm [`getLiquidity(address)`](packages/hardhat/contracts/DEX.sol) để trả về số LPT của user.

### Checkpoint 3 — Price

Mục tiêu: Triển khai công thức x\*y=k, swap có phí 0.3%.

- Viết hàm [`price(xInput, xReserves, yReserves)`](packages/hardhat/contracts/DEX.sol) để tính output khi swap.
- Swap càng lớn, slippage càng cao.

### Checkpoint 4 — Trading

Mục tiêu: Swap hai chiều ETH ↔ Balloons đúng công thức AMM.

- Viết hàm [`ethToToken()`](packages/hardhat/contracts/DEX.sol) và [`tokenToEth()`](packages/hardhat/contracts/DEX.sol), kiểm tra allowance, phát event.
- Swap đúng số lượng, cập nhật pool, kiểm tra lại trên UI.

### Checkpoint 5 — Liquidity

Mục tiêu: Cho phép bất kỳ ai nạp/rút thanh khoản vào pool.

- Viết hàm [`deposit()`](packages/hardhat/contracts/DEX.sol) và [`withdraw()`](packages/hardhat/contracts/DEX.sol), mint/burn LPT đúng tỷ lệ.
- Cập nhật đúng số dư, phát event, kiểm tra lại trên UI.

## 4) File quan trọng để đọc/chỉnh

- DEX contract: [`DEX.sol`](packages/hardhat/contracts/DEX.sol)
- Balloons contract: [`Balloons.sol`](packages/hardhat/contracts/Balloons.sol)
- Deploy scripts: [packages/hardhat/deploy](packages/hardhat/deploy)
- Hardhat config/networks: [hardhat.config.ts](packages/hardhat/hardhat.config.ts)
- Frontend network targeting: [scaffold.config.ts](packages/nextjs/scaffold.config.ts)
- DEX UI: [packages/nextjs/app/dex/page.tsx](packages/nextjs/app/dex/page.tsx)
