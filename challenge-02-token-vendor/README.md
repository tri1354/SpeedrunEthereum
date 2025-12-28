# Token Vendor (SpeedrunEthereum – Challenge 2)

Workspace này được tạo từ template `challenge-token-vendor` và đã implement các phần chính của challenge “Token Vendor” theo hướng dẫn: https://speedrunethereum.com/challenge/token-vendor

## 1) Tổng quan kiến trúc

- **Smart contracts (Hardhat)**: nằm trong [packages/hardhat](packages/hardhat)
  - ERC20 token của bạn: [`YourToken`](packages/hardhat/contracts/YourToken.sol)
  - Contract Vendor để buy/sell token: [`Vendor`](packages/hardhat/contracts/Vendor.sol)
  - Deploy scripts: [packages/hardhat/deploy](packages/hardhat/deploy)
    - [`00_deploy_your_token.ts`](packages/hardhat/deploy/00_deploy_your_token.ts)
    - [`01_deploy_vendor.ts`](packages/hardhat/deploy/01_deploy_vendor.ts)
- **Frontend (Next.js)**: nằm trong [packages/nextjs](packages/nextjs)
  - Cấu hình mạng frontend: [scaffold.config.ts](packages/nextjs/scaffold.config.ts)
  - Trang Vendor UI: [packages/nextjs/app/token-vendor/page.tsx](packages/nextjs/app/token-vendor/page.tsx)
  - Trang Events (hiển thị BuyTokens/SellTokens): [packages/nextjs/app/events/page.tsx](packages/nextjs/app/events/page.tsx)
  - Contracts addresses/ABIs auto-generate: [deployedContracts.ts](packages/nextjs/contracts/deployedContracts.ts)
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

## 3) Giải thích Challenge flow (theo hướng dẫn SpeedrunEthereum)

### Checkpoint 0 — Environment

Mục tiêu: chạy được **chain + deploy + start** (3 terminal).  
Đã làm đúng khi:

- `yarn chain` → có chain local
- `yarn deploy` → contracts được deploy
- `yarn start` → UI chạy

### Checkpoint 1 — Your ERC20 Token (`YourToken`)

Mục tiêu: có một ERC20 token hoạt động (balance, transfer) để dùng cho Vendor.

Trong [`YourToken`](packages/hardhat/contracts/YourToken.sol):

- Token kế thừa OpenZeppelin `ERC20`.
- Mint initial supply (thường $1000 \times 10^{18}$) để bạn có token test.

Test nhanh trên UI (Debug Contracts hoặc trang token-vendor):

- `balanceOf(address)` trả về đúng balance.
- `transfer(to, amount)` hoạt động.

### Checkpoint 2 — Vendor Buy + Owner Withdraw (`Vendor`)

Mục tiêu: user gửi ETH để mua token theo rate cố định; owner có thể rút ETH (tuỳ thiết kế/liquidity).

Trong [`Vendor`](packages/hardhat/contracts/Vendor.sol), các điểm chính:

- `tokensPerEth`: tỉ lệ đổi (ví dụ 100 token / 1 ETH).
- `buyTokens()`:
  - `payable`
  - tính `amountOfTokens = msg.value * tokensPerEth`
  - transfer token cho buyer
  - emit event `BuyTokens(buyer, amountOfETH, amountOfTokens)`
- `withdraw()`:
  - `onlyOwner`
  - rút ETH từ Vendor về owner (lưu ý: nếu rút hết, Vendor có thể thiếu thanh khoản để buyback ở checkpoint 3)

### Checkpoint 3 — Vendor Buyback (Approve + Sell) + Events

Mục tiêu: user có thể bán token ngược lại cho Vendor để lấy ETH theo cùng rate.

Flow đúng (ERC20 approve pattern):

1. User gọi `YourToken.approve(vendorAddress, amount)`
2. User gọi `Vendor.sellTokens(amount)`

Trong [`Vendor`](packages/hardhat/contracts/Vendor.sol):

- `sellTokens(uint256 amount)`:
  - Vendor gọi `transferFrom(user, vendor, amount)`
  - tính `ethToReturn = amount / tokensPerEth`
  - gửi ETH lại cho user
  - emit event `SellTokens(seller, amountOfTokens, amountOfETH)`

Lưu ý quan trọng về thanh khoản:

- Vendor cần có ETH để trả khi user sell.
- Cách đơn giản để có ETH là thực hiện vài lần `buyTokens()` trước.

---

## 4) File quan trọng để đọc/chỉnh

- ERC20 token: [`YourToken.sol`](packages/hardhat/contracts/YourToken.sol)
- Vendor contract: [`Vendor.sol`](packages/hardhat/contracts/Vendor.sol)
- Deploy scripts: [packages/hardhat/deploy](packages/hardhat/deploy)
- Hardhat config/networks: [hardhat.config.ts](packages/hardhat/hardhat.config.ts)
- Frontend network targeting: [scaffold.config.ts](packages/nextjs/scaffold.config.ts)
- Vendor UI: [packages/nextjs/app/token-vendor/page.tsx](packages/nextjs/app/token-vendor/page.tsx)
- Events UI: [packages/nextjs/app/events/page.tsx](packages/nextjs/app/events/page.tsx)
