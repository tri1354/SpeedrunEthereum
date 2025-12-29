# Dice Game (SpeedrunEthereum – Challenge 3)

Workspace này được tạo từ template `challenge-dice-game` và đã hoàn thành đầy đủ các phần chính của challenge “Dice Game” theo hướng dẫn: https://speedrunethereum.com/challenge/dice-game

## 1) Tổng quan kiến trúc

- **Smart contracts (Hardhat)**: nằm trong [packages/hardhat](packages/hardhat)
  - Contract Dice Game: [`DiceGame`](packages/hardhat/contracts/DiceGame.sol)
  - Contract tấn công: [`RiggedRoll`](packages/hardhat/contracts/RiggedRoll.sol)
  - Deploy scripts: [packages/hardhat/deploy](packages/hardhat/deploy)
    - [`00_deploy_diceGame.ts`](packages/hardhat/deploy/00_deploy_diceGame.ts)
    - [`01_deploy_riggedRoll.ts`](packages/hardhat/deploy/01_deploy_riggedRoll.ts)
- **Frontend (Next.js)**: nằm trong [packages/nextjs](packages/nextjs)
  - Cấu hình mạng frontend: [scaffold.config.ts](packages/nextjs/scaffold.config.ts)
  - Trang Dice Game UI: [packages/nextjs/app/dice/page.tsx](packages/nextjs/app/dice/page.tsx)
  - Debug/Blockexplorer: [packages/nextjs/app/debug/page.tsx](packages/nextjs/app/debug/page.tsx)
  - Contracts addresses/ABIs auto-generate: [deployedContracts.ts](packages/nextjs/contracts/deployedContracts.ts)
  - Thay đổi so với template: chuyển `targetNetworks` sang `chains.sepolia` và bật kết nối ví thật bằng cách đặt `onlyLocalBurnerWallet: false`
- **Cấu hình Hardhat/network**: [hardhat.config.ts](packages/hardhat/hardhat.config.ts)
  - Thay đổi so với template: chuyển `defaultNetwork` sang `sepolia` để deploy/verify lên testnet (thay vì local `localhost`)

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

---

## 3) Giải thích Challenge flow (theo hướng dẫn SpeedrunEthereum)

### Checkpoint 0 — Environment

Mục tiêu: chạy được **chain + deploy + start** (3 terminal).
Đã làm đúng khi:

- `yarn chain` → có chain local
- `yarn deploy` → contracts được deploy
- `yarn start` → UI chạy

### Checkpoint 1 — Phân tích DiceGame

Mục tiêu: đọc code [`DiceGame`](packages/hardhat/contracts/DiceGame.sol), hiểu cách tạo random, thử roll và quan sát balance contract.

- Xác định công thức random: `keccak256(blockhash(block.number-1), address(this), nonce) % 16`.

### Checkpoint 2 — Viết contract tấn công RiggedRoll

Mục tiêu: viết contract [`RiggedRoll`](packages/hardhat/contracts/RiggedRoll.sol) để dự đoán trước random, chỉ roll khi chắc thắng.

- Tạo hàm `receive()` để nhận ETH từ Faucet.
- Tạo hàm `riggedRoll()`:
  - Tính random y hệt DiceGame.
  - Chỉ gọi `rollTheDice()` khi dự đoán roll <= 5 (chắc thắng), gửi kèm 0.002 ETH.
- Deploy RiggedRoll, fund ETH, test trên UI (tab Dice hoặc Debug).

### Checkpoint 3 — Rút tiền thắng về ví frontend

Mục tiêu: rút prize từ RiggedRoll về ví frontend.

- Thêm hàm `withdraw(address _addr, uint256 _amount)` trong RiggedRoll để gửi ETH ra ngoài.
- Khóa `withdraw` chỉ owner gọi được (`onlyOwner`).
- Set owner là ví frontend khi deploy (bằng script hoặc env).
- Test: gọi `withdraw` từ UI/Debug, kiểm tra balance ví tăng.

---

## 4) File quan trọng để đọc/chỉnh

- DiceGame contract: [`DiceGame.sol`](packages/hardhat/contracts/DiceGame.sol)
- RiggedRoll contract: [`RiggedRoll.sol`](packages/hardhat/contracts/RiggedRoll.sol)
- Deploy scripts: [packages/hardhat/deploy](packages/hardhat/deploy)
- Hardhat config/networks: [hardhat.config.ts](packages/hardhat/hardhat.config.ts)
- Frontend network targeting: [scaffold.config.ts](packages/nextjs/scaffold.config.ts)
- Dice Game UI: [packages/nextjs/app/dice/page.tsx](packages/nextjs/app/dice/page.tsx)
