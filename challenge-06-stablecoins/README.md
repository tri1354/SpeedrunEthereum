# MyUSD Stablecoin (SpeedrunEthereum – Challenge 6)

Workspace này được tạo từ template `challenge-stablecoins` và đã hoàn thành đầy đủ các phần chính của challenge “MyUSD Stablecoin” theo hướng dẫn: https://speedrunethereum.com/challenge/stablecoins

## 1) Tổng quan kiến trúc

- **Smart contracts (Hardhat)**: nằm trong [packages/hardhat](packages/hardhat)
  - DEX: [DEX.sol](packages/hardhat/contracts/DEX.sol)
  - Stablecoin ERC20: [MyUSD.sol](packages/hardhat/contracts/MyUSD.sol)
  - Stablecoin Engine: [`MyUSDEngine.sol`](packages/hardhat/contracts/MyUSDEngine.sol)
  - Staking: [MyUSDStaking.sol](packages/hardhat/contracts/MyUSDStaking.sol)
  - Oracle: [Oracle.sol](packages/hardhat/contracts/Oracle.sol)
  - Rate Controller: [RateController.sol](packages/hardhat/contracts/RateController.sol)
  - Deploy scripts: [00_deploy_contracts.ts](packages/hardhat/deploy/00_deploy_contracts.ts)
- **Frontend (Next.js)**: [scaffold.config.ts](packages/nextjs/scaffold.config.ts)
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

Mục tiêu: Chạy được **chain + deploy + start** (3 terminal). Đảm bảo UI hoạt động, contracts được deploy, các contract DEX, MyUSD, MyUSDEngine, MyUSDStaking, Oracle, RateController được khởi tạo đúng.

### Checkpoint 1 — System Overview

- **DEX ([DEX.sol](packages/hardhat/contracts/DEX.sol))**: Sàn giao dịch phi tập trung cho phép swap giữa ETH và MyUSD, cung cấp thanh khoản và xác định giá thị trường MyUSD dựa trên cung-cầu thực tế.
- **MyUSD ([MyUSD.sol](packages/hardhat/contracts/MyUSD.sol))**: Token ERC20 đại diện cho stablecoin, chỉ có thể được mint/burn bởi Engine.
- **MyUSDEngine ([MyUSDEngine.sol](packages/hardhat/contracts/MyUSDEngine.sol))**: Hợp đồng lõi quản lý gửi/rút tài sản thế chấp, mint/burn MyUSD, tính lãi suất, kiểm tra an toàn vị thế và xử lý thanh lý khi cần thiết.
- **MyUSDStaking ([MyUSDStaking.sol](packages/hardhat/contracts/MyUSDStaking.sol))**: Cho phép người dùng stake MyUSD để nhận lãi suất tiết kiệm, tạo động lực giữ MyUSD và hỗ trợ giữ giá peg.
- **Oracle ([Oracle.sol](packages/hardhat/contracts/Oracle.sol))**: Cung cấp giá ETH/MyUSD và ETH/USD cho toàn hệ thống, giúp xác định giá trị tài sản thế chấp và nợ.
- **RateController ([RateController.sol](packages/hardhat/contracts/RateController.sol))**: Quản lý và điều chỉnh lãi suất vay (Borrow Rate) và tiết kiệm (Savings Rate), là công cụ chính để cân bằng cung-cầu và giữ giá MyUSD quanh $1.

### Checkpoint 2 — Depositing Collateral & Understanding Value

- [addCollateral](packages/hardhat/contracts/MyUSDEngine.sol): Cho phép người dùng gửi ETH vào contract làm tài sản thế chấp. Hàm này kiểm tra nếu giá trị gửi vào là 0 thì revert với lỗi `Engine__InvalidAmount`. Khi gửi thành công, số dư [s_userCollateral](packages/hardhat/contracts/MyUSDEngine.sol) của người dùng sẽ tăng lên, đồng thời phát event `CollateralAdded` để frontend cập nhật trạng thái. Đây là bước đầu tiên để người dùng có thể mint MyUSD.
- [calculateCollateralValue](packages/hardhat/contracts/MyUSDEngine.sol): Hàm view trả về giá trị USD của lượng ETH thế chấp của một user, dựa trên giá ETH/MyUSD lấy từ [Oracle](packages/hardhat/contracts/Oracle.sol). Công thức: `(collateralAmount * ethPrice) / PRECISION`. Hàm này giúp xác định sức khỏe vị thế và giới hạn mint MyUSD.

### Checkpoint 3 — Interest Calculation System

**Cơ chế lãi suất chia sẻ (share-based interest):**
Hệ thống không lưu trực tiếp số nợ của từng user mà dùng cơ chế "debt shares" ([totalDebtShares](packages/hardhat/contracts/MyUSDEngine.sol), [s_userDebtShares](packages/hardhat/contracts/MyUSDEngine.sol)). Khi lãi suất tăng, chỉ cần cập nhật [debtExchangeRate](packages/hardhat/contracts/MyUSDEngine.sol), không cần cập nhật từng user.

- [\_getCurrentExchangeRate](packages/hardhat/contracts/MyUSDEngine.sol): Tính toán exchange rate mới dựa trên thời gian trôi qua và [borrowRate](packages/hardhat/contracts/MyUSDEngine.sol). Nếu chưa có nợ hoặc chưa có thời gian trôi qua thì trả về giá cũ.
- [\_accrueInterest](packages/hardhat/contracts/MyUSDEngine.sol): Cập nhật [debtExchangeRate](packages/hardhat/contracts/MyUSDEngine.sol) và [lastUpdateTime](packages/hardhat/contracts/MyUSDEngine.sol) để "chốt" lãi suất tích lũy.
- [\_getMyUSDToShares](packages/hardhat/contracts/MyUSDEngine.sol): Quy đổi số MyUSD thành số shares dựa trên exchange rate hiện tại. Khi mint hoặc trả nợ, luôn quy đổi qua shares để đảm bảo công bằng giữa các user.

### Checkpoint 4 — Minting MyUSD & Position Health

- [getCurrentDebtValue](packages/hardhat/contracts/MyUSDEngine.sol): Tính tổng nợ (bao gồm cả lãi) của user dựa trên số shares và exchange rate hiện tại. Nếu user chưa vay thì trả về 0.
- [calculatePositionRatio](packages/hardhat/contracts/MyUSDEngine.sol): Tính tỷ lệ tài sản thế chấp/giá trị nợ (collateralization ratio). Nếu user chưa vay thì trả về vô cực (an toàn tuyệt đối).
- [\_validatePosition](packages/hardhat/contracts/MyUSDEngine.sol): Kiểm tra vị thế có an toàn không (tỷ lệ >= 150%). Nếu không, revert với lỗi `Engine__UnsafePositionRatio`.
- [mintMyUSD](packages/hardhat/contracts/MyUSDEngine.sol): Cho phép user mint MyUSD dựa trên tài sản thế chấp. Hàm sẽ quy đổi số MyUSD muốn mint sang shares, cập nhật nợ, kiểm tra an toàn vị thế trước khi mint, và phát event.

### Checkpoint 5 — Accruing Interest & Managing Borrow Rates

- [setBorrowRate](packages/hardhat/contracts/MyUSDEngine.sol): Chỉ [RateController](packages/hardhat/contracts/RateController.sol) mới được gọi. Khi thay đổi [borrowRate](packages/hardhat/contracts/MyUSDEngine.sol), hệ thống sẽ [accrueInterest](packages/hardhat/contracts/MyUSDEngine.sol) trước để "chốt" lãi suất cũ, sau đó cập nhật [borrowRate](packages/hardhat/contracts/MyUSDEngine.sol) mới và phát event. (Từ checkpoint 9 sẽ kiểm tra borrowRate >= savingsRate)

### Checkpoint 6 — Repaying Debt & Withdrawing Collateral

- [repayUpTo](packages/hardhat/contracts/MyUSDEngine.sol): Cho phép user trả nợ MyUSD (có thể trả dư, hệ thống sẽ tự động tính toán số thực tế cần trả dựa trên shares). Hàm kiểm tra balance, allowance, cập nhật shares và burn MyUSD. Nếu trả dư, chỉ trả tối đa số nợ thực tế.
- [withdrawCollateral](packages/hardhat/contracts/MyUSDEngine.sol): Cho phép user rút ETH thế chấp nếu vị thế vẫn an toàn (sau khi rút, tỷ lệ thế chấp vẫn >= 150%). Nếu không đủ collateral hoặc rút quá nhiều sẽ revert. Sau khi rút thành công, phát event để frontend cập nhật.

### Checkpoint 7 — Liquidation - Enforcing System Stability

- [isLiquidatable](packages/hardhat/contracts/MyUSDEngine.sol): Kiểm tra vị thế của user có thể bị thanh lý không (tỷ lệ < 150%). Trả về true nếu vị thế không an toàn.
- [liquidate](packages/hardhat/contracts/MyUSDEngine.sol): Bất kỳ ai cũng có thể thanh lý vị thế không an toàn của user khác. Liquidator sẽ trả nợ thay, nhận lại ETH thế chấp tương ứng với nợ + thưởng 10%. Hệ thống cập nhật lại trạng thái nợ và collateral, phát event `Liquidation`.

### Checkpoint 8 — Market Simulation

**Chạy mô phỏng thị trường:**
Chạy lệnh:

```sh
yarn simulate
```

Script này sẽ tạo nhiều tài khoản bot tự động gửi collateral, mint MyUSD, swap trên DEX, stake... để mô phỏng hành vi thị trường thực tế. Quan sát sự thay đổi giá MyUSD, tổng cung, tỷ lệ thế chấp trên frontend và console.

### Checkpoint 9 — Savings Rate & Market Dynamics

**Savings Rate** (lãi suất tiết kiệm) được quản lý bởi [MyUSDStaking](packages/hardhat/contracts/MyUSDStaking.sol). Người dùng có thể stake MyUSD để nhận lãi. Yield này đến từ lãi suất vay ([borrowRate](packages/hardhat/contracts/MyUSDEngine.sol)) mà người vay phải trả. Hệ thống đảm bảo [borrowRate](packages/hardhat/contracts/MyUSDEngine.sol) >= [savingsRate](packages/hardhat/contracts/MyUSDStaking.sol) để luôn trả được lãi cho người stake.

- [setBorrowRate](packages/hardhat/contracts/MyUSDEngine.sol) trong MyUSDEngine sẽ kiểm tra: [borrowRate](packages/hardhat/contracts/MyUSDEngine.sol) >= [savingsRate](packages/hardhat/contracts/MyUSDStaking.sol) (lấy từ [i_staking.savingsRate](packages/hardhat/contracts/MyUSDStaking.sol)). Nếu không, revert với [Engine\_\_InvalidBorrowRate](packages/hardhat/contracts/MyUSDEngine.sol).

**Tác động lên peg:**

- Borrow Rate cao: Giảm nhu cầu mint MyUSD, giảm áp lực bán, giá MyUSD tăng.
- Savings Rate cao: Tăng nhu cầu mua/stake MyUSD, tạo áp lực mua, giá MyUSD tăng.
- Điều chỉnh 2 lãi suất này là công cụ chính để giữ giá MyUSD quanh $1. Nếu MyUSD < $1 thì tăng savings rate hoặc borrow rate, nếu MyUSD > $1 thì giảm savings rate hoặc borrow rate.

### Checkpoint 10 — Simulation & Finding Equilibrium

**Tự động cân bằng thị trường:**
Chạy song song 2 lệnh:

```sh
yarn simulate
```

và

```sh
yarn interest-rate-controller
```

Script `yarn simulate` sẽ mô phỏng hành vi thị trường thực tế, còn script `yarn interest-rate-controller` sẽ tự động điều chỉnh [borrowRate](packages/hardhat/contracts/MyUSDEngine.sol) và [savingsRate](packages/hardhat/contracts/MyUSDStaking.sol) dựa trên giá MyUSD trên DEX để đưa giá về gần $1 nhất có thể. Khi giá thấp, script sẽ tăng lãi suất tiết kiệm hoặc lãi suất vay để tạo động lực mua vào hoặc giảm mint. Khi giá cao, script sẽ giảm lãi suất để tăng nguồn cung.

## 4) File quan trọng để đọc/chỉnh

- DEX: [DEX.sol](packages/hardhat/contracts/DEX.sol)
- Stablecoin ERC20: [MyUSD.sol](packages/hardhat/contracts/MyUSD.sol)
- Stablecoin Engine: [`MyUSDEngine.sol`](packages/hardhat/contracts/MyUSDEngine.sol)
- Staking: [MyUSDStaking.sol](packages/hardhat/contracts/MyUSDStaking.sol)
- Oracle: [Oracle.sol](packages/hardhat/contracts/Oracle.sol)
- Rate Controller: [RateController.sol](packages/hardhat/contracts/RateController.sol)
- Hardhat config/networks: [hardhat.config.ts](packages/hardhat/hardhat.config.ts)
- Frontend network targeting: [scaffold.config.ts](packages/nextjs/scaffold.config.ts)
