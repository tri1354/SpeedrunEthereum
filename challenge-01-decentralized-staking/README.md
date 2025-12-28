# Decentralized Staking (SpeedRunEthereum – Challenge 1)

Workspace này được tạo từ template `challenge-decentralized-staking` và đã implement phần logic chính trong smart contract [`Staker`](packages/hardhat/contracts/Staker.sol) theo hướng dẫn của challenge: https://speedrunethereum.com/challenge/decentralized-staking

## 1) Tổng quan kiến trúc

- **Smart contracts (Hardhat)**: nằm trong [packages/hardhat](packages/hardhat)
  - Contract staking: [`Staker`](packages/hardhat/contracts/Staker.sol)
  - Contract đích nhận tiền nếu đủ điều kiện: `ExampleExternalContract` ở [ExampleExternalContract.sol](packages/hardhat/contracts/ExampleExternalContract.sol)
- **Frontend (Next.js)**: nằm trong [packages/nextjs](packages/nextjs)
  - Cấu hình mạng frontend: [scaffold.config.ts](packages/nextjs/scaffold.config.ts)
  - Thay đổi so với template: chuyển `targetNetworks` sang `chains.sepolia` và bật kết nối ví thật bằng cách đặt `onlyLocalBurnerWallet: false`
- **Cấu hình Hardhat/network**: [hardhat.config.ts](packages/hardhat/hardhat.config.ts)
  - Thay đổi so với template: chuyển `defaultNetwork` sang `sepolia` để deploy/verify lên testnet (thay vì local `localhost`)

## 2) Chạy project (3 terminal)

> Các lệnh dưới đây chạy từ **root** của repo (thư mục có `package.json`).

### Bước 1 — Terminal #1: chạy giả lập blockchain (khi chạy local)

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

## 3) Giải thích Challenge flow (theo hướng dẫn SpeedRunEthereum)

### Checkpoint 0 — Environment

Mục tiêu: chạy được **chain + deploy + start** (3 terminal).  
Bạn đã làm đúng khi:

- `yarn chain` → có chain local
- `yarn deploy` → contracts được deploy
- `yarn start` → UI chạy

### Checkpoint 1+ — Implement `Staker.sol`

Toàn bộ logic staking nằm trong [`Staker`](packages/hardhat/contracts/Staker.sol).

#### State/biến quan trọng

- `balances[address]`: mapping theo dõi số ETH mỗi người stake.
- `threshold = 1 ether`: ngưỡng tối thiểu để “thành công”.
- `deadline = block.timestamp + 72 hours`: thời hạn stake.
- `openForWithdraw`: bật khi **không đạt threshold** để mọi người rút.
- `executed`: tránh `execute()` bị gọi nhiều lần.
- `exampleExternalContract`: instance contract đích (xem [ExampleExternalContract.sol](packages/hardhat/contracts/ExampleExternalContract.sol)).

Trong file [`Staker.sol`](packages/hardhat/contracts/Staker.sol), contract `Staker`:

#### (A) `stake()` — nhận ETH và ghi nhận balance + emit event

- `payable`: nhận ETH.
- `balances[msg.sender] += msg.value`: cộng dồn stake theo ví.
- `emit Stake(msg.sender, msg.value)`: để frontend tab “All Stakings” hiển thị lịch sử stake.

#### (B) `execute()` — sau deadline, chốt kết quả

Logic:

- Chỉ cho chạy khi `block.timestamp >= deadline`
- Chỉ chạy 1 lần (`!executed`)
- Nếu contract đích đã completed thì không chạy lại

Kết quả:

- Nếu `address(this).balance >= threshold`:
  - gọi `exampleExternalContract.complete{value: address(this).balance}()`
  - chuyển toàn bộ ETH sang external contract và đánh dấu completed (theo logic của `ExampleExternalContract`)
- Nếu không đạt threshold:
  - `openForWithdraw = true` để mở rút tiền

#### (C) `withdraw()` — rút lại tiền nếu không đạt threshold

Điều kiện:

- `openForWithdraw == true`
- user có `balances[msg.sender] > 0`

Cách làm:

- set `balances[msg.sender] = 0` trước (checks-effects-interactions)
- gửi ETH bằng `.call{value: amount}("")`

#### (D) `timeLeft()` — phục vụ UI countdown

- Nếu quá deadline → trả `0`
- Nếu chưa → trả `deadline - block.timestamp`

#### (E) `receive()` — nhận ETH trực tiếp và coi như stake

- Khi gửi ETH thẳng vào contract (không gọi function), `receive()` sẽ gọi `stake()`.

---

## 4) File quan trọng để đọc/chỉnh

- Contract staking: [`Staker.sol`](packages/hardhat/contracts/Staker.sol)
- Contract nhận tiền khi đạt threshold: [ExampleExternalContract.sol](packages/hardhat/contracts/ExampleExternalContract.sol)
- Hardhat config/networks: [hardhat.config.ts](packages/hardhat/hardhat.config.ts)
- Frontend network targeting: [scaffold.config.ts](packages/nextjs/scaffold.config.ts)
