# Over-Collateralized Lending (SpeedrunEthereum – Challenge 5)

Workspace này được tạo từ template `challenge-over-collateralized-lending` và đã hoàn thành đầy đủ các phần chính của challenge “Over-Collateralized Lending” theo hướng dẫn: https://speedrunethereum.com/challenge/over-collateralized-lending

## 1) Tổng quan kiến trúc

- **Smart contracts (Hardhat)**: nằm trong [packages/hardhat](packages/hardhat)
  - Contract Lending: [`Lending.sol`](packages/hardhat/contracts/Lending.sol)
  - Token ERC20: [Corn.sol](packages/hardhat/contracts/Corn.sol)
  - DEX & Price Oracle: [CornDEX.sol](packages/hardhat/contracts/CornDEX.sol)
  - Price Manipulation: [MovePrice.sol](packages/hardhat/contracts/MovePrice.sol)
  - Flash Loan Liquidator: [`FlashLoanLiquidator.sol`](packages/hardhat/contracts/FlashLoanLiquidator.sol)
  - Leverage Contract: [`Leverage.sol`](packages/hardhat/contracts/Leverage.sol)
  - Deploy scripts: [`00_deploy_contracts.ts`](packages/hardhat/deploy/00_deploy_contracts.ts)
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

Mục tiêu: Chạy được **chain + deploy + start** (3 terminal). Đảm bảo UI hoạt động, contracts được deploy, Lending contract được khởi tạo đúng.

### Checkpoint 1 — Lending Contract

Mục tiêu: Hiểu cấu trúc và chức năng chính của Lending contract:

- Gửi ETH làm tài sản thế chấp (collateral)
- Vay CORN dựa trên giá trị thế chấp
- Thanh lý (liquidation) khi vị thế không an toàn

### Checkpoint 2 — Adding and Removing Collateral

Mục tiêu: Thêm collateral ([addCollateral](packages/hardhat/contracts/Lending.sol)), rút collateral ([withdrawCollateral](packages/hardhat/contracts/Lending.sol)) với kiểm tra an toàn vị thế ([isLiquidatable](packages/hardhat/contracts/Lending.sol), [\_validatePosition](packages/hardhat/contracts/Lending.sol)), emit event cập nhật frontend.

- [addCollateral](packages/hardhat/contracts/Lending.sol): Cho phép người dùng gửi ETH vào contract Lending làm tài sản thế chấp. Hàm kiểm tra nếu giá trị gửi vào là 0 thì revert với lỗi `Lending__InvalidAmount`. Sau đó, cập nhật số dư collateral của người dùng và phát event `CollateralAdded` để frontend cập nhật trạng thái.
- [withdrawCollateral](packages/hardhat/contracts/Lending.sol): Cho phép người dùng rút ETH đã gửi làm collateral. Hàm kiểm tra số lượng rút hợp lệ, cập nhật lại số dư collateral. Nếu người dùng vẫn còn nợ (đã vay CORN), sau khi cập nhật collateral sẽ kiểm tra lại vị thế bằng hàm [\_validatePosition](packages/hardhat/contracts/Lending.sol) để đảm bảo không bị rơi vào trạng thái có thể bị thanh lý. Nếu không hợp lệ, giao dịch sẽ revert.

### Checkpoint 3 — Helper Methods

Mục tiêu: Thêm các hàm view hỗ trợ tính toán giá trị thế chấp ([calculateCollateralValue](packages/hardhat/contracts/Lending.sol)), tỷ lệ vị thế ([\_calculatePositionRatio](packages/hardhat/contracts/Lending.sol)), kiểm tra liquidatable ([isLiquidatable](packages/hardhat/contracts/Lending.sol)), validate vị thế ([\_validatePosition](packages/hardhat/contracts/Lending.sol)).

- [calculateCollateralValue](packages/hardhat/contracts/Lending.sol): Tính giá trị tài sản thế chấp của một user theo đơn vị CORN, dựa trên số ETH đã gửi và giá hiện tại của CORN từ DEX.
- [\_calculatePositionRatio](packages/hardhat/contracts/Lending.sol): Tính tỷ lệ giữa giá trị collateral và số CORN đã vay. Nếu chưa vay thì trả về giá trị lớn nhất (an toàn tuyệt đối).
- [isLiquidatable](packages/hardhat/contracts/Lending.sol): Kiểm tra xem vị thế của user có thể bị thanh lý không, dựa trên tỷ lệ collateral/borrow so với ngưỡng an toàn (120%). Nếu tỷ lệ thấp hơn ngưỡng, trả về true.
- [\_validatePosition](packages/hardhat/contracts/Lending.sol): Hàm nội bộ, dùng để kiểm tra vị thế sau khi cập nhật collateral hoặc borrow. Nếu vị thế không an toàn, giao dịch sẽ revert với lỗi `Lending__UnsafePositionRatio`.

### Checkpoint 4 — Let's Borrow Some CORN!

Mục tiêu: Cho phép vay CORN ([borrowCorn](packages/hardhat/contracts/Lending.sol)), trả nợ ([repayCorn](packages/hardhat/contracts/Lending.sol)), kiểm tra an toàn vị thế, emit event cập nhật frontend.

- [borrowCorn](packages/hardhat/contracts/Lending.sol): Cho phép người dùng vay CORN dựa trên giá trị collateral. Hàm kiểm tra số lượng vay hợp lệ, cập nhật số dư nợ, kiểm tra lại vị thế bằng [\_validatePosition](packages/hardhat/contracts/Lending.sol) để đảm bảo không vượt quá ngưỡng an toàn. Nếu hợp lệ, chuyển CORN cho người dùng và phát event `AssetBorrowed`.
- [repayCorn](packages/hardhat/contracts/Lending.sol): Cho phép người dùng trả nợ CORN. Hàm kiểm tra số lượng trả hợp lệ, cập nhật lại số dư nợ, chuyển CORN từ người dùng về contract Lending. Nếu thành công, phát event `AssetRepaid` để frontend cập nhật trạng thái.

### Checkpoint 5 — Liquidation Mechanism

Mục tiêu: Cho phép bất kỳ ai thanh lý vị thế không an toàn ([liquidate](packages/hardhat/contracts/Lending.sol)), nhận thưởng 10% collateral, đảm bảo hệ thống không bị nợ xấu.

- [liquidate](packages/hardhat/contracts/Lending.sol): Cho phép bất kỳ ai thanh lý vị thế không an toàn của người khác. Hàm kiểm tra vị thế có thể bị thanh lý không ([isLiquidatable](packages/hardhat/contracts/Lending.sol)), kiểm tra người gọi có đủ CORN để trả nợ cho user bị thanh lý. Nếu hợp lệ, chuyển CORN từ liquidator vào contract, xóa nợ của user, tính toán số collateral cần chuyển cho liquidator (bao gồm cả phần thưởng 10%), cập nhật lại số dư collateral của user, chuyển ETH cho liquidator và phát event `Liquidation`. Đảm bảo hệ thống không bị nợ xấu, luôn có đủ tài sản thế chấp cho khoản vay.

### Checkpoint 6 — Final Touches and Simulation

Mục tiêu: Bổ sung kiểm tra an toàn khi rút collateral, hoàn thiện logic, chạy mô phỏng nhiều tài khoản bot:

- Đảm bảo [withdrawCollateral](packages/hardhat/contracts/Lending.sol) kiểm tra [\_validatePosition](packages/hardhat/contracts/Lending.sol) sau khi cập nhật collateral.
- Chạy lệnh:

```sh
yarn simulate
```

để mô phỏng nhiều tài khoản sử dụng Lending protocol.

### Side Quest 1 — Flash Loans

- Thêm hàm [flashLoan](packages/hardhat/contracts/Lending.sol) vào Lending.sol, cho phép vay CORN không cần thế chấp miễn là trả lại trong cùng transaction.
- Tạo contract [FlashLoanLiquidator](packages/hardhat/contracts/FlashLoanLiquidator.sol) để thanh lý vị thế bằng flash loan ([executeOperation](packages/hardhat/contracts/FlashLoanLiquidator.sol)).

### Side Quest 2 — Maximum Leverage With An Iterative Borrow > Swap > Deposit Loop

- Thêm các helper function [getMaxBorrowAmount](packages/hardhat/contracts/Lending.sol), [getMaxWithdrawableCollateral](packages/hardhat/contracts/Lending.sol) vào Lending.sol.
- Tạo contract [Leverage](packages/hardhat/contracts/Leverage.sol) để tự động lặp [openLeveragedPosition](packages/hardhat/contracts/Leverage.sol) > [borrowCorn](packages/hardhat/contracts/Lending.sol) > [swap](packages/hardhat/contracts/CornDEX.sol) > [addCollateral](packages/hardhat/contracts/Lending.sol), tối đa hóa leverage hoặc unwind vị thế ([closeLeveragedPosition](packages/hardhat/contracts/Leverage.sol)).

## 4) File quan trọng để đọc/chỉnh

- Lending contract: [`Lending.sol`](packages/hardhat/contracts/Lending.sol)
- Corn token: [Corn.sol](packages/hardhat/contracts/Corn.sol)
- DEX/Oracle: [CornDEX.sol](packages/hardhat/contracts/CornDEX.sol)
- Price Manipulation: [MovePrice.sol](packages/hardhat/contracts/MovePrice.sol)
- FlashLoanLiquidator: [`FlashLoanLiquidator.sol`](packages/hardhat/contracts/FlashLoanLiquidator.sol)
- Leverage: [`Leverage.sol`](packages/hardhat/contracts/Leverage.sol)
- Deploy scripts: [`00_deploy_contracts.ts`](packages/hardhat/deploy/00_deploy_contracts.ts)
- Hardhat config/networks: [hardhat.config.ts](packages/hardhat/hardhat.config.ts)
- Frontend network targeting: [scaffold.config.ts](packages/nextjs/scaffold.config.ts)
- Lending UI: [page.tsx](packages/nextjs/app/dashboard/page.tsx)
