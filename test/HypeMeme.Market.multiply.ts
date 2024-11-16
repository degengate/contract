import { deployAllContracts, MAX_UINT256 } from "./shared/deploy";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { getTokenAmountWei } from "./shared/utils";
import Decimal from "decimal.js";

describe("HypeMeme.Market", function () {
  describe("multiply", function () {
    let data = [
      {
        amount: '90908000000000000000', // 90.908
        price: '0.1000018',
        mfee: '36363530573583738', // 
        userPayToken: '181817652867918690', // 0.18
        cap: '9090882643395934583' // 9.09
      },
      {
        amount: '909008000000000000000', // 909.008
        price: '0.1000182',
        mfee: '363636254826472730', // 
        userPayToken: '1818181274132363650', // 1.818
        cap: '90909063706618182558' // 90.909
      },
      {
        amount: '9082652000000000000000', // 9082.652
        price: '0.1001819',
        mfee: '3636363582496528926', // 
        userPayToken: '18181817912482644630', // 18.18
        cap: '909090895624132231586' // 909.09
      },
      {
        amount: '90090090000000000000000', // 90090.090
        price: '0.1018264',
        mfee: '36363636326942148760', //
        userPayToken: '181818181634710743801', // 181.818
        cap: '9090909081735537190166' // 9090.909
      },
      {
        amount: '833333332000000000000000', // 833333.332
        price: '0.1190083',
        mfee: '363636363001652892654', //
        userPayToken: '1818181815008264463270', // 1818.18
        cap: '90909090750413223163576' // 90909.09
      },
      {
        amount: '4761904763000000000000000', // 4761904.763
        price: '0.3644628',
        mfee: '3636363637960330578846', //
        userPayToken: '18181818189801652894230', // 18181.81
        cap: '909090909490082644711562' // 909090.9094
      },
      {
        amount: '9009009013000000000000000', // 9009009.013
        price: '10.1826447',
        mfee: '36363636526191736191844', //
        userPayToken: '181818182630958680959223', // 181818
        cap: '9090909131547934047961225' // 9090909.1315
      },
      {
        amount: '9891196839000000000000000', // 9891196.839
        price: '844.7281641',
        mfee: '363636377770311287187694', //
        userPayToken: '1818181888851556435938473', // 1818181
        cap: '90909094442577821796923712' // 90909094.4425
      },
      {
        amount: '9987792699000000000000000', // 9987792.699
        price: '67105.8981657',
        mfee: '3272727591135829287735265', //
        userPayToken: '16363637955679146438676327', // 16363637
        cap: '818181897783957321933816492' // 818181897
      }
    ];

    it("multiply revert", async function () {
      const info = (await loadFixture(deployAllContracts)).hypeMemeAllContractInfo;
      await info.hypeMeme.setSystemReady(true)
      await info.degenGateInfo.foundry.setMortgageFee(info.hypeMemeAppId, info.mortgageFee)

      let nftOwnerT1 = info.wallets[info.nextWalletIndex + 1];
      let nftOwnerT2 = info.wallets[info.nextWalletIndex + 2];

      let pt = await info.point.MAX_TOKEN_SUPPLY()

      await info.mockDegen.approve(await info.degenGateInfo.degenGate.getAddress(), MAX_UINT256)
      await info.degenGateInfo.degenGate.degenToPoint(pt - info.hypeMemeNftPrice * BigInt(2))
      await info.mockDegen.approve(await info.hypeMeme.getAddress(), MAX_UINT256)

      let paramsT1 = {
        info: {
          name: "name_t1",
          ticker: "ticker_t1",
          description: "description_t1",
          image: "image_t1",
          twitterLink: "twitter_link_t1",
          telegramLink: "telegram_link_t1",
          warpcastLink: "warpcast_link_t1",
          website: "website_t1"
        }
      };

      let paramsT2 = {
        info: {
          name: "name_t2",
          ticker: "ticker_t2",
          description: "description_t2",
          image: "image_t2",
          twitterLink: "twitter_link_t2",
          telegramLink: "telegram_link_t2",
          warpcastLink: "warpcast_link_t2",
          website: "website_t2"
        }
      };

      let tidT1 = paramsT1.info.ticker
      let tidT2 = paramsT2.info.ticker

      await info.hypeMeme
        .createToken(paramsT1.info);
      await info.hypeMeme
        .createToken(paramsT2.info);
      await info.hypeMemePublicNFT.transferFrom(info.deployWallet.address, nftOwnerT1.address, 1)
      await info.hypeMemePublicNFT.transferFrom(info.deployWallet.address, nftOwnerT2.address, 3)

      await info.point.approve(await info.hypeMemeMarket.getAddress(), BigInt(10) ** BigInt(18) * BigInt(100000000))

      // not tid
      await expect(info.hypeMemeMarket.multiply("t123", getTokenAmountWei(1))).revertedWith("TE");

      // zero
      await expect(info.hypeMemeMarket.multiply(tidT1, 0)).revertedWith("TAE");

      //  amount > 1000W
      await expect(
        info.hypeMemeMarket.multiply(tidT1, getTokenAmountWei(100000000)),
      ).revertedWithPanic("0x11");

      await expect(
        info.hypeMemeMarket.multiply(tidT1, getTokenAmountWei(10000000)),
      ).revertedWithPanic("0x12");

      await info.point.approve(await info.hypeMemeMarket.getAddress(), 1)
      // approve < need
      await expect(
        info.hypeMemeMarket.multiply(tidT1, getTokenAmountWei(1000)),
      ).revertedWithCustomError(info.point, "ERC20InsufficientAllowance")
    });

    it("multiplyAdd revert", async function () {
      const info = (await loadFixture(deployAllContracts)).hypeMemeAllContractInfo;
      await info.hypeMeme.setSystemReady(true)
      await info.degenGateInfo.foundry.setMortgageFee(info.hypeMemeAppId, info.mortgageFee)

      let nftOwnerT1 = info.wallets[info.nextWalletIndex + 1];
      let nftOwnerT2 = info.wallets[info.nextWalletIndex + 2];
      let user1 = info.wallets[info.nextWalletIndex + 3];
      let user2 = info.wallets[info.nextWalletIndex + 4];

      let count = BigInt(10) ** BigInt(18) * BigInt(100000000);
      await info.mockDegen.transfer(user1.address, count)
      await info.mockDegen.transfer(user2.address, count)

      await info.mockDegen.approve(await info.degenGateInfo.degenGate.getAddress(), MAX_UINT256)
      await info.mockDegen.connect(user1).approve(await info.degenGateInfo.degenGate.getAddress(), MAX_UINT256)
      await info.mockDegen.connect(user2).approve(await info.degenGateInfo.degenGate.getAddress(), MAX_UINT256)
      await info.degenGateInfo.degenGate.degenToPoint(count)
      await info.degenGateInfo.degenGate.connect(user1).degenToPoint(count)
      await info.degenGateInfo.degenGate.connect(user2).degenToPoint(count)

      await info.point.approve(await info.hypeMemeMarket.getAddress(), MAX_UINT256)
      await info.point.connect(user1).approve(await info.hypeMemeMarket.getAddress(), MAX_UINT256)
      await info.point.connect(user2).approve(await info.hypeMemeMarket.getAddress(), MAX_UINT256)

      await info.mockDegen.approve(await info.hypeMeme.getAddress(), MAX_UINT256)

      let paramsT1 = {
        info: {
          name: "name_t1",
          ticker: "ticker_t1",
          description: "description_t1",
          image: "image_t1",
          twitterLink: "twitter_link_t1",
          telegramLink: "telegram_link_t1",
          warpcastLink: "warpcast_link_t1",
          website: "website_t1"
        }
      };

      let paramsT2 = {
        info: {
          name: "name_t2",
          ticker: "ticker_t2",
          description: "description_t2",
          image: "image_t2",
          twitterLink: "twitter_link_t2",
          telegramLink: "telegram_link_t2",
          warpcastLink: "warpcast_link_t2",
          website: "website_t2"
        }
      };

      let tidT1 = paramsT1.info.ticker
      let tidT2 = paramsT2.info.ticker

      await info.hypeMeme
        .createToken(paramsT1.info);
      await info.hypeMeme
        .createToken(paramsT2.info);
      await info.hypeMemePublicNFT.transferFrom(info.deployWallet.address, nftOwnerT1.address, 1)
      await info.hypeMemePublicNFT.transferFrom(info.deployWallet.address, nftOwnerT2.address, 3)

      await info.hypeMemeMarket.connect(user1).multiply(tidT1, getTokenAmountWei(1000));
      await info.hypeMemeMarket.connect(user1).multiply(tidT1, getTokenAmountWei(1000));

      expect(await info.hypeMemeMortgageNFT.ownerOf(1)).eq(user1.address);
      expect(await info.hypeMemeMortgageNFT.ownerOf(2)).eq(user1.address);

      //  not tokenid
      await expect(
        info.hypeMemeMarket.multiplyAdd(3, getTokenAmountWei(1000)),
      ).revertedWithCustomError(info.hypeMemeMortgageNFT, "ERC721NonexistentToken");

      //  deleted tokenid
      await info.hypeMemeMarket
        .connect(user1)
        .redeem(1, getTokenAmountWei(1000));

      await expect(info.hypeMemeMortgageNFT.ownerOf(1)).revertedWithCustomError(info.hypeMemeMortgageNFT, "ERC721NonexistentToken");
      expect(await info.hypeMemeMortgageNFT.ownerOf(2)).eq(user1.address);

      await expect(
        info.hypeMemeMarket
          .connect(user2)
          .multiplyAdd(1, getTokenAmountWei(1000)),
      ).revertedWithCustomError(info.hypeMemeMortgageNFT, "ERC721NonexistentToken");

      //  other user tokenid
      await expect(
        info.hypeMemeMarket
          .connect(user2)
          .multiplyAdd(2, getTokenAmountWei(1000)),
      ).revertedWith("AOE");

      // 0
      await expect(
        info.hypeMemeMarket.connect(user1).multiplyAdd(2, 0),
      ).revertedWith("TAE");

      //  amount > 1000W
      await expect(
        info.hypeMemeMarket.connect(user1).multiplyAdd(2, getTokenAmountWei(10000000) - getTokenAmountWei(1000)),
      ).revertedWithPanic("0x11");

      // approve < need
      await info.point.connect(user1).approve(await info.hypeMemeMarket.getAddress(), 1)
      await expect(
        info.hypeMemeMarket.connect(user1).multiplyAdd(2, getTokenAmountWei(1000)),
      ).revertedWithCustomError(info.point, "ERC20InsufficientAllowance")
    });

    it("multiply result", async function () {
      const info = (await loadFixture(deployAllContracts)).hypeMemeAllContractInfo;
      await info.hypeMeme.setSystemReady(true)
      await info.degenGateInfo.foundry.setMortgageFee(info.hypeMemeAppId, info.mortgageFee)

      let nftOwnerT1 = info.wallets[info.nextWalletIndex + 1];
      let nftOwnerT2 = info.wallets[info.nextWalletIndex + 2];
      let user1 = info.wallets[info.nextWalletIndex + 3];
      let user2 = info.wallets[info.nextWalletIndex + 4];

      let count = BigInt(10) ** BigInt(18) * BigInt(100000000);
      await info.mockDegen.transfer(user1.address, count)
      await info.mockDegen.transfer(user2.address, count)

      await info.mockDegen.approve(await info.degenGateInfo.degenGate.getAddress(), MAX_UINT256)
      await info.mockDegen.connect(user1).approve(await info.degenGateInfo.degenGate.getAddress(), MAX_UINT256)
      await info.mockDegen.connect(user2).approve(await info.degenGateInfo.degenGate.getAddress(), MAX_UINT256)
      await info.degenGateInfo.degenGate.degenToPoint(count)
      await info.degenGateInfo.degenGate.connect(user1).degenToPoint(count)
      await info.degenGateInfo.degenGate.connect(user2).degenToPoint(count)

      await info.point.approve(await info.hypeMemeMarket.getAddress(), MAX_UINT256)
      await info.point.connect(user1).approve(await info.hypeMemeMarket.getAddress(), MAX_UINT256)
      await info.point.connect(user2).approve(await info.hypeMemeMarket.getAddress(), MAX_UINT256)

      await info.mockDegen.approve(await info.hypeMeme.getAddress(), MAX_UINT256)

      let paramsT1 = {
        info: {
          name: "name_t1",
          ticker: "ticker_t1",
          description: "description_t1",
          image: "image_t1",
          twitterLink: "twitter_link_t1",
          telegramLink: "telegram_link_t1",
          warpcastLink: "warpcast_link_t1",
          website: "website_t1"
        }
      };

      let paramsT2 = {
        info: {
          name: "name_t2",
          ticker: "ticker_t2",
          description: "description_t2",
          image: "image_t2",
          twitterLink: "twitter_link_t2",
          telegramLink: "telegram_link_t2",
          warpcastLink: "warpcast_link_t2",
          website: "website_t2"
        }
      };

      let tidT1 = paramsT1.info.ticker
      let tidT2 = paramsT2.info.ticker

      await info.hypeMeme
        .createToken(paramsT1.info);
      await info.hypeMeme
        .createToken(paramsT2.info);
      await info.hypeMemePublicNFT.transferFrom(info.deployWallet.address, nftOwnerT1.address, 1)
      await info.hypeMemePublicNFT.transferFrom(info.deployWallet.address, nftOwnerT2.address, 3)

      let user1_payToken_1 = await info.point.balanceOf(user1.address);

      let result = await info.hypeMemeMarket.connect(user1).multiply.staticCall(tidT1, getTokenAmountWei(1000));
      await info.hypeMemeMarket
        .connect(user1)
        .multiply(tidT1, getTokenAmountWei(1000));

      let user1_payToken_2 = await info.point.balanceOf(user1.address);

      expect(user1_payToken_1 - result.payTokenAmount).eq(user1_payToken_2);
      expect(result.nftTokenId).eq(1);
    });

    it("multiply refund", async function () {
      const info = (await loadFixture(deployAllContracts)).hypeMemeAllContractInfo;
      await info.hypeMeme.setSystemReady(true)
      await info.degenGateInfo.foundry.setMortgageFee(info.hypeMemeAppId, info.mortgageFee)

      let nftOwnerT1 = info.wallets[info.nextWalletIndex + 1];
      let nftOwnerT2 = info.wallets[info.nextWalletIndex + 2];
      let user1 = info.wallets[info.nextWalletIndex + 3];
      let user2 = info.wallets[info.nextWalletIndex + 4];

      let count = BigInt(10) ** BigInt(18) * BigInt(100000000);
      await info.mockDegen.transfer(user1.address, count)
      await info.mockDegen.transfer(user2.address, count)

      await info.mockDegen.approve(await info.degenGateInfo.degenGate.getAddress(), MAX_UINT256)
      await info.mockDegen.connect(user1).approve(await info.degenGateInfo.degenGate.getAddress(), MAX_UINT256)
      await info.mockDegen.connect(user2).approve(await info.degenGateInfo.degenGate.getAddress(), MAX_UINT256)
      await info.degenGateInfo.degenGate.degenToPoint(count)
      await info.degenGateInfo.degenGate.connect(user1).degenToPoint(count)
      await info.degenGateInfo.degenGate.connect(user2).degenToPoint(count)

      await info.point.approve(await info.hypeMemeMarket.getAddress(), MAX_UINT256)
      await info.point.connect(user1).approve(await info.hypeMemeMarket.getAddress(), MAX_UINT256)
      await info.point.connect(user2).approve(await info.hypeMemeMarket.getAddress(), MAX_UINT256)

      await info.mockDegen.approve(await info.hypeMeme.getAddress(), MAX_UINT256)

      let paramsT1 = {
        info: {
          name: "name_t1",
          ticker: "ticker_t1",
          description: "description_t1",
          image: "image_t1",
          twitterLink: "twitter_link_t1",
          telegramLink: "telegram_link_t1",
          warpcastLink: "warpcast_link_t1",
          website: "website_t1"
        }
      };

      let paramsT2 = {
        info: {
          name: "name_t2",
          ticker: "ticker_t2",
          description: "description_t2",
          image: "image_t2",
          twitterLink: "twitter_link_t2",
          telegramLink: "telegram_link_t2",
          warpcastLink: "warpcast_link_t2",
          website: "website_t2"
        }
      };

      let tidT1 = paramsT1.info.ticker
      let tidT2 = paramsT2.info.ticker

      await info.hypeMeme
        .createToken(paramsT1.info);
      await info.hypeMeme
        .createToken(paramsT2.info);
      await info.hypeMemePublicNFT.transferFrom(info.deployWallet.address, nftOwnerT1.address, 1)
      await info.hypeMemePublicNFT.transferFrom(info.deployWallet.address, nftOwnerT2.address, 3)

      let user1_payToken_1 = await info.point.balanceOf(user1.address);

      let result = await info.hypeMemeMarket.connect(user1).multiply.staticCall(tidT1, getTokenAmountWei(1000));
      await info.hypeMemeMarket
        .connect(user1)
        .multiply(tidT1, getTokenAmountWei(1000));

      let user1_payToken_2 = await info.point.balanceOf(user1.address);

      expect(user1_payToken_1 - result.payTokenAmount).eq(user1_payToken_2);
      expect(result.nftTokenId).eq(1);
    });

    it("multiplyAdd result", async function () {
      const info = (await loadFixture(deployAllContracts)).hypeMemeAllContractInfo;
      await info.hypeMeme.setSystemReady(true)
      await info.degenGateInfo.foundry.setMortgageFee(info.hypeMemeAppId, info.mortgageFee)

      let nftOwnerT1 = info.wallets[info.nextWalletIndex + 1];
      let nftOwnerT2 = info.wallets[info.nextWalletIndex + 2];
      let user1 = info.wallets[info.nextWalletIndex + 3];
      let user2 = info.wallets[info.nextWalletIndex + 4];

      let count = BigInt(10) ** BigInt(18) * BigInt(100000000);
      await info.mockDegen.transfer(user1.address, count)
      await info.mockDegen.transfer(user2.address, count)

      await info.mockDegen.approve(await info.degenGateInfo.degenGate.getAddress(), MAX_UINT256)
      await info.mockDegen.connect(user1).approve(await info.degenGateInfo.degenGate.getAddress(), MAX_UINT256)
      await info.mockDegen.connect(user2).approve(await info.degenGateInfo.degenGate.getAddress(), MAX_UINT256)
      await info.degenGateInfo.degenGate.degenToPoint(count)
      await info.degenGateInfo.degenGate.connect(user1).degenToPoint(count)
      await info.degenGateInfo.degenGate.connect(user2).degenToPoint(count)

      await info.point.approve(await info.hypeMemeMarket.getAddress(), MAX_UINT256)
      await info.point.connect(user1).approve(await info.hypeMemeMarket.getAddress(), MAX_UINT256)
      await info.point.connect(user2).approve(await info.hypeMemeMarket.getAddress(), MAX_UINT256)

      await info.mockDegen.approve(await info.hypeMeme.getAddress(), MAX_UINT256)

      let paramsT1 = {
        info: {
          name: "name_t1",
          ticker: "ticker_t1",
          description: "description_t1",
          image: "image_t1",
          twitterLink: "twitter_link_t1",
          telegramLink: "telegram_link_t1",
          warpcastLink: "warpcast_link_t1",
          website: "website_t1"
        }
      };

      let paramsT2 = {
        info: {
          name: "name_t2",
          ticker: "ticker_t2",
          description: "description_t2",
          image: "image_t2",
          twitterLink: "twitter_link_t2",
          telegramLink: "telegram_link_t2",
          warpcastLink: "warpcast_link_t2",
          website: "website_t2"
        }
      };

      let tidT1 = paramsT1.info.ticker
      let tidT2 = paramsT2.info.ticker

      await info.hypeMeme
        .createToken(paramsT1.info);
      await info.hypeMeme
        .createToken(paramsT2.info);
      await info.hypeMemePublicNFT.transferFrom(info.deployWallet.address, nftOwnerT1.address, 1)
      await info.hypeMemePublicNFT.transferFrom(info.deployWallet.address, nftOwnerT2.address, 3)

      let user1_payToken_1 = await info.point.balanceOf(user1.address);

      let result_1 = await info.hypeMemeMarket.connect(user1).multiply.staticCall(tidT1, getTokenAmountWei(1000));
      await info.hypeMemeMarket
        .connect(user1)
        .multiply(tidT1, getTokenAmountWei(1000));

      let user1_payToken_2 = await info.point.balanceOf(user1.address);

      expect(user1_payToken_1 - result_1.payTokenAmount).eq(user1_payToken_2);
      expect(result_1.nftTokenId).eq(1);

      let result_2 = await info.hypeMemeMarket.connect(user1).multiplyAdd.staticCall(1, getTokenAmountWei(1000));
      await info.hypeMemeMarket.connect(user1).multiplyAdd(1, getTokenAmountWei(1000));

      let user1_payToken_3 = await info.point.balanceOf(user1.address);

      expect(user1_payToken_2 - result_2).eq(user1_payToken_3);
    });

    it("multiplyAdd refund", async function () {
      const info = (await loadFixture(deployAllContracts)).hypeMemeAllContractInfo;
      await info.hypeMeme.setSystemReady(true)
      await info.degenGateInfo.foundry.setMortgageFee(info.hypeMemeAppId, info.mortgageFee)

      let nftOwnerT1 = info.wallets[info.nextWalletIndex + 1];
      let nftOwnerT2 = info.wallets[info.nextWalletIndex + 2];
      let user1 = info.wallets[info.nextWalletIndex + 3];
      let user2 = info.wallets[info.nextWalletIndex + 4];

      let count = BigInt(10) ** BigInt(18) * BigInt(100000000);
      await info.mockDegen.transfer(user1.address, count)
      await info.mockDegen.transfer(user2.address, count)

      await info.mockDegen.approve(await info.degenGateInfo.degenGate.getAddress(), MAX_UINT256)
      await info.mockDegen.connect(user1).approve(await info.degenGateInfo.degenGate.getAddress(), MAX_UINT256)
      await info.mockDegen.connect(user2).approve(await info.degenGateInfo.degenGate.getAddress(), MAX_UINT256)
      await info.degenGateInfo.degenGate.degenToPoint(count)
      await info.degenGateInfo.degenGate.connect(user1).degenToPoint(count)
      await info.degenGateInfo.degenGate.connect(user2).degenToPoint(count)

      await info.point.approve(await info.hypeMemeMarket.getAddress(), MAX_UINT256)
      await info.point.connect(user1).approve(await info.hypeMemeMarket.getAddress(), MAX_UINT256)
      await info.point.connect(user2).approve(await info.hypeMemeMarket.getAddress(), MAX_UINT256)

      await info.mockDegen.approve(await info.hypeMeme.getAddress(), MAX_UINT256)

      let paramsT1 = {
        info: {
          name: "name_t1",
          ticker: "ticker_t1",
          description: "description_t1",
          image: "image_t1",
          twitterLink: "twitter_link_t1",
          telegramLink: "telegram_link_t1",
          warpcastLink: "warpcast_link_t1",
          website: "website_t1"
        }
      };

      let paramsT2 = {
        info: {
          name: "name_t2",
          ticker: "ticker_t2",
          description: "description_t2",
          image: "image_t2",
          twitterLink: "twitter_link_t2",
          telegramLink: "telegram_link_t2",
          warpcastLink: "warpcast_link_t2",
          website: "website_t2"
        }
      };

      let tidT1 = paramsT1.info.ticker
      let tidT2 = paramsT2.info.ticker

      await info.hypeMeme
        .createToken(paramsT1.info);
      await info.hypeMeme
        .createToken(paramsT2.info);
      await info.hypeMemePublicNFT.transferFrom(info.deployWallet.address, nftOwnerT1.address, 1)
      await info.hypeMemePublicNFT.transferFrom(info.deployWallet.address, nftOwnerT2.address, 3)

      let user1_payToken_1 = await info.point.balanceOf(user1.address);

      let result_1 = await info.hypeMemeMarket.connect(user1).multiply.staticCall(tidT1, getTokenAmountWei(1000));
      await info.hypeMemeMarket
        .connect(user1)
        .multiply(tidT1, getTokenAmountWei(1000));

      let user1_payToken_2 = await info.point.balanceOf(user1.address);

      expect(user1_payToken_1 - result_1.payTokenAmount).eq(user1_payToken_2);
      expect(result_1.nftTokenId).eq(1);

      let result_2 = await info.hypeMemeMarket.connect(user1).multiplyAdd.staticCall(1, getTokenAmountWei(1000));
      await info.hypeMemeMarket
        .connect(user1)
        .multiplyAdd(1, getTokenAmountWei(1000));

      let user1_payToken_3 = await info.point.balanceOf(user1.address);

      expect(user1_payToken_2 - result_2).eq(user1_payToken_3);
    });

    it("multiply", async function () {
      for (let i = 0; i < data.length; i++) {
        const info = (await loadFixture(deployAllContracts)).hypeMemeAllContractInfo;
        await info.hypeMeme.setSystemReady(true)
        await info.degenGateInfo.foundry.setMortgageFee(info.hypeMemeAppId, info.mortgageFee)

        let nftOwnerT1 = info.wallets[info.nextWalletIndex + 1];
        let nftOwnerT2 = info.wallets[info.nextWalletIndex + 2];
        let user1 = info.wallets[info.nextWalletIndex + 3];
        let user2 = info.wallets[info.nextWalletIndex + 4];

        let count = BigInt(10) ** BigInt(18) * BigInt(100000000);
        await info.mockDegen.transfer(user1.address, count)
        await info.mockDegen.transfer(user2.address, count)

        await info.mockDegen.approve(await info.degenGateInfo.degenGate.getAddress(), MAX_UINT256)
        await info.mockDegen.connect(user1).approve(await info.degenGateInfo.degenGate.getAddress(), MAX_UINT256)
        await info.mockDegen.connect(user2).approve(await info.degenGateInfo.degenGate.getAddress(), MAX_UINT256)
        await info.degenGateInfo.degenGate.degenToPoint(count)
        await info.degenGateInfo.degenGate.connect(user1).degenToPoint(count)
        await info.degenGateInfo.degenGate.connect(user2).degenToPoint(count)

        await info.point.approve(await info.hypeMemeMarket.getAddress(), MAX_UINT256)
        await info.point.connect(user1).approve(await info.hypeMemeMarket.getAddress(), MAX_UINT256)
        await info.point.connect(user2).approve(await info.hypeMemeMarket.getAddress(), MAX_UINT256)

        await info.mockDegen.approve(await info.hypeMeme.getAddress(), MAX_UINT256)

        let paramsT1 = {
          info: {
            name: "name_t1",
            ticker: "ticker_t1",
            description: "description_t1",
            image: "image_t1",
            twitterLink: "twitter_link_t1",
            telegramLink: "telegram_link_t1",
            warpcastLink: "warpcast_link_t1",
            website: "website_t1"
          }
        };

        let paramsT2 = {
          info: {
            name: "name_t2",
            ticker: "ticker_t2",
            description: "description_t2",
            image: "image_t2",
            twitterLink: "twitter_link_t2",
            telegramLink: "telegram_link_t2",
            warpcastLink: "warpcast_link_t2",
            website: "website_t2"
          }
        };

        let tidT1 = paramsT1.info.ticker
        let tidT2 = paramsT2.info.ticker

        await info.hypeMeme
          .createToken(paramsT1.info);
        await info.hypeMeme
          .createToken(paramsT2.info);
        await info.hypeMemePublicNFT.transferFrom(info.deployWallet.address, nftOwnerT1.address, 1)
        await info.hypeMemePublicNFT.transferFrom(info.deployWallet.address, nftOwnerT2.address, 3)

        let amount = BigInt(data[i].amount);

        expect(await info.hypeMemeMarket.totalSupply(tidT1)).eq(0);
        expect(await info.hypeMemeMarket.totalSupply(tidT2)).eq(0);

        expect(await info.hypeMemeMarket.balanceOf(tidT1, await info.hypeMemeMarket.getAddress())).eq(0);
        expect(await info.hypeMemeMarket.balanceOf(tidT2, await info.hypeMemeMarket.getAddress())).eq(0);

        expect(await info.hypeMemeMarket.balanceOf(tidT1, user1.address)).eq(0);
        expect(await info.hypeMemeMarket.balanceOf(tidT1, user2.address)).eq(0);
        expect(await info.hypeMemeMarket.balanceOf(tidT1, nftOwnerT1.address)).eq(0);
        expect(await info.hypeMemeMarket.balanceOf(tidT1, nftOwnerT2.address)).eq(0);
        expect(await info.hypeMemeMarket.balanceOf(tidT1, info.mortgageFeeWallet.address)).eq(0);

        expect(await info.hypeMemeMarket.balanceOf(tidT2, user1.address)).eq(0);
        expect(await info.hypeMemeMarket.balanceOf(tidT2, user2.address)).eq(0);
        expect(await info.hypeMemeMarket.balanceOf(tidT2, nftOwnerT1.address)).eq(0);
        expect(await info.hypeMemeMarket.balanceOf(tidT2, nftOwnerT2.address)).eq(0);
        expect(await info.hypeMemeMarket.balanceOf(tidT2, info.mortgageFeeWallet.address)).eq(0);

        let user1_payToken_1 = await info.point.balanceOf(user1.address);
        let user2_payToken_1 = await info.point.balanceOf(user2.address);
        let nftOwnerT1_payToken_1 = await info.point.balanceOf(nftOwnerT1.address);
        let tnftOwnerT1_payToken_1 = await info.point.balanceOf(info.hypeMemeFundRecipientWallet.address);
        let nftOwnerT2_payToken_1 = await info.point.balanceOf(nftOwnerT2.address);
        let mortgage_fee_payToken_1 = await info.point.balanceOf(info.mortgageFeeWallet.address);
        let market_payToken_1 = await info.point.balanceOf(info.hypeMemeMarket.getAddress());

        // multiply
        let result = await info.hypeMemeMarket
          .connect(user1)
          .multiply.staticCall(tidT1, amount);
        await info.hypeMemeMarket.connect(user1).multiply(tidT1, amount);

        let user1_payToken_2 = await info.point.balanceOf(user1.address);
        let user2_payToken_2 = await info.point.balanceOf(user2.address);
        let nftOwnerT1_payToken_2 = await info.point.balanceOf(nftOwnerT1.address);
        let tnftOwnerT1_payToken_2 = await info.point.balanceOf(info.hypeMemeFundRecipientWallet.address);
        let nftOwnerT2_payToken_2 = await info.point.balanceOf(nftOwnerT2.address);

        let mortgage_fee_payToken_2 = await info.point.balanceOf(info.mortgageFeeWallet.address);
        let market_payToken_2 = await info.point.balanceOf(info.hypeMemeMarket.getAddress());

        let mortgage_fee_payToken_add = mortgage_fee_payToken_2 - mortgage_fee_payToken_1;
        let nftOwnerT1_payToken_add = nftOwnerT1_payToken_2 - nftOwnerT1_payToken_1;
        let tnftOwnerT1_payToken_add = tnftOwnerT1_payToken_2 - tnftOwnerT1_payToken_1;
        let nftOwnerT2_payToken_add = nftOwnerT2_payToken_2 - nftOwnerT2_payToken_1;

        let curve_buy = await info.hypeMemeMarket.getPayTokenAmount(0, amount);
        let curve_mortgage = await info.hypeMemeMarket.getPayTokenAmount(0, amount);

        // check
        expect(result.nftTokenId).eq(1);

        expect(await info.hypeMemeMarket.totalSupply(tidT1)).eq(amount);
        expect(await info.hypeMemeMarket.totalSupply(tidT2)).eq(0);

        expect(await info.hypeMemeMarket.balanceOf(tidT1, await info.hypeMemeMarket.getAddress())).eq(amount);
        expect(await info.hypeMemeMarket.balanceOf(tidT2, await info.hypeMemeMarket.getAddress())).eq(0);

        expect(await info.hypeMemeMarket.balanceOf(tidT1, user1.address)).eq(0);
        expect(await info.hypeMemeMarket.balanceOf(tidT1, user2.address)).eq(0);
        expect(await info.hypeMemeMarket.balanceOf(tidT1, nftOwnerT1.address)).eq(0);
        expect(await info.hypeMemeMarket.balanceOf(tidT1, nftOwnerT2.address)).eq(0);
        expect(await info.hypeMemeMarket.balanceOf(tidT1, info.mortgageFeeWallet.address)).eq(0);

        expect(await info.hypeMemeMarket.balanceOf(tidT2, user1.address)).eq(0);
        expect(await info.hypeMemeMarket.balanceOf(tidT2, user2.address)).eq(0);
        expect(await info.hypeMemeMarket.balanceOf(tidT2, nftOwnerT1.address)).eq(0);
        expect(await info.hypeMemeMarket.balanceOf(tidT2, nftOwnerT2.address)).eq(0);
        expect(await info.hypeMemeMarket.balanceOf(tidT2, info.mortgageFeeWallet.address)).eq(0);

        expect(market_payToken_2).eq(market_payToken_1).eq(0);

        expect(user2_payToken_2).eq(user2_payToken_1);
        expect(nftOwnerT2_payToken_add).eq(0);

        expect(curve_buy).eq(curve_mortgage);
        expect(curve_mortgage / mortgage_fee_payToken_add).eq(250);
        expect(curve_buy / nftOwnerT1_payToken_add).eq(100);
        expect(user1_payToken_1 - user1_payToken_2).eq(mortgage_fee_payToken_add + nftOwnerT1_payToken_add + tnftOwnerT1_payToken_add);
        expect((curve_buy + nftOwnerT1_payToken_add + tnftOwnerT1_payToken_add) / (user1_payToken_1 - user1_payToken_2)).eq(50);

        expect(user1_payToken_1 - user1_payToken_2).eq(result.payTokenAmount);

        // 10**49 / ((10**25 - x)**2)
        let a = BigInt(10) ** BigInt(49);
        let b = (BigInt(10) ** BigInt(25) - amount) ** BigInt(2);
        let price = new Decimal(a.toString()).dividedBy(new Decimal(b.toString())).toFixed(7);

        // assert
        // console.log("==================");
        // console.log(amount);
        // console.log("price", price);
        // console.log("mfee", mortgage_fee_payToken_add);
        // console.log("upt", user1_payToken_1 - user1_payToken_2);
        // console.log("mcap", curve_buy);

        expect(curve_buy).eq(data[i].cap);
        expect(user1_payToken_1 - user1_payToken_2).eq(data[i].userPayToken);
        expect(price).eq(data[i].price);
        expect(mortgage_fee_payToken_add).eq(data[i].mfee);
      }
    });

    it("multiply + multiplyAdd + multiplyAdd", async function () {
      for (let i = 0; i < data.length; i++) {
        const info = (await loadFixture(deployAllContracts)).hypeMemeAllContractInfo;
        await info.hypeMeme.setSystemReady(true)
        await info.degenGateInfo.foundry.setMortgageFee(info.hypeMemeAppId, info.mortgageFee)

        let nftOwnerT1 = info.wallets[info.nextWalletIndex + 1];
        let nftOwnerT2 = info.wallets[info.nextWalletIndex + 2];
        let user1 = info.wallets[info.nextWalletIndex + 3];
        let user2 = info.wallets[info.nextWalletIndex + 4];

        let count = BigInt(10) ** BigInt(18) * BigInt(100000000);
        await info.mockDegen.transfer(user1.address, count)
        await info.mockDegen.transfer(user2.address, count)

        await info.mockDegen.approve(await info.degenGateInfo.degenGate.getAddress(), MAX_UINT256)
        await info.mockDegen.connect(user1).approve(await info.degenGateInfo.degenGate.getAddress(), MAX_UINT256)
        await info.mockDegen.connect(user2).approve(await info.degenGateInfo.degenGate.getAddress(), MAX_UINT256)
        await info.degenGateInfo.degenGate.degenToPoint(count)
        await info.degenGateInfo.degenGate.connect(user1).degenToPoint(count)
        await info.degenGateInfo.degenGate.connect(user2).degenToPoint(count)

        await info.point.approve(await info.hypeMemeMarket.getAddress(), MAX_UINT256)
        await info.point.connect(user1).approve(await info.hypeMemeMarket.getAddress(), MAX_UINT256)
        await info.point.connect(user2).approve(await info.hypeMemeMarket.getAddress(), MAX_UINT256)

        await info.mockDegen.approve(await info.hypeMeme.getAddress(), MAX_UINT256)

        let paramsT1 = {
          info: {
            name: "name_t1",
            ticker: "ticker_t1",
            description: "description_t1",
            image: "image_t1",
            twitterLink: "twitter_link_t1",
            telegramLink: "telegram_link_t1",
            warpcastLink: "warpcast_link_t1",
            website: "website_t1"
          }
        };

        let paramsT2 = {
          info: {
            name: "name_t2",
            ticker: "ticker_t2",
            description: "description_t2",
            image: "image_t2",
            twitterLink: "twitter_link_t2",
            telegramLink: "telegram_link_t2",
            warpcastLink: "warpcast_link_t2",
            website: "website_t2"
          }
        };

        let tidT1 = paramsT1.info.ticker
        let tidT2 = paramsT2.info.ticker

        await info.hypeMeme
          .createToken(paramsT1.info);
        await info.hypeMeme
          .createToken(paramsT2.info);
        await info.hypeMemePublicNFT.transferFrom(info.deployWallet.address, nftOwnerT1.address, 1)
        await info.hypeMemePublicNFT.transferFrom(info.deployWallet.address, nftOwnerT2.address, 3)

        let amount = BigInt(data[i].amount);
        let part1 = amount / BigInt(4);
        let part2 = amount / BigInt(3);
        let part3 = amount - part1 - part2;

        expect(await info.hypeMemeMarket.totalSupply(tidT1)).eq(0);
        expect(await info.hypeMemeMarket.totalSupply(tidT2)).eq(0);

        expect(await info.hypeMemeMarket.balanceOf(tidT1, await info.hypeMemeMarket.getAddress())).eq(0);
        expect(await info.hypeMemeMarket.balanceOf(tidT2, await info.hypeMemeMarket.getAddress())).eq(0);

        expect(await info.hypeMemeMarket.balanceOf(tidT1, user1.address)).eq(0);
        expect(await info.hypeMemeMarket.balanceOf(tidT1, user2.address)).eq(0);
        expect(await info.hypeMemeMarket.balanceOf(tidT1, nftOwnerT1.address)).eq(0);
        expect(await info.hypeMemeMarket.balanceOf(tidT1, nftOwnerT2.address)).eq(0);
        expect(await info.hypeMemeMarket.balanceOf(tidT1, info.mortgageFeeWallet.address)).eq(0);
        expect(await info.hypeMemeMarket.balanceOf(tidT2, user1.address)).eq(0);
        expect(await info.hypeMemeMarket.balanceOf(tidT2, user2.address)).eq(0);
        expect(await info.hypeMemeMarket.balanceOf(tidT2, nftOwnerT1.address)).eq(0);
        expect(await info.hypeMemeMarket.balanceOf(tidT2, nftOwnerT2.address)).eq(0);
        expect(await info.hypeMemeMarket.balanceOf(tidT2, info.mortgageFeeWallet.address)).eq(0);

        let user1_payToken_1 = await info.point.balanceOf(user1.address);
        let user2_payToken_1 = await info.point.balanceOf(user2.address);
        let nftOwnerT1_payToken_1 = await info.point.balanceOf(nftOwnerT1.address);
        let tnftOwnerT1_payToken_1 = await info.point.balanceOf(info.hypeMemeFundRecipientWallet.address);
        let nftOwnerT2_payToken_1 = await info.point.balanceOf(nftOwnerT2.address);
        let mortgage_fee_payToken_1 = await info.point.balanceOf(info.mortgageFeeWallet.address);
        let market_payToken_1 = await info.point.balanceOf(info.hypeMemeMarket.getAddress());

        // multiply part1
        let result_1 = await info.hypeMemeMarket
          .connect(user1)
          .multiply.staticCall(tidT1, part1);
        await info.hypeMemeMarket.connect(user1).multiply(tidT1, part1);

        let user1_payToken_2 = await info.point.balanceOf(user1.address);
        let user2_payToken_2 = await info.point.balanceOf(user2.address);
        let nftOwnerT1_payToken_2 = await info.point.balanceOf(nftOwnerT1.address);
        let tnftOwnerT1_payToken_2 = await info.point.balanceOf(info.hypeMemeFundRecipientWallet.address);
        let nftOwnerT2_payToken_2 = await info.point.balanceOf(nftOwnerT2.address);
        let mortgage_fee_payToken_2 = await info.point.balanceOf(info.mortgageFeeWallet.address);
        let market_payToken_2 = await info.point.balanceOf(info.hypeMemeMarket.getAddress());

        let mortgage_fee_payToken_add_1 = mortgage_fee_payToken_2 - mortgage_fee_payToken_1;
        let nftOwnerT1_payToken_add_1 = nftOwnerT1_payToken_2 - nftOwnerT1_payToken_1;
        let tnftOwnerT1_payToken_add_1 = tnftOwnerT1_payToken_2 - tnftOwnerT1_payToken_1;
        let nftOwnerT2_payToken_add_1 = nftOwnerT2_payToken_2 - nftOwnerT2_payToken_1;

        let curve_buy_1 = await info.hypeMemeMarket.getPayTokenAmount(0, part1);
        let curve_mortgage_1 = await info.hypeMemeMarket.getPayTokenAmount(0, part1);

        // check
        expect(result_1.nftTokenId).eq(1);

        expect(await info.hypeMemeMarket.totalSupply(tidT1)).eq(part1);
        expect(await info.hypeMemeMarket.totalSupply(tidT2)).eq(0);

        expect(await info.hypeMemeMarket.balanceOf(tidT1, await info.hypeMemeMarket.getAddress())).eq(part1);
        expect(await info.hypeMemeMarket.balanceOf(tidT2, await info.hypeMemeMarket.getAddress())).eq(0);

        expect(await info.hypeMemeMarket.balanceOf(tidT1, user1.address)).eq(0);
        expect(await info.hypeMemeMarket.balanceOf(tidT1, user2.address)).eq(0);
        expect(await info.hypeMemeMarket.balanceOf(tidT1, nftOwnerT1.address)).eq(0);
        expect(await info.hypeMemeMarket.balanceOf(tidT1, nftOwnerT2.address)).eq(0);
        expect(await info.hypeMemeMarket.balanceOf(tidT1, info.mortgageFeeWallet.address)).eq(0);

        expect(await info.hypeMemeMarket.balanceOf(tidT2, user1.address)).eq(0);
        expect(await info.hypeMemeMarket.balanceOf(tidT2, user2.address)).eq(0);
        expect(await info.hypeMemeMarket.balanceOf(tidT2, nftOwnerT1.address)).eq(0);
        expect(await info.hypeMemeMarket.balanceOf(tidT2, nftOwnerT2.address)).eq(0);
        expect(await info.hypeMemeMarket.balanceOf(tidT2, info.mortgageFeeWallet.address)).eq(0);

        expect(market_payToken_2).eq(market_payToken_1).eq(0);

        expect(user2_payToken_2).eq(user2_payToken_1);
        expect(nftOwnerT2_payToken_add_1).eq(0);
        expect(nftOwnerT2_payToken_add_1).eq(0);

        expect(curve_buy_1).eq(curve_mortgage_1);
        expect(curve_mortgage_1 / mortgage_fee_payToken_add_1).eq(250);
        expect(curve_buy_1 / nftOwnerT1_payToken_add_1).eq(100);
        expect(user1_payToken_1 - user1_payToken_2).eq(
          mortgage_fee_payToken_add_1 + nftOwnerT1_payToken_add_1 + tnftOwnerT1_payToken_add_1,
        );
        expect(
          (curve_buy_1 + nftOwnerT1_payToken_add_1 + tnftOwnerT1_payToken_add_1) / (user1_payToken_1 - user1_payToken_2),
        ).eq(50);

        expect(user1_payToken_1 - user1_payToken_2).eq(result_1.payTokenAmount);

        // multiplyAdd part2
        let result_2 = await info.hypeMemeMarket
          .connect(user1)
          .multiplyAdd.staticCall(1, part2);

        await info.hypeMemeMarket.connect(user1).multiplyAdd(1, part2);

        //
        let user1_payToken_3 = await info.point.balanceOf(user1.address);
        let user2_payToken_3 = await info.point.balanceOf(user2.address);
        let nftOwnerT1_payToken_3 = await info.point.balanceOf(nftOwnerT1.address);
        let tnftOwnerT1_payToken_3 = await info.point.balanceOf(info.hypeMemeFundRecipientWallet.address);
        let nftOwnerT2_payToken_3 = await info.point.balanceOf(nftOwnerT2.address);
        let mortgage_fee_payToken_3 = await info.point.balanceOf(info.mortgageFeeWallet.address);
        let market_payToken_3 = await info.point.balanceOf(info.hypeMemeMarket.getAddress());

        let mortgage_fee_payToken_add_2 = mortgage_fee_payToken_3 - mortgage_fee_payToken_2;
        let nftOwnerT1_payToken_add_2 = nftOwnerT1_payToken_3 - nftOwnerT1_payToken_2;
        let tnftOwnerT1_payToken_add_2 = tnftOwnerT1_payToken_3 - tnftOwnerT1_payToken_2;
        let nftOwnerT2_payToken_add_2 = nftOwnerT2_payToken_3 - nftOwnerT2_payToken_2;

        let curve_buy_2 = await info.hypeMemeMarket.getPayTokenAmount(part1, part2);
        let curve_mortgage_2 = await info.hypeMemeMarket.getPayTokenAmount(part1, part2);

        // check
        await expect(info.hypeMemeMortgageNFT.ownerOf(2)).revertedWithCustomError(info.hypeMemeMortgageNFT, "ERC721NonexistentToken");

        expect(await info.hypeMemeMarket.totalSupply(tidT1)).eq(part1 + part2);
        expect(await info.hypeMemeMarket.totalSupply(tidT2)).eq(0);

        expect(await info.hypeMemeMarket.balanceOf(tidT1, await info.hypeMemeMarket.getAddress())).eq(part1 + part2);
        expect(await info.hypeMemeMarket.balanceOf(tidT2, await info.hypeMemeMarket.getAddress())).eq(0);

        expect(await info.hypeMemeMarket.balanceOf(tidT1, user1.address)).eq(0);
        expect(await info.hypeMemeMarket.balanceOf(tidT1, user2.address)).eq(0);
        expect(await info.hypeMemeMarket.balanceOf(tidT1, nftOwnerT1.address)).eq(0);
        expect(await info.hypeMemeMarket.balanceOf(tidT1, nftOwnerT2.address)).eq(0);
        expect(await info.hypeMemeMarket.balanceOf(tidT1, info.mortgageFeeWallet.address)).eq(0);

        expect(await info.hypeMemeMarket.balanceOf(tidT2, user1.address)).eq(0);
        expect(await info.hypeMemeMarket.balanceOf(tidT2, user2.address)).eq(0);
        expect(await info.hypeMemeMarket.balanceOf(tidT2, nftOwnerT1.address)).eq(0);
        expect(await info.hypeMemeMarket.balanceOf(tidT2, nftOwnerT2.address)).eq(0);
        expect(await info.hypeMemeMarket.balanceOf(tidT2, info.mortgageFeeWallet.address)).eq(0);

        expect(market_payToken_3).eq(market_payToken_2).eq(0);

        expect(user2_payToken_3).eq(user2_payToken_2);
        expect(nftOwnerT2_payToken_add_2).eq(0);

        expect(curve_buy_2).eq(curve_mortgage_2);
        expect(curve_mortgage_2 / mortgage_fee_payToken_add_2).eq(250);
        expect(curve_buy_2 / nftOwnerT1_payToken_add_2).eq(100);
        expect(user1_payToken_2 - user1_payToken_3).eq(
          mortgage_fee_payToken_add_2 + nftOwnerT1_payToken_add_2 + tnftOwnerT1_payToken_add_2,
        );
        expect(
          (curve_buy_2 + nftOwnerT1_payToken_add_2 + tnftOwnerT1_payToken_add_2) / (user1_payToken_2 - user1_payToken_3),
        ).eq(50);

        expect(user1_payToken_2 - user1_payToken_3).eq(result_2);
        ///

        // multiplyAdd part3
        let result_3 = await info.hypeMemeMarket
          .connect(user1)
          .multiplyAdd.staticCall(1, part3);

        await info.hypeMemeMarket.connect(user1).multiplyAdd(1, part3);

        //
        let user1_payToken_4 = await info.point.balanceOf(user1.address);
        let user2_payToken_4 = await info.point.balanceOf(user2.address);
        let nftOwnerT1_payToken_4 = await info.point.balanceOf(nftOwnerT1.address);
        let tnftOwnerT1_payToken_4 = await info.point.balanceOf(info.hypeMemeFundRecipientWallet.address);
        let nftOwnerT2_payToken_4 = await info.point.balanceOf(nftOwnerT2.address);
        let mortgage_fee_payToken_4 = await info.point.balanceOf(info.mortgageFeeWallet.address);
        let market_payToken_4 = await info.point.balanceOf(info.hypeMemeMarket.getAddress());

        let mortgage_fee_payToken_add_3 = mortgage_fee_payToken_4 - mortgage_fee_payToken_3;
        let nftOwnerT1_payToken_add_3 = nftOwnerT1_payToken_4 - nftOwnerT1_payToken_3;
        let tnftOwnerT1_payToken_add_3 = tnftOwnerT1_payToken_4 - tnftOwnerT1_payToken_3;
        let nftOwnerT2_payToken_add_3 = nftOwnerT2_payToken_4 - nftOwnerT2_payToken_3;

        let curve_buy_3 = await info.hypeMemeMarket.getPayTokenAmount(part1 + part2, part3);
        let curve_mortgage_3 = await info.hypeMemeMarket.getPayTokenAmount(part1 + part2, part3);

        // check
        await expect(info.hypeMemeMortgageNFT.ownerOf(2)).revertedWithCustomError(info.hypeMemeMortgageNFT, "ERC721NonexistentToken");

        expect(await info.hypeMemeMarket.totalSupply(tidT1)).eq(part1 + part2 + part3);
        expect(await info.hypeMemeMarket.totalSupply(tidT2)).eq(0);

        expect(await info.hypeMemeMarket.balanceOf(tidT1, await info.hypeMemeMarket.getAddress())).eq(
          part1 + part2 + part3,
        );
        expect(await info.hypeMemeMarket.balanceOf(tidT2, await info.hypeMemeMarket.getAddress())).eq(0);

        expect(await info.hypeMemeMarket.balanceOf(tidT1, user1.address)).eq(0);
        expect(await info.hypeMemeMarket.balanceOf(tidT1, user2.address)).eq(0);
        expect(await info.hypeMemeMarket.balanceOf(tidT1, nftOwnerT1.address)).eq(0);
        expect(await info.hypeMemeMarket.balanceOf(tidT1, nftOwnerT2.address)).eq(0);
        expect(await info.hypeMemeMarket.balanceOf(tidT1, info.mortgageFeeWallet.address)).eq(0);

        expect(await info.hypeMemeMarket.balanceOf(tidT2, user1.address)).eq(0);
        expect(await info.hypeMemeMarket.balanceOf(tidT2, user2.address)).eq(0);
        expect(await info.hypeMemeMarket.balanceOf(tidT2, nftOwnerT1.address)).eq(0);
        expect(await info.hypeMemeMarket.balanceOf(tidT2, nftOwnerT2.address)).eq(0);
        expect(await info.hypeMemeMarket.balanceOf(tidT2, info.mortgageFeeWallet.address)).eq(0);

        expect(market_payToken_4).eq(market_payToken_3).eq(0);

        expect(user2_payToken_4).eq(user2_payToken_3);
        expect(nftOwnerT2_payToken_add_3).eq(0);
        expect(nftOwnerT2_payToken_add_3).eq(0);

        expect(curve_buy_3).eq(curve_mortgage_3);
        expect(curve_mortgage_3 / mortgage_fee_payToken_add_3).eq(250);
        expect(curve_buy_3 / nftOwnerT1_payToken_add_3).eq(100);
        expect(user1_payToken_3 - user1_payToken_4).eq(
          mortgage_fee_payToken_add_3 + nftOwnerT1_payToken_add_3 + tnftOwnerT1_payToken_add_3,
        );
        expect(
          (curve_buy_3 + nftOwnerT1_payToken_add_3 + tnftOwnerT1_payToken_add_3) / (user1_payToken_3 - user1_payToken_4),
        ).eq(50);

        expect(user1_payToken_3 - user1_payToken_4).eq(result_3);

        // 10**49 / ((10**25 - x)**2)
        let a = BigInt(10) ** BigInt(49);
        let b = (BigInt(10) ** BigInt(25) - amount) ** BigInt(2);
        let price = new Decimal(a.toString()).dividedBy(new Decimal(b.toString())).toFixed(7);

        // assert
        expect(curve_buy_1 + curve_buy_2 + curve_buy_3).eq(data[i].cap);
        expect(price).eq(data[i].price);
        expect(BigInt(data[i].userPayToken) - (user1_payToken_1 - user1_payToken_4)).lt(7);
        expect(BigInt(data[i].userPayToken) - (user1_payToken_1 - user1_payToken_4)).gte(0);

        expect(BigInt(data[i].mfee) - (mortgage_fee_payToken_add_1 + mortgage_fee_payToken_add_2 + mortgage_fee_payToken_add_3)).lt(3);
        expect(BigInt(data[i].mfee) - (mortgage_fee_payToken_add_1 + mortgage_fee_payToken_add_2 + mortgage_fee_payToken_add_3)).gte(
          0,
        );
      }
    });

    it("multi user tid multiply + multiplyAdd", async function () {
      const info = (await loadFixture(deployAllContracts)).hypeMemeAllContractInfo;
      await info.hypeMeme.setSystemReady(true)
      await info.degenGateInfo.foundry.setMortgageFee(info.hypeMemeAppId, info.mortgageFee)

      let nftOwnerT1 = info.wallets[info.nextWalletIndex + 1];
      let nftOwnerT2 = info.wallets[info.nextWalletIndex + 2];
      let user1 = info.wallets[info.nextWalletIndex + 3];
      let user2 = info.wallets[info.nextWalletIndex + 4];

      let count = BigInt(10) ** BigInt(18) * BigInt(100000000);
      await info.mockDegen.transfer(user1.address, count)
      await info.mockDegen.transfer(user2.address, count)

      await info.mockDegen.approve(await info.degenGateInfo.degenGate.getAddress(), MAX_UINT256)
      await info.mockDegen.connect(user1).approve(await info.degenGateInfo.degenGate.getAddress(), MAX_UINT256)
      await info.mockDegen.connect(user2).approve(await info.degenGateInfo.degenGate.getAddress(), MAX_UINT256)
      await info.degenGateInfo.degenGate.degenToPoint(count)
      await info.degenGateInfo.degenGate.connect(user1).degenToPoint(count)
      await info.degenGateInfo.degenGate.connect(user2).degenToPoint(count)

      await info.point.approve(await info.hypeMemeMarket.getAddress(), MAX_UINT256)
      await info.point.connect(user1).approve(await info.hypeMemeMarket.getAddress(), MAX_UINT256)
      await info.point.connect(user2).approve(await info.hypeMemeMarket.getAddress(), MAX_UINT256)

      await info.mockDegen.approve(await info.hypeMeme.getAddress(), MAX_UINT256)

      let paramsT1 = {
        info: {
          name: "name_t1",
          ticker: "ticker_t1",
          description: "description_t1",
          image: "image_t1",
          twitterLink: "twitter_link_t1",
          telegramLink: "telegram_link_t1",
          warpcastLink: "warpcast_link_t1",
          website: "website_t1"
        }
      };

      let paramsT2 = {
        info: {
          name: "name_t2",
          ticker: "ticker_t2",
          description: "description_t2",
          image: "image_t2",
          twitterLink: "twitter_link_t2",
          telegramLink: "telegram_link_t2",
          warpcastLink: "warpcast_link_t2",
          website: "website_t2"
        }
      };

      let tidT1 = paramsT1.info.ticker
      let tidT2 = paramsT2.info.ticker

      await info.hypeMeme
        .createToken(paramsT1.info);
      await info.hypeMeme
        .createToken(paramsT2.info);
      await info.hypeMemePublicNFT.transferFrom(info.deployWallet.address, nftOwnerT1.address, 1)
      await info.hypeMemePublicNFT.transferFrom(info.deployWallet.address, nftOwnerT2.address, 3)

      let bignumber = getTokenAmountWei(BigInt("100000000"));
      let multiply_amount_1 = getTokenAmountWei(10000);
      let multiply_amount_2 = getTokenAmountWei(20000);
      let multiply_amount_3 = getTokenAmountWei(30000);
      let multiply_amount_4 = getTokenAmountWei(40000);
      let multiply_amount_5 = getTokenAmountWei(15000);
      let multiply_amount_6 = getTokenAmountWei(25000);
      let multiply_amount_7 = getTokenAmountWei(35000);
      let multiply_amount_8 = getTokenAmountWei(45000);

      let multiply_add_amount_1 = getTokenAmountWei(20000);
      let multiply_add_amount_2 = getTokenAmountWei(30000);
      let multiply_add_amount_3 = getTokenAmountWei(40000);
      let multiply_add_amount_4 = getTokenAmountWei(50000);
      let multiply_add_amount_5 = getTokenAmountWei(25000);
      let multiply_add_amount_6 = getTokenAmountWei(35000);
      let multiply_add_amount_7 = getTokenAmountWei(45000);
      let multiply_add_amount_8 = getTokenAmountWei(55000);

      expect(await info.hypeMemeMarket.totalSupply(tidT1)).eq(0);
      expect(await info.hypeMemeMarket.totalSupply(tidT2)).eq(0);

      expect(await info.hypeMemeMarket.balanceOf(tidT1, await info.hypeMemeMarket.getAddress())).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT2, await info.hypeMemeMarket.getAddress())).eq(0);

      expect(await info.hypeMemeMarket.balanceOf(tidT1, user1.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT1, user2.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT1, nftOwnerT1.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT1, nftOwnerT2.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT1, info.mortgageFeeWallet.address)).eq(0);

      expect(await info.hypeMemeMarket.balanceOf(tidT2, user1.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT2, user2.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT2, nftOwnerT1.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT2, nftOwnerT2.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT2, info.mortgageFeeWallet.address)).eq(0);

      let user1_payToken_0 = await info.point.balanceOf(user1.address);
      let user2_payToken_0 = await info.point.balanceOf(user2.address);
      let nftOwnerT1_payToken_0 = await info.point.balanceOf(nftOwnerT1.address);
      let tnftOwnerT1_payToken_0 = await info.point.balanceOf(info.hypeMemeFundRecipientWallet.address);
      let nftOwnerT2_payToken_0 = await info.point.balanceOf(nftOwnerT2.address);
      let mortgage_fee_payToken_0 = await info.point.balanceOf(info.mortgageFeeWallet.address);
      let market_payToken_0 = await info.point.balanceOf(info.hypeMemeMarket.getAddress());

      // user1 multiply t1 10000 tokenid=1
      let result_1 = await info.hypeMemeMarket
        .connect(user1)
        .multiply.staticCall(tidT1, multiply_amount_1);
      await info.hypeMemeMarket
        .connect(user1)
        .multiply(tidT1, multiply_amount_1);

      let user1_payToken_1 = await info.point.balanceOf(user1.address);
      let user2_payToken_1 = await info.point.balanceOf(user2.address);
      let nftOwnerT1_payToken_1 = await info.point.balanceOf(nftOwnerT1.address);
      let tnftOwnerT1_payToken_1 = await info.point.balanceOf(info.hypeMemeFundRecipientWallet.address);
      let nftOwnerT2_payToken_1 = await info.point.balanceOf(nftOwnerT2.address);
      let mortgage_fee_payToken_1 = await info.point.balanceOf(info.mortgageFeeWallet.address);
      let market_payToken_1 = await info.point.balanceOf(info.hypeMemeMarket.getAddress());

      let market_payToken_add_1 = market_payToken_1 - market_payToken_0;
      let mortgage_fee_payToken_add_1 = mortgage_fee_payToken_1 - mortgage_fee_payToken_0;

      let nftOwnerT1_payToken_add_1 = nftOwnerT1_payToken_1 - nftOwnerT1_payToken_0;
      let tnftOwnerT1_payToken_add_1 = tnftOwnerT1_payToken_1 - tnftOwnerT1_payToken_0;
      let nftOwnerT2_payToken_add_1 = nftOwnerT2_payToken_1 - nftOwnerT2_payToken_0;

      let curve_mortgage_1 = await info.hypeMemeMarket.getPayTokenAmount(0, multiply_amount_1);
      let curve_buy_1 = await info.hypeMemeMarket.getPayTokenAmount(0, multiply_amount_1);

      // check
      expect(result_1.nftTokenId).eq(1);

      expect(await info.hypeMemeMarket.totalSupply(tidT1)).eq(multiply_amount_1);
      expect(await info.hypeMemeMarket.totalSupply(tidT2)).eq(0);

      expect(await info.hypeMemeMarket.balanceOf(tidT1, await info.hypeMemeMarket.getAddress())).eq(multiply_amount_1);
      expect(await info.hypeMemeMarket.balanceOf(tidT2, await info.hypeMemeMarket.getAddress())).eq(0);

      expect(await info.hypeMemeMarket.balanceOf(tidT1, user1.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT1, user2.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT1, nftOwnerT1.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT1, nftOwnerT2.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT1, info.mortgageFeeWallet.address)).eq(0);

      expect(await info.hypeMemeMarket.balanceOf(tidT2, user1.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT2, user2.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT2, nftOwnerT1.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT2, nftOwnerT2.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT2, info.mortgageFeeWallet.address)).eq(0);

      expect(nftOwnerT2_payToken_add_1).eq(0);

      expect(curve_mortgage_1 / mortgage_fee_payToken_add_1).eq(250);

      expect(curve_buy_1 / nftOwnerT1_payToken_add_1).eq(100);

      expect(user2_payToken_1).eq(user2_payToken_0);

      expect(market_payToken_add_1).eq(
        user1_payToken_0 - user1_payToken_1 - mortgage_fee_payToken_add_1 - nftOwnerT1_payToken_add_1 - tnftOwnerT1_payToken_add_1,
      );
      expect(market_payToken_add_1)
        .eq(curve_buy_1 - curve_mortgage_1)
        .eq(0);

      // user1 multiply t1 20000 tokenid=2
      let result_2 = await info.hypeMemeMarket
        .connect(user1)
        .multiply.staticCall(tidT1, multiply_amount_2);
      await info.hypeMemeMarket
        .connect(user1)
        .multiply(tidT1, multiply_amount_2);

      let user1_payToken_2 = await info.point.balanceOf(user1.address);
      let user2_payToken_2 = await info.point.balanceOf(user2.address);
      let nftOwnerT1_payToken_2 = await info.point.balanceOf(nftOwnerT1.address);
      let tnftOwnerT1_payToken_2 = await info.point.balanceOf(info.hypeMemeFundRecipientWallet.address);
      let nftOwnerT2_payToken_2 = await info.point.balanceOf(nftOwnerT2.address);
      let tnftOwnerT2_payToken_2 = await info.point.balanceOf(info.hypeMemeFundRecipientWallet.address);
      let mortgage_fee_payToken_2 = await info.point.balanceOf(info.mortgageFeeWallet.address);
      let market_payToken_2 = await info.point.balanceOf(info.hypeMemeMarket.getAddress());

      let market_payToken_add_2 = market_payToken_2 - market_payToken_1;
      let mortgage_fee_payToken_add_2 = mortgage_fee_payToken_2 - mortgage_fee_payToken_1;

      let nftOwnerT1_payToken_add_2 = nftOwnerT1_payToken_2 - nftOwnerT1_payToken_1;
      let tnftOwnerT1_payToken_add_2 = tnftOwnerT1_payToken_2 - tnftOwnerT1_payToken_1;
      let nftOwnerT2_payToken_add_2 = nftOwnerT2_payToken_2 - nftOwnerT2_payToken_1;

      let curve_mortgage_2 = await info.hypeMemeMarket.getPayTokenAmount(0, multiply_amount_2);
      let curve_buy_2 = await info.hypeMemeMarket.getPayTokenAmount(multiply_amount_1, multiply_amount_2);

      // check
      expect(result_2.nftTokenId).eq(2);

      expect(await info.hypeMemeMarket.totalSupply(tidT1)).eq(multiply_amount_1 + multiply_amount_2);
      expect(await info.hypeMemeMarket.totalSupply(tidT2)).eq(0);

      expect(await info.hypeMemeMarket.balanceOf(tidT1, await info.hypeMemeMarket.getAddress())).eq(
        multiply_amount_1 + multiply_amount_2,
      );
      expect(await info.hypeMemeMarket.balanceOf(tidT2, await info.hypeMemeMarket.getAddress())).eq(0);

      expect(await info.hypeMemeMarket.balanceOf(tidT1, user1.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT1, user2.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT1, nftOwnerT1.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT1, nftOwnerT2.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT1, info.mortgageFeeWallet.address)).eq(0);

      expect(await info.hypeMemeMarket.balanceOf(tidT2, user1.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT2, user2.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT2, nftOwnerT1.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT2, nftOwnerT2.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT2, info.mortgageFeeWallet.address)).eq(0);


      expect(nftOwnerT2_payToken_add_2).eq(0);

      expect(curve_mortgage_2 / mortgage_fee_payToken_add_2).eq(250);

      expect(curve_buy_2 / nftOwnerT1_payToken_add_2).eq(100);

      expect(user2_payToken_2).eq(user2_payToken_1);

      expect(market_payToken_add_2).eq(
        user1_payToken_1 - user1_payToken_2 - mortgage_fee_payToken_add_2 - nftOwnerT1_payToken_add_2 - tnftOwnerT1_payToken_add_2,
      );
      expect(market_payToken_add_2)
        .eq(curve_buy_2 - curve_mortgage_2)
        .gt(0);

      // user1 multiply t2 30000 tokenid=3
      let result_3 = await info.hypeMemeMarket
        .connect(user1)
        .multiply.staticCall(tidT2, multiply_amount_3);
      await info.hypeMemeMarket
        .connect(user1)
        .multiply(tidT2, multiply_amount_3);

      let user1_payToken_3 = await info.point.balanceOf(user1.address);
      let user2_payToken_3 = await info.point.balanceOf(user2.address);
      let nftOwnerT1_payToken_3 = await info.point.balanceOf(nftOwnerT1.address);
      let nftOwnerT2_payToken_3 = await info.point.balanceOf(nftOwnerT2.address);
      let tnftOwnerT2_payToken_3 = await info.point.balanceOf(info.hypeMemeFundRecipientWallet.address);
      let mortgage_fee_payToken_3 = await info.point.balanceOf(info.mortgageFeeWallet.address);
      let market_payToken_3 = await info.point.balanceOf(info.hypeMemeMarket.getAddress());

      let market_payToken_add_3 = market_payToken_3 - market_payToken_2;
      let mortgage_fee_payToken_add_3 = mortgage_fee_payToken_3 - mortgage_fee_payToken_2;

      let nftOwnerT1_payToken_add_3 = nftOwnerT1_payToken_3 - nftOwnerT1_payToken_2;
      let nftOwnerT2_payToken_add_3 = nftOwnerT2_payToken_3 - nftOwnerT2_payToken_2;
      let tnftOwnerT2_payToken_add_3 = tnftOwnerT2_payToken_3 - tnftOwnerT2_payToken_2;

      let curve_mortgage_3 = await info.hypeMemeMarket.getPayTokenAmount(0, multiply_amount_3);
      let curve_buy_3 = await info.hypeMemeMarket.getPayTokenAmount(0, multiply_amount_3);

      // check
      expect(result_3.nftTokenId).eq(3);

      expect(await info.hypeMemeMarket.totalSupply(tidT1)).eq(multiply_amount_1 + multiply_amount_2);
      expect(await info.hypeMemeMarket.totalSupply(tidT2)).eq(multiply_amount_3);

      expect(await info.hypeMemeMarket.balanceOf(tidT1, await info.hypeMemeMarket.getAddress())).eq(
        multiply_amount_1 + multiply_amount_2,
      );
      expect(await info.hypeMemeMarket.balanceOf(tidT2, await info.hypeMemeMarket.getAddress())).eq(multiply_amount_3);

      expect(await info.hypeMemeMarket.balanceOf(tidT1, user1.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT1, user2.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT1, nftOwnerT1.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT1, nftOwnerT2.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT1, info.mortgageFeeWallet.address)).eq(0);

      expect(await info.hypeMemeMarket.balanceOf(tidT2, user1.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT2, user2.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT2, nftOwnerT1.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT2, nftOwnerT2.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT2, info.mortgageFeeWallet.address)).eq(0);

      expect(nftOwnerT1_payToken_add_3).eq(0);

      expect(curve_mortgage_3 / mortgage_fee_payToken_add_3).eq(250);

      expect(curve_buy_3 / nftOwnerT2_payToken_add_3).eq(100);

      expect(user2_payToken_3).eq(user2_payToken_2);

      expect(market_payToken_add_3).eq(
        user1_payToken_2 - user1_payToken_3 - mortgage_fee_payToken_add_3 - nftOwnerT2_payToken_add_3 - tnftOwnerT2_payToken_add_3,
      );
      expect(market_payToken_add_3)
        .eq(curve_buy_3 - curve_mortgage_3)
        .eq(0);

      // user1 multiply t2 40000 tokenid=4
      let result_4 = await info.hypeMemeMarket
        .connect(user1)
        .multiply.staticCall(tidT2, multiply_amount_4);
      await info.hypeMemeMarket
        .connect(user1)
        .multiply(tidT2, multiply_amount_4);

      let user1_payToken_4 = await info.point.balanceOf(user1.address);
      let user2_payToken_4 = await info.point.balanceOf(user2.address);
      let nftOwnerT1_payToken_4 = await info.point.balanceOf(nftOwnerT1.address);
      let tnftOwnerT1_payToken_4 = await info.point.balanceOf(info.hypeMemeFundRecipientWallet.address);
      let nftOwnerT2_payToken_4 = await info.point.balanceOf(nftOwnerT2.address);
      let tnftOwnerT2_payToken_4 = await info.point.balanceOf(info.hypeMemeFundRecipientWallet.address);
      let mortgage_fee_payToken_4 = await info.point.balanceOf(info.mortgageFeeWallet.address);
      let market_payToken_4 = await info.point.balanceOf(info.hypeMemeMarket.getAddress());

      let market_payToken_add_4 = market_payToken_4 - market_payToken_3;
      let mortgage_fee_payToken_add_4 = mortgage_fee_payToken_4 - mortgage_fee_payToken_3;

      let nftOwnerT1_payToken_add_4 = nftOwnerT1_payToken_4 - nftOwnerT1_payToken_3;
      let nftOwnerT2_payToken_add_4 = nftOwnerT2_payToken_4 - nftOwnerT2_payToken_3;
      let tnftOwnerT2_payToken_add_4 = tnftOwnerT2_payToken_4 - tnftOwnerT2_payToken_3;

      let curve_mortgage_4 = await info.hypeMemeMarket.getPayTokenAmount(0, multiply_amount_4);
      let curve_buy_4 = await info.hypeMemeMarket.getPayTokenAmount(multiply_amount_3, multiply_amount_4);

      // check
      expect(result_4.nftTokenId).eq(4);

      expect(await info.hypeMemeMarket.totalSupply(tidT1)).eq(multiply_amount_1 + multiply_amount_2);
      expect(await info.hypeMemeMarket.totalSupply(tidT2)).eq(multiply_amount_3 + multiply_amount_4);

      expect(await info.hypeMemeMarket.balanceOf(tidT1, await info.hypeMemeMarket.getAddress())).eq(
        multiply_amount_1 + multiply_amount_2,
      );
      expect(await info.hypeMemeMarket.balanceOf(tidT2, await info.hypeMemeMarket.getAddress())).eq(
        multiply_amount_3 + multiply_amount_4,
      );

      expect(await info.hypeMemeMarket.balanceOf(tidT1, user1.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT1, user2.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT1, nftOwnerT1.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT1, nftOwnerT2.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT1, info.mortgageFeeWallet.address)).eq(0);

      expect(await info.hypeMemeMarket.balanceOf(tidT2, user1.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT2, user2.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT2, nftOwnerT1.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT2, nftOwnerT2.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT2, info.mortgageFeeWallet.address)).eq(0);

      expect(nftOwnerT1_payToken_add_4).eq(0);

      expect(curve_mortgage_4 / mortgage_fee_payToken_add_4).eq(250);

      expect(curve_buy_4 / nftOwnerT2_payToken_add_4).eq(100);

      expect(user2_payToken_4).eq(user2_payToken_3);

      expect(market_payToken_add_4).eq(
        user1_payToken_3 - user1_payToken_4 - mortgage_fee_payToken_add_4 - nftOwnerT2_payToken_add_4 - tnftOwnerT2_payToken_add_4,
      );
      expect(market_payToken_add_4)
        .eq(curve_buy_4 - curve_mortgage_4)
        .gt(0);
      // user2 multiply t1 15000 tokenid=5
      let result_5 = await info.hypeMemeMarket
        .connect(user2)
        .multiply.staticCall(tidT1, multiply_amount_5);
      await info.hypeMemeMarket
        .connect(user2)
        .multiply(tidT1, multiply_amount_5);

      let user1_payToken_5 = await info.point.balanceOf(user1.address);
      let user2_payToken_5 = await info.point.balanceOf(user2.address);
      let nftOwnerT1_payToken_5 = await info.point.balanceOf(nftOwnerT1.address);
      let tnftOwnerT1_payToken_5 = await info.point.balanceOf(info.hypeMemeFundRecipientWallet.address);
      let nftOwnerT2_payToken_5 = await info.point.balanceOf(nftOwnerT2.address);
      let mortgage_fee_payToken_5 = await info.point.balanceOf(info.mortgageFeeWallet.address);
      let market_payToken_5 = await info.point.balanceOf(info.hypeMemeMarket.getAddress());

      let market_payToken_add_5 = market_payToken_5 - market_payToken_4;
      let mortgage_fee_payToken_add_5 = mortgage_fee_payToken_5 - mortgage_fee_payToken_4;

      let nftOwnerT1_payToken_add_5 = nftOwnerT1_payToken_5 - nftOwnerT1_payToken_4;
      let tnftOwnerT1_payToken_add_5 = tnftOwnerT1_payToken_5 - tnftOwnerT1_payToken_4;
      let nftOwnerT2_payToken_add_5 = nftOwnerT2_payToken_5 - nftOwnerT2_payToken_4;

      let curve_mortgage_5 = await info.hypeMemeMarket.getPayTokenAmount(0, multiply_amount_5);
      let curve_buy_5 = await info.hypeMemeMarket.getPayTokenAmount(multiply_amount_1 + multiply_amount_2, multiply_amount_5);

      // check
      expect(result_5.nftTokenId).eq(5);

      expect(await info.hypeMemeMarket.totalSupply(tidT1)).eq(
        multiply_amount_1 + multiply_amount_2 + multiply_amount_5,
      );
      expect(await info.hypeMemeMarket.totalSupply(tidT2)).eq(multiply_amount_3 + multiply_amount_4);

      expect(await info.hypeMemeMarket.balanceOf(tidT1, await info.hypeMemeMarket.getAddress())).eq(
        multiply_amount_1 + multiply_amount_2 + multiply_amount_5,
      );
      expect(await info.hypeMemeMarket.balanceOf(tidT2, await info.hypeMemeMarket.getAddress())).eq(
        multiply_amount_3 + multiply_amount_4,
      );

      expect(await info.hypeMemeMarket.balanceOf(tidT1, user1.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT1, user2.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT1, nftOwnerT1.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT1, nftOwnerT2.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT1, info.mortgageFeeWallet.address)).eq(0);

      expect(await info.hypeMemeMarket.balanceOf(tidT2, user1.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT2, user2.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT2, nftOwnerT1.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT2, nftOwnerT2.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT2, info.mortgageFeeWallet.address)).eq(0);

      expect(nftOwnerT2_payToken_add_5).eq(0);

      expect(curve_mortgage_5 / mortgage_fee_payToken_add_5).eq(250);

      expect(curve_buy_5 / nftOwnerT1_payToken_add_5).eq(100);

      expect(user1_payToken_5).eq(user1_payToken_4);

      expect(market_payToken_add_5).eq(
        user2_payToken_4 - user2_payToken_5 - mortgage_fee_payToken_add_5 - nftOwnerT1_payToken_add_5 - tnftOwnerT1_payToken_add_5,
      );
      expect(market_payToken_add_5)
        .eq(curve_buy_5 - curve_mortgage_5)
        .gt(0);

      // user2 multiply t1 25000 tokenid=6
      let result_6 = await info.hypeMemeMarket
        .connect(user2)
        .multiply.staticCall(tidT1, multiply_amount_6);
      await info.hypeMemeMarket
        .connect(user2)
        .multiply(tidT1, multiply_amount_6);

      let user1_payToken_6 = await info.point.balanceOf(user1.address);
      let user2_payToken_6 = await info.point.balanceOf(user2.address);
      let nftOwnerT1_payToken_6 = await info.point.balanceOf(nftOwnerT1.address);
      let tnftOwnerT1_payToken_6 = await info.point.balanceOf(info.hypeMemeFundRecipientWallet.address);
      let nftOwnerT2_payToken_6 = await info.point.balanceOf(nftOwnerT2.address);
      let tnftOwnerT2_payToken_6 = await info.point.balanceOf(info.hypeMemeFundRecipientWallet.address);
      let mortgage_fee_payToken_6 = await info.point.balanceOf(info.mortgageFeeWallet.address);
      let market_payToken_6 = await info.point.balanceOf(info.hypeMemeMarket.getAddress());

      let market_payToken_add_6 = market_payToken_6 - market_payToken_5;
      let mortgage_fee_payToken_add_6 = mortgage_fee_payToken_6 - mortgage_fee_payToken_5;

      let nftOwnerT1_payToken_add_6 = nftOwnerT1_payToken_6 - nftOwnerT1_payToken_5;
      let tnftOwnerT1_payToken_add_6 = tnftOwnerT1_payToken_6 - tnftOwnerT1_payToken_5;
      let nftOwnerT2_payToken_add_6 = nftOwnerT2_payToken_6 - nftOwnerT2_payToken_5;

      let curve_mortgage_6 = await info.hypeMemeMarket.getPayTokenAmount(0, multiply_amount_6);
      let curve_buy_6 = await info.hypeMemeMarket.getPayTokenAmount(
        multiply_amount_1 + multiply_amount_2 + multiply_amount_5,
        multiply_amount_6,
      );

      // check
      expect(result_6.nftTokenId).eq(6);

      expect(await info.hypeMemeMarket.totalSupply(tidT1)).eq(
        multiply_amount_1 + multiply_amount_2 + multiply_amount_5 + multiply_amount_6,
      );
      expect(await info.hypeMemeMarket.totalSupply(tidT2)).eq(multiply_amount_3 + multiply_amount_4);

      expect(await info.hypeMemeMarket.balanceOf(tidT1, await info.hypeMemeMarket.getAddress())).eq(
        multiply_amount_1 + multiply_amount_2 + multiply_amount_5 + multiply_amount_6,
      );
      expect(await info.hypeMemeMarket.balanceOf(tidT2, await info.hypeMemeMarket.getAddress())).eq(
        multiply_amount_3 + multiply_amount_4,
      );

      expect(await info.hypeMemeMarket.balanceOf(tidT1, user1.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT1, user2.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT1, nftOwnerT1.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT1, nftOwnerT2.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT1, info.mortgageFeeWallet.address)).eq(0);

      expect(await info.hypeMemeMarket.balanceOf(tidT2, user1.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT2, user2.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT2, nftOwnerT1.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT2, nftOwnerT2.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT2, info.mortgageFeeWallet.address)).eq(0);

      expect(nftOwnerT2_payToken_add_6).eq(0);

      expect(curve_mortgage_6 / mortgage_fee_payToken_add_6).eq(250);

      expect(curve_buy_6 / nftOwnerT1_payToken_add_6).eq(100);

      expect(user1_payToken_6).eq(user1_payToken_5);

      expect(market_payToken_add_6).eq(
        user2_payToken_5 - user2_payToken_6 - mortgage_fee_payToken_add_6 - nftOwnerT1_payToken_add_6 - tnftOwnerT1_payToken_add_6,
      );
      expect(market_payToken_add_6)
        .eq(curve_buy_6 - curve_mortgage_6)
        .gt(0);

      // user2 multiply t2 35000 tokenid=7
      let result_7 = await info.hypeMemeMarket
        .connect(user2)
        .multiply.staticCall(tidT2, multiply_amount_7);
      await info.hypeMemeMarket
        .connect(user2)
        .multiply(tidT2, multiply_amount_7);


      let user1_payToken_7 = await info.point.balanceOf(user1.address);
      let user2_payToken_7 = await info.point.balanceOf(user2.address);
      let nftOwnerT1_payToken_7 = await info.point.balanceOf(nftOwnerT1.address);
      let tnftOwnerT1_payToken_7 = await info.point.balanceOf(info.hypeMemeFundRecipientWallet.address);
      let nftOwnerT2_payToken_7 = await info.point.balanceOf(nftOwnerT2.address);
      let tnftOwnerT2_payToken_7 = await info.point.balanceOf(info.hypeMemeFundRecipientWallet.address);
      let mortgage_fee_payToken_7 = await info.point.balanceOf(info.mortgageFeeWallet.address);
      let market_payToken_7 = await info.point.balanceOf(info.hypeMemeMarket.getAddress());

      let market_payToken_add_7 = market_payToken_7 - market_payToken_6;
      let mortgage_fee_payToken_add_7 = mortgage_fee_payToken_7 - mortgage_fee_payToken_6;

      let nftOwnerT1_payToken_add_7 = nftOwnerT1_payToken_7 - nftOwnerT1_payToken_6;
      let nftOwnerT2_payToken_add_7 = nftOwnerT2_payToken_7 - nftOwnerT2_payToken_6;
      let tnftOwnerT2_payToken_add_7 = tnftOwnerT2_payToken_7 - tnftOwnerT2_payToken_6;

      let curve_mortgage_7 = await info.hypeMemeMarket.getPayTokenAmount(0, multiply_amount_7);
      let curve_buy_7 = await info.hypeMemeMarket.getPayTokenAmount(multiply_amount_3 + multiply_amount_4, multiply_amount_7);
      // check
      expect(result_7.nftTokenId).eq(7);

      expect(await info.hypeMemeMarket.totalSupply(tidT1)).eq(
        multiply_amount_1 + multiply_amount_2 + multiply_amount_5 + multiply_amount_6,
      );
      expect(await info.hypeMemeMarket.totalSupply(tidT2)).eq(
        multiply_amount_3 + multiply_amount_4 + multiply_amount_7,
      );

      expect(await info.hypeMemeMarket.balanceOf(tidT1, await info.hypeMemeMarket.getAddress())).eq(
        multiply_amount_1 + multiply_amount_2 + multiply_amount_5 + multiply_amount_6,
      );
      expect(await info.hypeMemeMarket.balanceOf(tidT2, await info.hypeMemeMarket.getAddress())).eq(
        multiply_amount_3 + multiply_amount_4 + multiply_amount_7,
      );

      expect(await info.hypeMemeMarket.balanceOf(tidT1, user1.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT1, user2.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT1, nftOwnerT1.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT1, nftOwnerT2.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT1, info.mortgageFeeWallet.address)).eq(0);

      expect(await info.hypeMemeMarket.balanceOf(tidT2, user1.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT2, user2.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT2, nftOwnerT1.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT2, nftOwnerT2.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT2, info.mortgageFeeWallet.address)).eq(0);

      expect(nftOwnerT1_payToken_add_7).eq(0);

      expect(curve_mortgage_7 / mortgage_fee_payToken_add_7).eq(250);

      expect(curve_buy_7 / nftOwnerT2_payToken_add_7).eq(100);

      expect(user1_payToken_7).eq(user1_payToken_6);

      expect(market_payToken_add_7).eq(
        user2_payToken_6 - user2_payToken_7 - mortgage_fee_payToken_add_7 - nftOwnerT2_payToken_add_7 - tnftOwnerT2_payToken_add_7,
      );
      expect(market_payToken_add_7)
        .eq(curve_buy_7 - curve_mortgage_7)
        .gt(0);

      // user2 multiply t2 45000 tokenid=8
      let result_8 = await info.hypeMemeMarket
        .connect(user2)
        .multiply.staticCall(tidT2, multiply_amount_8);
      await info.hypeMemeMarket
        .connect(user2)
        .multiply(tidT2, multiply_amount_8);

      let user1_payToken_8 = await info.point.balanceOf(user1.address);
      let user2_payToken_8 = await info.point.balanceOf(user2.address);
      let nftOwnerT1_payToken_8 = await info.point.balanceOf(nftOwnerT1.address);
      let tnftOwnerT1_payToken_8 = await info.point.balanceOf(info.hypeMemeFundRecipientWallet.address);
      let nftOwnerT2_payToken_8 = await info.point.balanceOf(nftOwnerT2.address);
      let tnftOwnerT2_payToken_8 = await info.point.balanceOf(info.hypeMemeFundRecipientWallet.address);
      let mortgage_fee_payToken_8 = await info.point.balanceOf(info.mortgageFeeWallet.address);
      let market_payToken_8 = await info.point.balanceOf(info.hypeMemeMarket.getAddress());

      let market_payToken_add_8 = market_payToken_8 - market_payToken_7;
      let mortgage_fee_payToken_add_8 = mortgage_fee_payToken_8 - mortgage_fee_payToken_7;

      let nftOwnerT1_payToken_add_8 = nftOwnerT1_payToken_8 - nftOwnerT1_payToken_7;
      let nftOwnerT2_payToken_add_8 = nftOwnerT2_payToken_8 - nftOwnerT2_payToken_7;
      let tnftOwnerT2_payToken_add_8 = tnftOwnerT2_payToken_8 - tnftOwnerT2_payToken_7;

      let curve_mortgage_8 = await info.hypeMemeMarket.getPayTokenAmount(0, multiply_amount_8);
      let curve_buy_8 = await info.hypeMemeMarket.getPayTokenAmount(
        multiply_amount_3 + multiply_amount_4 + multiply_amount_7,
        multiply_amount_8,
      );

      // check
      expect(result_8.nftTokenId).eq(8);

      expect(await info.hypeMemeMarket.totalSupply(tidT1)).eq(
        multiply_amount_1 + multiply_amount_2 + multiply_amount_5 + multiply_amount_6,
      );
      expect(await info.hypeMemeMarket.totalSupply(tidT2)).eq(
        multiply_amount_3 + multiply_amount_4 + multiply_amount_7 + multiply_amount_8,
      );

      expect(await info.hypeMemeMarket.balanceOf(tidT1, await info.hypeMemeMarket.getAddress())).eq(
        multiply_amount_1 + multiply_amount_2 + multiply_amount_5 + multiply_amount_6,
      );
      expect(await info.hypeMemeMarket.balanceOf(tidT2, await info.hypeMemeMarket.getAddress())).eq(
        multiply_amount_3 + multiply_amount_4 + multiply_amount_7 + multiply_amount_8,
      );

      expect(await info.hypeMemeMarket.balanceOf(tidT1, user1.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT1, user2.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT1, nftOwnerT1.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT1, nftOwnerT2.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT1, info.mortgageFeeWallet.address)).eq(0);

      expect(await info.hypeMemeMarket.balanceOf(tidT2, user1.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT2, user2.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT2, nftOwnerT1.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT2, nftOwnerT2.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT2, info.mortgageFeeWallet.address)).eq(0);

      expect(nftOwnerT1_payToken_add_8).eq(0);

      expect(curve_mortgage_8 / mortgage_fee_payToken_add_8).eq(250);

      expect(curve_buy_8 / nftOwnerT2_payToken_add_8).eq(100);

      expect(user1_payToken_8).eq(user1_payToken_7);

      expect(market_payToken_add_8).eq(
        user2_payToken_7 - user2_payToken_8 - mortgage_fee_payToken_add_8 - nftOwnerT2_payToken_add_8 - tnftOwnerT2_payToken_add_8,
      );
      expect(market_payToken_add_8)
        .eq(curve_buy_8 - curve_mortgage_8)
        .gt(0);

      // user1 multiplyAdd t1 20000 tokenid=1
      let result_add_1 = await info.hypeMemeMarket
        .connect(user1)
        .multiplyAdd.staticCall(result_1.nftTokenId, multiply_add_amount_1);
      await info.hypeMemeMarket
        .connect(user1)
        .multiplyAdd(result_1.nftTokenId, multiply_add_amount_1);

      let user1_payToken_9 = await info.point.balanceOf(user1.address);
      let user2_payToken_9 = await info.point.balanceOf(user2.address);
      let nftOwnerT1_payToken_9 = await info.point.balanceOf(nftOwnerT1.address);
      let tnftOwnerT1_payToken_9 = await info.point.balanceOf(info.hypeMemeFundRecipientWallet.address);
      let nftOwnerT2_payToken_9 = await info.point.balanceOf(nftOwnerT2.address);
      let mortgage_fee_payToken_9 = await info.point.balanceOf(info.mortgageFeeWallet.address);
      let market_payToken_9 = await info.point.balanceOf(info.hypeMemeMarket.getAddress());

      let market_payToken_add_9 = market_payToken_9 - market_payToken_8;
      let mortgage_fee_payToken_add_9 = mortgage_fee_payToken_9 - mortgage_fee_payToken_8;

      let nftOwnerT1_payToken_add_9 = nftOwnerT1_payToken_9 - nftOwnerT1_payToken_8;
      let tnftOwnerT1_payToken_add_9 = tnftOwnerT1_payToken_9 - tnftOwnerT1_payToken_8;
      let nftOwnerT2_payToken_add_9 = nftOwnerT2_payToken_9 - nftOwnerT2_payToken_8;

      let curve_mortgage_9 = await info.hypeMemeMarket.getPayTokenAmount(multiply_amount_1, multiply_add_amount_1);
      let curve_buy_9 = await info.hypeMemeMarket.getPayTokenAmount(
        multiply_amount_1 + multiply_amount_2 + multiply_amount_5 + multiply_amount_6,
        multiply_add_amount_1,
      );
      // check
      expect(await info.hypeMemeMarket.totalSupply(tidT1)).eq(
        multiply_amount_1 + multiply_amount_2 + multiply_amount_5 + multiply_amount_6 + multiply_add_amount_1,
      );
      expect(await info.hypeMemeMarket.totalSupply(tidT2)).eq(
        multiply_amount_3 + multiply_amount_4 + multiply_amount_7 + multiply_amount_8,
      );

      expect(await info.hypeMemeMarket.balanceOf(tidT1, await info.hypeMemeMarket.getAddress())).eq(
        multiply_amount_1 + multiply_amount_2 + multiply_amount_5 + multiply_amount_6 + multiply_add_amount_1,
      );
      expect(await info.hypeMemeMarket.balanceOf(tidT2, await info.hypeMemeMarket.getAddress())).eq(
        multiply_amount_3 + multiply_amount_4 + multiply_amount_7 + multiply_amount_8,
      );

      expect(await info.hypeMemeMarket.balanceOf(tidT1, user1.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT1, user2.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT1, nftOwnerT1.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT1, nftOwnerT2.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT1, info.mortgageFeeWallet.address)).eq(0);

      expect(await info.hypeMemeMarket.balanceOf(tidT2, user1.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT2, user2.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT2, nftOwnerT1.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT2, nftOwnerT2.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT2, info.mortgageFeeWallet.address)).eq(0);

      expect(nftOwnerT2_payToken_add_9).eq(0);

      expect(curve_mortgage_9 / mortgage_fee_payToken_add_9).eq(250);

      expect(curve_buy_9 / nftOwnerT1_payToken_add_9).eq(100);

      expect(user2_payToken_9).eq(user2_payToken_8);

      expect(market_payToken_add_9).eq(
        user1_payToken_8 -
        user1_payToken_9 -
        mortgage_fee_payToken_add_9 -
        nftOwnerT1_payToken_add_9 -
        tnftOwnerT1_payToken_add_9,
      );
      expect(market_payToken_add_9)
        .eq(curve_buy_9 - curve_mortgage_9)
        .gt(0);

      // user1 multiplyAdd t1 30000 tokenid=2
      let result_add_2 = await info.hypeMemeMarket
        .connect(user1)
        .multiplyAdd.staticCall(result_2.nftTokenId, multiply_add_amount_2);
      await info.hypeMemeMarket
        .connect(user1)
        .multiplyAdd(result_2.nftTokenId, multiply_add_amount_2);

      let user1_payToken_10 = await info.point.balanceOf(user1.address);
      let user2_payToken_10 = await info.point.balanceOf(user2.address);
      let nftOwnerT1_payToken_10 = await info.point.balanceOf(nftOwnerT1.address);
      let tnftOwnerT1_payToken_10 = await info.point.balanceOf(info.hypeMemeFundRecipientWallet.address);
      let nftOwnerT2_payToken_10 = await info.point.balanceOf(nftOwnerT2.address);
      let tnftOwnerT2_payToken_10 = await info.point.balanceOf(info.hypeMemeFundRecipientWallet.address);
      let mortgage_fee_payToken_10 = await info.point.balanceOf(info.mortgageFeeWallet.address);
      let market_payToken_10 = await info.point.balanceOf(info.hypeMemeMarket.getAddress());

      let market_payToken_add_10 = market_payToken_10 - market_payToken_9;
      let mortgage_fee_payToken_add_10 = mortgage_fee_payToken_10 - mortgage_fee_payToken_9;

      let nftOwnerT1_payToken_add_10 = nftOwnerT1_payToken_10 - nftOwnerT1_payToken_9;
      let tnftOwnerT1_payToken_add_10 = tnftOwnerT1_payToken_10 - tnftOwnerT1_payToken_9;
      let nftOwnerT2_payToken_add_10 = nftOwnerT2_payToken_10 - nftOwnerT2_payToken_9;

      let curve_mortgage_10 = await info.hypeMemeMarket.getPayTokenAmount(multiply_amount_2, multiply_add_amount_2);
      let curve_buy_10 = await info.hypeMemeMarket.getPayTokenAmount(
        multiply_amount_1 + multiply_amount_2 + multiply_amount_5 + multiply_amount_6 + multiply_add_amount_1,
        multiply_add_amount_2,
      );
      // check
      expect(await info.hypeMemeMarket.totalSupply(tidT1)).eq(
        multiply_amount_1 +
        multiply_amount_2 +
        multiply_amount_5 +
        multiply_amount_6 +
        multiply_add_amount_1 +
        multiply_add_amount_2,
      );
      expect(await info.hypeMemeMarket.totalSupply(tidT2)).eq(
        multiply_amount_3 + multiply_amount_4 + multiply_amount_7 + multiply_amount_8,
      );

      expect(await info.hypeMemeMarket.balanceOf(tidT1, await info.hypeMemeMarket.getAddress())).eq(
        multiply_amount_1 +
        multiply_amount_2 +
        multiply_amount_5 +
        multiply_amount_6 +
        multiply_add_amount_1 +
        multiply_add_amount_2,
      );
      expect(await info.hypeMemeMarket.balanceOf(tidT2, await info.hypeMemeMarket.getAddress())).eq(
        multiply_amount_3 + multiply_amount_4 + multiply_amount_7 + multiply_amount_8,
      );

      expect(await info.hypeMemeMarket.balanceOf(tidT1, user1.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT1, user2.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT1, nftOwnerT1.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT1, nftOwnerT2.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT1, info.mortgageFeeWallet.address)).eq(0);

      expect(await info.hypeMemeMarket.balanceOf(tidT2, user1.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT2, user2.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT2, nftOwnerT1.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT2, nftOwnerT2.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT2, info.mortgageFeeWallet.address)).eq(0);

      expect(nftOwnerT2_payToken_add_10).eq(0);

      expect(curve_mortgage_10 / mortgage_fee_payToken_add_10).eq(250);

      expect(curve_buy_10 / nftOwnerT1_payToken_add_10).eq(100);

      expect(user2_payToken_10).eq(user2_payToken_9);

      expect(market_payToken_add_10).eq(
        user1_payToken_9 -
        user1_payToken_10 -
        mortgage_fee_payToken_add_10 -
        nftOwnerT1_payToken_add_10 -
        tnftOwnerT1_payToken_add_10
      );
      expect(market_payToken_add_10)
        .eq(curve_buy_10 - curve_mortgage_10)
        .gt(0);

      // user1 multiplyAdd t2 40000 tokenid=3
      let result_add_3 = await info.hypeMemeMarket
        .connect(user1)
        .multiplyAdd.staticCall(result_3.nftTokenId, multiply_add_amount_3);
      await info.hypeMemeMarket
        .connect(user1)
        .multiplyAdd(result_3.nftTokenId, multiply_add_amount_3);


      let user1_payToken_11 = await info.point.balanceOf(user1.address);
      let user2_payToken_11 = await info.point.balanceOf(user2.address);
      let nftOwnerT1_payToken_11 = await info.point.balanceOf(nftOwnerT1.address);
      let tnftOwnerT1_payToken_11 = await info.point.balanceOf(info.hypeMemeFundRecipientWallet.address);
      let nftOwnerT2_payToken_11 = await info.point.balanceOf(nftOwnerT2.address);
      let tnftOwnerT2_payToken_11 = await info.point.balanceOf(info.hypeMemeFundRecipientWallet.address);
      let mortgage_fee_payToken_11 = await info.point.balanceOf(info.mortgageFeeWallet.address);
      let market_payToken_11 = await info.point.balanceOf(info.hypeMemeMarket.getAddress());

      let market_payToken_add_11 = market_payToken_11 - market_payToken_10;
      let mortgage_fee_payToken_add_11 = mortgage_fee_payToken_11 - mortgage_fee_payToken_10;

      let nftOwnerT1_payToken_add_11 = nftOwnerT1_payToken_11 - nftOwnerT1_payToken_10;
      let tnftOwnerT1_payToken_add_11 = tnftOwnerT1_payToken_11 - tnftOwnerT1_payToken_10;
      let nftOwnerT2_payToken_add_11 = nftOwnerT2_payToken_11 - nftOwnerT2_payToken_10;
      let tnftOwnerT2_payToken_add_11 = tnftOwnerT2_payToken_11 - tnftOwnerT2_payToken_10;

      let curve_mortgage_11 = await info.hypeMemeMarket.getPayTokenAmount(multiply_amount_3, multiply_add_amount_3);
      let curve_buy_11 = await info.hypeMemeMarket.getPayTokenAmount(
        multiply_amount_3 + multiply_amount_4 + multiply_amount_7 + multiply_amount_8,
        multiply_add_amount_3,
      );
      // check
      expect(await info.hypeMemeMarket.totalSupply(tidT1)).eq(
        multiply_amount_1 +
        multiply_amount_2 +
        multiply_amount_5 +
        multiply_amount_6 +
        multiply_add_amount_1 +
        multiply_add_amount_2,
      );
      expect(await info.hypeMemeMarket.totalSupply(tidT2)).eq(
        multiply_amount_3 + multiply_amount_4 + multiply_amount_7 + multiply_amount_8 + multiply_add_amount_3,
      );

      expect(await info.hypeMemeMarket.balanceOf(tidT1, await info.hypeMemeMarket.getAddress())).eq(
        multiply_amount_1 +
        multiply_amount_2 +
        multiply_amount_5 +
        multiply_amount_6 +
        multiply_add_amount_1 +
        multiply_add_amount_2,
      );
      expect(await info.hypeMemeMarket.balanceOf(tidT2, await info.hypeMemeMarket.getAddress())).eq(
        multiply_amount_3 + multiply_amount_4 + multiply_amount_7 + multiply_amount_8 + multiply_add_amount_3,
      );

      expect(await info.hypeMemeMarket.balanceOf(tidT1, user1.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT1, user2.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT1, nftOwnerT1.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT1, nftOwnerT2.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT1, info.mortgageFeeWallet.address)).eq(0);

      expect(await info.hypeMemeMarket.balanceOf(tidT2, user1.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT2, user2.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT2, nftOwnerT1.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT2, nftOwnerT2.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT2, info.mortgageFeeWallet.address)).eq(0);

      expect(nftOwnerT1_payToken_add_11).eq(0);

      expect(curve_mortgage_11 / mortgage_fee_payToken_add_11).eq(250);

      expect(curve_buy_11 / nftOwnerT2_payToken_add_11).eq(100);

      expect(user2_payToken_11).eq(user2_payToken_10);

      expect(market_payToken_add_11).eq(
        user1_payToken_10 -
        user1_payToken_11 -
        mortgage_fee_payToken_add_11 -
        nftOwnerT2_payToken_add_11 -
        tnftOwnerT2_payToken_add_11
      );
      expect(market_payToken_add_11)
        .eq(curve_buy_11 - curve_mortgage_11)
        .gt(0);

      // user1 multiplyAdd t2 50000 tokenid=4
      let result_add_4 = await info.hypeMemeMarket
        .connect(user1)
        .multiplyAdd.staticCall(result_4.nftTokenId, multiply_add_amount_4);
      await info.hypeMemeMarket
        .connect(user1)
        .multiplyAdd(result_4.nftTokenId, multiply_add_amount_4);

      let user1_payToken_12 = await info.point.balanceOf(user1.address);
      let user2_payToken_12 = await info.point.balanceOf(user2.address);
      let nftOwnerT1_payToken_12 = await info.point.balanceOf(nftOwnerT1.address);
      let tnftOwnerT1_payToken_12 = await info.point.balanceOf(info.hypeMemeFundRecipientWallet.address);
      let nftOwnerT2_payToken_12 = await info.point.balanceOf(nftOwnerT2.address);
      let tnftOwnerT2_payToken_12 = await info.point.balanceOf(info.hypeMemeFundRecipientWallet.address);
      let mortgage_fee_payToken_12 = await info.point.balanceOf(info.mortgageFeeWallet.address);
      let market_payToken_12 = await info.point.balanceOf(info.hypeMemeMarket.getAddress());

      let market_payToken_add_12 = market_payToken_12 - market_payToken_11;
      let mortgage_fee_payToken_add_12 = mortgage_fee_payToken_12 - mortgage_fee_payToken_11;

      let nftOwnerT1_payToken_add_12 = nftOwnerT1_payToken_12 - nftOwnerT1_payToken_11;
      let tnftOwnerT1_payToken_add_12 = tnftOwnerT1_payToken_12 - tnftOwnerT1_payToken_11;
      let nftOwnerT2_payToken_add_12 = nftOwnerT2_payToken_12 - nftOwnerT2_payToken_11;
      let tnftOwnerT2_payToken_add_12 = tnftOwnerT2_payToken_12 - tnftOwnerT2_payToken_11;

      let curve_mortgage_12 = await info.hypeMemeMarket.getPayTokenAmount(multiply_amount_4, multiply_add_amount_4);
      let curve_buy_12 = await info.hypeMemeMarket.getPayTokenAmount(
        multiply_amount_3 + multiply_amount_4 + multiply_amount_7 + multiply_amount_8 + multiply_add_amount_3,
        multiply_add_amount_4,
      );
      // check
      expect(await info.hypeMemeMarket.totalSupply(tidT1)).eq(
        multiply_amount_1 +
        multiply_amount_2 +
        multiply_amount_5 +
        multiply_amount_6 +
        multiply_add_amount_1 +
        multiply_add_amount_2,
      );
      expect(await info.hypeMemeMarket.totalSupply(tidT2)).eq(
        multiply_amount_3 +
        multiply_amount_4 +
        multiply_amount_7 +
        multiply_amount_8 +
        multiply_add_amount_3 +
        multiply_add_amount_4,
      );

      expect(await info.hypeMemeMarket.balanceOf(tidT1, await info.hypeMemeMarket.getAddress())).eq(
        multiply_amount_1 +
        multiply_amount_2 +
        multiply_amount_5 +
        multiply_amount_6 +
        multiply_add_amount_1 +
        multiply_add_amount_2,
      );
      expect(await info.hypeMemeMarket.balanceOf(tidT2, await info.hypeMemeMarket.getAddress())).eq(
        multiply_amount_3 +
        multiply_amount_4 +
        multiply_amount_7 +
        multiply_amount_8 +
        multiply_add_amount_3 +
        multiply_add_amount_4,
      );

      expect(await info.hypeMemeMarket.balanceOf(tidT1, user1.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT1, user2.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT1, nftOwnerT1.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT1, nftOwnerT2.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT1, info.mortgageFeeWallet.address)).eq(0);

      expect(await info.hypeMemeMarket.balanceOf(tidT2, user1.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT2, user2.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT2, nftOwnerT1.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT2, nftOwnerT2.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT2, info.mortgageFeeWallet.address)).eq(0);

      expect(nftOwnerT1_payToken_add_12).eq(0);

      expect(curve_mortgage_12 / mortgage_fee_payToken_add_12).eq(250);

      expect(curve_buy_12 / nftOwnerT2_payToken_add_12).eq(100);

      expect(user2_payToken_12).eq(user2_payToken_11);

      expect(market_payToken_add_12).eq(
        user1_payToken_11 -
        user1_payToken_12 -
        mortgage_fee_payToken_add_12 -
        nftOwnerT2_payToken_add_12 -
        tnftOwnerT2_payToken_add_12,
      );
      expect(market_payToken_add_12)
        .eq(curve_buy_12 - curve_mortgage_12)
        .gt(0);
      // user2 multiplyAdd t1 25000 tokenid=5
      let result_add_5 = await info.hypeMemeMarket
        .connect(user2)
        .multiplyAdd.staticCall(result_5.nftTokenId, multiply_add_amount_5);
      await info.hypeMemeMarket
        .connect(user2)
        .multiplyAdd(result_5.nftTokenId, multiply_add_amount_5);

      let user1_payToken_13 = await info.point.balanceOf(user1.address);
      let user2_payToken_13 = await info.point.balanceOf(user2.address);
      let nftOwnerT1_payToken_13 = await info.point.balanceOf(nftOwnerT1.address);
      let tnftOwnerT1_payToken_13 = await info.point.balanceOf(info.hypeMemeFundRecipientWallet.address);
      let nftOwnerT2_payToken_13 = await info.point.balanceOf(nftOwnerT2.address);
      let mortgage_fee_payToken_13 = await info.point.balanceOf(info.mortgageFeeWallet.address);
      let market_payToken_13 = await info.point.balanceOf(info.hypeMemeMarket.getAddress());

      let market_payToken_add_13 = market_payToken_13 - market_payToken_12;
      let mortgage_fee_payToken_add_13 = mortgage_fee_payToken_13 - mortgage_fee_payToken_12;

      let nftOwnerT1_payToken_add_13 = nftOwnerT1_payToken_13 - nftOwnerT1_payToken_12;
      let tnftOwnerT1_payToken_add_13 = tnftOwnerT1_payToken_13 - tnftOwnerT1_payToken_12;
      let nftOwnerT2_payToken_add_13 = nftOwnerT2_payToken_13 - nftOwnerT2_payToken_12;

      let curve_mortgage_13 = await info.hypeMemeMarket.getPayTokenAmount(multiply_amount_5, multiply_add_amount_5);
      let curve_buy_13 = await info.hypeMemeMarket.getPayTokenAmount(
        multiply_amount_1 +
        multiply_amount_2 +
        multiply_amount_5 +
        multiply_amount_6 +
        multiply_add_amount_1 +
        multiply_add_amount_2,
        multiply_add_amount_5,
      );
      // check
      expect(await info.hypeMemeMarket.totalSupply(tidT1)).eq(
        multiply_amount_1 +
        multiply_amount_2 +
        multiply_amount_5 +
        multiply_amount_6 +
        multiply_add_amount_1 +
        multiply_add_amount_2 +
        multiply_add_amount_5,
      );
      expect(await info.hypeMemeMarket.totalSupply(tidT2)).eq(
        multiply_amount_3 +
        multiply_amount_4 +
        multiply_amount_7 +
        multiply_amount_8 +
        multiply_add_amount_3 +
        multiply_add_amount_4,
      );

      expect(await info.hypeMemeMarket.balanceOf(tidT1, await info.hypeMemeMarket.getAddress())).eq(
        multiply_amount_1 +
        multiply_amount_2 +
        multiply_amount_5 +
        multiply_amount_6 +
        multiply_add_amount_1 +
        multiply_add_amount_2 +
        multiply_add_amount_5,
      );
      expect(await info.hypeMemeMarket.balanceOf(tidT2, await info.hypeMemeMarket.getAddress())).eq(
        multiply_amount_3 +
        multiply_amount_4 +
        multiply_amount_7 +
        multiply_amount_8 +
        multiply_add_amount_3 +
        multiply_add_amount_4,
      );

      expect(await info.hypeMemeMarket.balanceOf(tidT1, user1.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT1, user2.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT1, nftOwnerT1.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT1, nftOwnerT2.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT1, info.mortgageFeeWallet.address)).eq(0);

      expect(await info.hypeMemeMarket.balanceOf(tidT2, user1.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT2, user2.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT2, nftOwnerT1.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT2, nftOwnerT2.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT2, info.mortgageFeeWallet.address)).eq(0);

      expect(nftOwnerT2_payToken_add_13).eq(0);

      expect(curve_mortgage_13 / mortgage_fee_payToken_add_13).eq(250);

      expect(curve_buy_13 / nftOwnerT1_payToken_add_13).eq(100);

      expect(user1_payToken_13).eq(user1_payToken_12);

      expect(market_payToken_add_13).eq(
        user2_payToken_12 -
        user2_payToken_13 -
        mortgage_fee_payToken_add_13 -
        nftOwnerT1_payToken_add_13 -
        tnftOwnerT1_payToken_add_13,
      );
      expect(market_payToken_add_13)
        .eq(curve_buy_13 - curve_mortgage_13)
        .gt(0);

      // user2 multiplyAdd t1 35000 tokenid=6
      let result_add_6 = await info.hypeMemeMarket
        .connect(user2)
        .multiplyAdd.staticCall(result_6.nftTokenId, multiply_add_amount_6);
      await info.hypeMemeMarket
        .connect(user2)
        .multiplyAdd(result_6.nftTokenId, multiply_add_amount_6);

      let user1_payToken_14 = await info.point.balanceOf(user1.address);
      let user2_payToken_14 = await info.point.balanceOf(user2.address);
      let nftOwnerT1_payToken_14 = await info.point.balanceOf(nftOwnerT1.address);
      let tnftOwnerT1_payToken_14 = await info.point.balanceOf(info.hypeMemeFundRecipientWallet.address);
      let nftOwnerT2_payToken_14 = await info.point.balanceOf(nftOwnerT2.address);
      let tnftOwnerT2_payToken_14 = await info.point.balanceOf(info.hypeMemeFundRecipientWallet.address);
      let mortgage_fee_payToken_14 = await info.point.balanceOf(info.mortgageFeeWallet.address);
      let market_payToken_14 = await info.point.balanceOf(info.hypeMemeMarket.getAddress());

      let market_payToken_add_14 = market_payToken_14 - market_payToken_13;
      let mortgage_fee_payToken_add_14 = mortgage_fee_payToken_14 - mortgage_fee_payToken_13;

      let nftOwnerT1_payToken_add_14 = nftOwnerT1_payToken_14 - nftOwnerT1_payToken_13;
      let tnftOwnerT1_payToken_add_14 = tnftOwnerT1_payToken_14 - tnftOwnerT1_payToken_13;
      let nftOwnerT2_payToken_add_14 = nftOwnerT2_payToken_14 - nftOwnerT2_payToken_13;

      let curve_mortgage_14 = await info.hypeMemeMarket.getPayTokenAmount(multiply_amount_6, multiply_add_amount_6);
      let curve_buy_14 = await info.hypeMemeMarket.getPayTokenAmount(
        multiply_amount_1 +
        multiply_amount_2 +
        multiply_amount_5 +
        multiply_amount_6 +
        multiply_add_amount_1 +
        multiply_add_amount_2 +
        multiply_add_amount_5,
        multiply_add_amount_6,
      );
      // check
      expect(await info.hypeMemeMarket.totalSupply(tidT1)).eq(
        multiply_amount_1 +
        multiply_amount_2 +
        multiply_amount_5 +
        multiply_amount_6 +
        multiply_add_amount_1 +
        multiply_add_amount_2 +
        multiply_add_amount_5 +
        multiply_add_amount_6,
      );
      expect(await info.hypeMemeMarket.totalSupply(tidT2)).eq(
        multiply_amount_3 +
        multiply_amount_4 +
        multiply_amount_7 +
        multiply_amount_8 +
        multiply_add_amount_3 +
        multiply_add_amount_4,
      );

      expect(await info.hypeMemeMarket.balanceOf(tidT1, await info.hypeMemeMarket.getAddress())).eq(
        multiply_amount_1 +
        multiply_amount_2 +
        multiply_amount_5 +
        multiply_amount_6 +
        multiply_add_amount_1 +
        multiply_add_amount_2 +
        multiply_add_amount_5 +
        multiply_add_amount_6,
      );
      expect(await info.hypeMemeMarket.balanceOf(tidT2, await info.hypeMemeMarket.getAddress())).eq(
        multiply_amount_3 +
        multiply_amount_4 +
        multiply_amount_7 +
        multiply_amount_8 +
        multiply_add_amount_3 +
        multiply_add_amount_4,
      );

      expect(await info.hypeMemeMarket.balanceOf(tidT1, user1.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT1, user2.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT1, nftOwnerT1.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT1, nftOwnerT2.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT1, info.mortgageFeeWallet.address)).eq(0);

      expect(await info.hypeMemeMarket.balanceOf(tidT2, user1.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT2, user2.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT2, nftOwnerT1.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT2, nftOwnerT2.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT2, info.mortgageFeeWallet.address)).eq(0);

      expect(nftOwnerT2_payToken_add_14).eq(0);

      expect(curve_mortgage_14 / mortgage_fee_payToken_add_14).eq(250);

      expect(curve_buy_14 / nftOwnerT1_payToken_add_14).eq(100);

      expect(user1_payToken_14).eq(user1_payToken_13);

      expect(market_payToken_add_14).eq(
        user2_payToken_13 -
        user2_payToken_14 -
        mortgage_fee_payToken_add_14 -
        nftOwnerT1_payToken_add_14 -
        tnftOwnerT1_payToken_add_14,
      );
      expect(market_payToken_add_14)
        .eq(curve_buy_14 - curve_mortgage_14)
        .gt(0);

      // user2 multiplyAdd t2 45000 tokenid=7
      let result_add_7 = await info.hypeMemeMarket
        .connect(user2)
        .multiplyAdd.staticCall(result_7.nftTokenId, multiply_add_amount_7);
      await info.hypeMemeMarket
        .connect(user2)
        .multiplyAdd(result_7.nftTokenId, multiply_add_amount_7);

      let user1_payToken_15 = await info.point.balanceOf(user1.address);
      let user2_payToken_15 = await info.point.balanceOf(user2.address);
      let nftOwnerT1_payToken_15 = await info.point.balanceOf(nftOwnerT1.address);
      let tnftOwnerT1_payToken_15 = await info.point.balanceOf(info.hypeMemeFundRecipientWallet.address);
      let nftOwnerT2_payToken_15 = await info.point.balanceOf(nftOwnerT2.address);
      let tnftOwnerT2_payToken_15 = await info.point.balanceOf(info.hypeMemeFundRecipientWallet.address);
      let mortgage_fee_payToken_15 = await info.point.balanceOf(info.mortgageFeeWallet.address);
      let market_payToken_15 = await info.point.balanceOf(info.hypeMemeMarket.getAddress());

      let market_payToken_add_15 = market_payToken_15 - market_payToken_14;
      let mortgage_fee_payToken_add_15 = mortgage_fee_payToken_15 - mortgage_fee_payToken_14;

      let nftOwnerT1_payToken_add_15 = nftOwnerT1_payToken_15 - nftOwnerT1_payToken_14;
      let tnftOwnerT1_payToken_add_15 = tnftOwnerT1_payToken_15 - tnftOwnerT1_payToken_14;
      let nftOwnerT2_payToken_add_15 = nftOwnerT2_payToken_15 - nftOwnerT2_payToken_14;
      let tnftOwnerT2_payToken_add_15 = tnftOwnerT2_payToken_15 - tnftOwnerT2_payToken_14;

      let curve_mortgage_15 = await info.hypeMemeMarket.getPayTokenAmount(multiply_amount_7, multiply_add_amount_7);
      let curve_buy_15 = await info.hypeMemeMarket.getPayTokenAmount(
        multiply_amount_3 +
        multiply_amount_4 +
        multiply_amount_7 +
        multiply_amount_8 +
        multiply_add_amount_3 +
        multiply_add_amount_4,
        multiply_add_amount_7,
      );
      // check
      expect(await info.hypeMemeMarket.totalSupply(tidT1)).eq(
        multiply_amount_1 +
        multiply_amount_2 +
        multiply_amount_5 +
        multiply_amount_6 +
        multiply_add_amount_1 +
        multiply_add_amount_2 +
        multiply_add_amount_5 +
        multiply_add_amount_6,
      );
      expect(await info.hypeMemeMarket.totalSupply(tidT2)).eq(
        multiply_amount_3 +
        multiply_amount_4 +
        multiply_amount_7 +
        multiply_amount_8 +
        multiply_add_amount_3 +
        multiply_add_amount_4 +
        multiply_add_amount_7,
      );

      expect(await info.hypeMemeMarket.balanceOf(tidT1, await info.hypeMemeMarket.getAddress())).eq(
        multiply_amount_1 +
        multiply_amount_2 +
        multiply_amount_5 +
        multiply_amount_6 +
        multiply_add_amount_1 +
        multiply_add_amount_2 +
        multiply_add_amount_5 +
        multiply_add_amount_6,
      );
      expect(await info.hypeMemeMarket.balanceOf(tidT2, await info.hypeMemeMarket.getAddress())).eq(
        multiply_amount_3 +
        multiply_amount_4 +
        multiply_amount_7 +
        multiply_amount_8 +
        multiply_add_amount_3 +
        multiply_add_amount_4 +
        multiply_add_amount_7,
      );

      expect(await info.hypeMemeMarket.balanceOf(tidT1, user1.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT1, user2.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT1, nftOwnerT1.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT1, nftOwnerT2.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT1, info.mortgageFeeWallet.address)).eq(0);

      expect(await info.hypeMemeMarket.balanceOf(tidT2, user1.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT2, user2.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT2, nftOwnerT1.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT2, nftOwnerT2.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT2, info.mortgageFeeWallet.address)).eq(0);

      expect(nftOwnerT1_payToken_add_15).eq(0);

      expect(curve_mortgage_15 / mortgage_fee_payToken_add_15).eq(250);

      expect(curve_buy_15 / nftOwnerT2_payToken_add_15).eq(100);

      expect(user1_payToken_15).eq(user1_payToken_14);

      expect(market_payToken_add_15).eq(
        user2_payToken_14 -
        user2_payToken_15 -
        mortgage_fee_payToken_add_15 -
        nftOwnerT2_payToken_add_15 -
        tnftOwnerT2_payToken_add_15,
      );
      expect(market_payToken_add_15)
        .eq(curve_buy_15 - curve_mortgage_15)
        .gt(0);

      // user2 multiplyAdd t2 55000 tokenid=8
      let result_add_8 = await info.hypeMemeMarket
        .connect(user2)
        .multiplyAdd.staticCall(result_8.nftTokenId, multiply_add_amount_8);
      let tx_add_8 = await info.hypeMemeMarket
        .connect(user2)
        .multiplyAdd(result_8.nftTokenId, multiply_add_amount_8);

      let user1_payToken_16 = await info.point.balanceOf(user1.address);
      let user2_payToken_16 = await info.point.balanceOf(user2.address);
      let nftOwnerT1_payToken_16 = await info.point.balanceOf(nftOwnerT1.address);
      let tnftOwnerT1_payToken_16 = await info.point.balanceOf(info.hypeMemeFundRecipientWallet.address);
      let nftOwnerT2_payToken_16 = await info.point.balanceOf(nftOwnerT2.address);
      let tnftOwnerT2_payToken_16 = await info.point.balanceOf(info.hypeMemeFundRecipientWallet.address);
      let mortgage_fee_payToken_16 = await info.point.balanceOf(info.mortgageFeeWallet.address);
      let market_payToken_16 = await info.point.balanceOf(info.hypeMemeMarket.getAddress());

      let market_payToken_add_16 = market_payToken_16 - market_payToken_15;
      let mortgage_fee_payToken_add_16 = mortgage_fee_payToken_16 - mortgage_fee_payToken_15;

      let nftOwnerT1_payToken_add_16 = nftOwnerT1_payToken_16 - nftOwnerT1_payToken_15;
      let tnftOwnerT1_payToken_add_16 = tnftOwnerT1_payToken_16 - tnftOwnerT1_payToken_15;
      let nftOwnerT2_payToken_add_16 = nftOwnerT2_payToken_16 - nftOwnerT2_payToken_15;
      let tnftOwnerT2_payToken_add_16 = tnftOwnerT2_payToken_16 - tnftOwnerT2_payToken_15;

      let curve_mortgage_16 = await info.hypeMemeMarket.getPayTokenAmount(multiply_amount_8, multiply_add_amount_8);
      let curve_buy_16 = await info.hypeMemeMarket.getPayTokenAmount(
        multiply_amount_3 +
        multiply_amount_4 +
        multiply_amount_7 +
        multiply_amount_8 +
        multiply_add_amount_3 +
        multiply_add_amount_4 +
        multiply_add_amount_7,
        multiply_add_amount_8,
      );
      // check
      expect(await info.hypeMemeMarket.totalSupply(tidT1)).eq(
        multiply_amount_1 +
        multiply_amount_2 +
        multiply_amount_5 +
        multiply_amount_6 +
        multiply_add_amount_1 +
        multiply_add_amount_2 +
        multiply_add_amount_5 +
        multiply_add_amount_6,
      );
      expect(await info.hypeMemeMarket.totalSupply(tidT2)).eq(
        multiply_amount_3 +
        multiply_amount_4 +
        multiply_amount_7 +
        multiply_amount_8 +
        multiply_add_amount_3 +
        multiply_add_amount_4 +
        multiply_add_amount_7 +
        multiply_add_amount_8,
      );

      expect(await info.hypeMemeMarket.balanceOf(tidT1, await info.hypeMemeMarket.getAddress())).eq(
        multiply_amount_1 +
        multiply_amount_2 +
        multiply_amount_5 +
        multiply_amount_6 +
        multiply_add_amount_1 +
        multiply_add_amount_2 +
        multiply_add_amount_5 +
        multiply_add_amount_6,
      );
      expect(await info.hypeMemeMarket.balanceOf(tidT2, await info.hypeMemeMarket.getAddress())).eq(
        multiply_amount_3 +
        multiply_amount_4 +
        multiply_amount_7 +
        multiply_amount_8 +
        multiply_add_amount_3 +
        multiply_add_amount_4 +
        multiply_add_amount_7 +
        multiply_add_amount_8,
      );

      expect(await info.hypeMemeMarket.balanceOf(tidT1, user1.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT1, user2.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT1, nftOwnerT1.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT1, nftOwnerT2.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT1, info.mortgageFeeWallet.address)).eq(0);

      expect(await info.hypeMemeMarket.balanceOf(tidT2, user1.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT2, user2.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT2, nftOwnerT1.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT2, nftOwnerT2.address)).eq(0);
      expect(await info.hypeMemeMarket.balanceOf(tidT2, info.mortgageFeeWallet.address)).eq(0);

      expect(nftOwnerT1_payToken_add_16).eq(0);

      expect(curve_mortgage_16 / mortgage_fee_payToken_add_16).eq(250);

      expect(curve_buy_16 / nftOwnerT2_payToken_add_16).eq(100);

      expect(user1_payToken_16).eq(user1_payToken_15);

      expect(market_payToken_add_16).eq(
        user2_payToken_15 -
        user2_payToken_16 -
        mortgage_fee_payToken_add_16 -
        nftOwnerT2_payToken_add_16 -
        tnftOwnerT2_payToken_add_16,
      );
      expect(market_payToken_add_16)
        .eq(curve_buy_16 - curve_mortgage_16)
        .gt(0);
    });

    it("multiply table", async function () {
      let amounts = [
        "83333.333",
        "153846.154",
        "214285.714",
        "266666.667",
        "312500.0",
        "352941.176",
        "388888.889",
        "421052.63",
        "450000.002",
        "476190.476",
        "645161.293",
        "731707.318",
        "784313.726",
        "819672.133",
        "845070.429",
        "864197.531",
        "879120.875",
        "891089.11",
        "900900.901",
        "947867.299",
        "964630.225",
        "973236.003",
        "978473.578",
        "981996.727",
        "984528.836",
        "986436.498",
        "987925.353",
        "989119.684",
        "994530.085",
        "996346.729",
        "997257.542",
        "997804.83",
        "998170.022",
        "998431.038",
        "998626.888",
        "998779.27",
        "998901.21",
        "999450.304",
        "999633.468",
        "999725.076",
        "999780.052",
        "999816.706",
        "999842.882",
        "999862.52",
        "999877.798",
      ];

      let data = [];
      for (let i = 0; i < amounts.length; i++) {
        let wei = BigInt(10) ** BigInt(18);
        let amount = new Decimal(amounts[i]).times(new Decimal(wei.toString())).toFixed(0);

        const info = (await loadFixture(deployAllContracts)).hypeMemeAllContractInfo;
        await info.hypeMeme.setSystemReady(true)
        await info.degenGateInfo.foundry.setMortgageFee(info.hypeMemeAppId, info.mortgageFee)

        let nftOwnerT1 = info.wallets[info.nextWalletIndex + 1];
        let user1 = info.wallets[info.nextWalletIndex + 3];

        let count = BigInt(10) ** BigInt(18) * BigInt(100000000);
        await info.mockDegen.transfer(user1.address, count)

        await info.mockDegen.approve(await info.degenGateInfo.degenGate.getAddress(), MAX_UINT256)
        await info.mockDegen.connect(user1).approve(await info.degenGateInfo.degenGate.getAddress(), MAX_UINT256)
        await info.degenGateInfo.degenGate.degenToPoint(count)
        await info.degenGateInfo.degenGate.connect(user1).degenToPoint(count)

        await info.point.approve(await info.hypeMemeMarket.getAddress(), MAX_UINT256)
        await info.point.connect(user1).approve(await info.hypeMemeMarket.getAddress(), MAX_UINT256)

        await info.mockDegen.approve(await info.hypeMeme.getAddress(), MAX_UINT256)

        let paramsT1 = {
          info: {
            name: "name_t1",
            ticker: "ticker_t1",
            description: "description_t1",
            image: "image_t1",
            twitterLink: "twitter_link_t1",
            telegramLink: "telegram_link_t1",
            warpcastLink: "warpcast_link_t1",
            website: "website_t1"
          }
        };

        let tidT1 = paramsT1.info.ticker
        await info.hypeMeme
          .createToken(paramsT1.info);
        await info.hypeMemePublicNFT.transferFrom(info.deployWallet.address, nftOwnerT1.address, 1)

        let mortgage_fee_payToken_1 = await info.point.balanceOf(info.mortgageFeeWallet.address);

        // multiply
        let result = await info.hypeMemeMarket
          .connect(user1)
          .multiply.staticCall(tidT1, amount);
        await info.hypeMemeMarket.connect(user1).multiply(tidT1, amount);

        let mortgage_fee_payToken_2 = await info.point.balanceOf(info.mortgageFeeWallet.address);

        let mortgage_fee_payToken_add = mortgage_fee_payToken_2 - mortgage_fee_payToken_1;

        // xxx
        let payToken = new Decimal(result.payTokenAmount.toString()).dividedBy(new Decimal(wei.toString())).toFixed(3);

        // 10**49 / ((10**25 - x)**2)
        let a = BigInt(10) ** BigInt(49);
        let b = (BigInt(10) ** BigInt(25) - BigInt(amount)) ** BigInt(2);
        let price = new Decimal(a.toString()).dividedBy(new Decimal(b.toString())).toFixed(7);

        let mcapWei = await info.hypeMemeCurve.curveMath(0, amount);
        let mcap = new Decimal(mcapWei.toString()).dividedBy(new Decimal(wei.toString())).toFixed(3);

        let pst = new Decimal(amount.toString()).dividedBy(new Decimal(wei.toString())).toFixed(3);

        let mfeeWei = mortgage_fee_payToken_add;
        let mfee = new Decimal(mfeeWei.toString()).dividedBy(new Decimal(wei.toString())).toFixed(3);

        data.push({
          payToken: payToken,
          price: price,
          mcap: mcap,
          pst: pst,
          mfee: mfee,
        });
      }
      console.log(data);
    });
  });
});
