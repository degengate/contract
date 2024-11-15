import { deployAllContracts, MAX_UINT256 } from "./shared/deploy";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import Decimal from "decimal.js";

describe("HypeMeme.Market", function () {
  describe("buy", function () {
    let data = [
      {
        expectNeedPayToken: BigInt("101600010160001016"), // 0.101
        buyAmount: 1,
      },
      {
        expectNeedPayToken: BigInt("1016001016001016001"), // 1.016
        buyAmount: 10,
      },
      {
        expectNeedPayToken: BigInt("10160101601016010160"), // 10.16
        buyAmount: 100,
      },
      {
        expectNeedPayToken: BigInt("101610161016101610161"), // 101.61
        buyAmount: 1000,
      },
      {
        expectNeedPayToken: BigInt("1017017017017017017017"), // 1017.01
        buyAmount: 10000,
      },
      {
        expectNeedPayToken: BigInt("10262626262626262626262"), // 10,262.626
        buyAmount: 100000,
      },
      {
        expectNeedPayToken: BigInt("53473684210526315789472"), // 53,473
        buyAmount: 500000,
      },
      {
        expectNeedPayToken: BigInt("112888888888888888888888"), // 112,888
        buyAmount: 1000000,
      },
      {
        expectNeedPayToken: BigInt("254000000000000000000000"), // 254,000
        buyAmount: 2000000,
      },
      {
        expectNeedPayToken: BigInt("435428571428571428571427"), // 435,428
        buyAmount: 3000000,
      },
      {
        expectNeedPayToken: BigInt("677333333333333333333331"), // 677,333
        buyAmount: 4000000,
      },
      {
        expectNeedPayToken: BigInt("1016000000000000000000000"), // 1,016,000
        buyAmount: 5000000,
      },
      {
        expectNeedPayToken: BigInt("1524000000000000000000000"), // 1,524,000
        buyAmount: 6000000,
      },
      {
        expectNeedPayToken: BigInt("2370666666666666666666665"), // 2,370,666
        buyAmount: 7000000,
      },
      {
        expectNeedPayToken: BigInt("4064000000000000000000000"), // 4,064,000
        buyAmount: 8000000,
      },
      {
        expectNeedPayToken: BigInt("9144000000000000000000000"), // 9,144,000
        buyAmount: 9000000,
      },
    ];

    it("buy one", async function () {
      for (let i = 0; i < data.length; i++) {
        const info = (await loadFixture(deployAllContracts)).hypeMemeAllContractInfo;
        await info.hypeMeme.setSystemReady(true)
        await info.degenGateInfo.foundry.setMortgageFee(info.hypeMemeAppId, info.mortgageFee)

        let nftOwner = info.wallets[info.nextWalletIndex + 1];
        let user1 = info.wallets[info.nextWalletIndex + 2];

        let pt = await info.point.MAX_TOKEN_SUPPLY()

        await info.mockDegen.transfer(user1.address, pt)
        await info.mockDegen.connect(user1).approve(await info.degenGateInfo.degenGate.getAddress(), MAX_UINT256)
        await info.degenGateInfo.degenGate.connect(user1).degenToPoint(pt - info.hypeMemeNftPrice)
        await info.mockDegen.connect(user1).approve(await info.hypeMeme.getAddress(), MAX_UINT256)

        let buyAmount = BigInt(10) ** BigInt(18) * BigInt(data[i].buyAmount);
        let expectNeedPayToken = data[i].expectNeedPayToken;

        let params = {
          info: {
            name: "name_a",
            ticker: "ticker_a",
            description: "description_a",
            image: "image_a",
            twitterLink: "twitter_link_a",
            telegramLink: "telegram_link_a",
            warpcastLink: "warpcast_link_a",
            website: "website_a"
          }
        };

        let tid = params.info.ticker

        await info.mockDegen.connect(info.deployWallet).approve(await info.hypeMeme.getAddress(), info.hypeMemeNftPrice);

        await info.hypeMeme
          .connect(user1)
          .createToken(params.info);

        await info.hypeMemePublicNFT.connect(user1).transferFrom(user1.address, nftOwner.address, 1)

        await info.point.connect(user1).approve(await info.hypeMemeMarket.getAddress(), MAX_UINT256)

        let needPayToken = await info.hypeMemeMarket.connect(user1).buy.staticCall(tid, buyAmount);

        let user1PayToken1 = await info.point.balanceOf(user1.address)
        let marketPayToken1 = await info.point.balanceOf(await info.hypeMemeMarket.getAddress())
        let nftOwnerPayToken1 = await info.point.balanceOf(nftOwner.address)
        let tnftOwnerPayToken1 = await info.point.balanceOf(info.hypeMemeFundRecipientWallet.address)

        await info.hypeMemeMarket.connect(user1).buy(tid, buyAmount);

        let curvePayToken = await info.hypeMemeMarket.getPayTokenAmount(0, buyAmount);

        let user1PayToken2 = await info.point.balanceOf(user1.address)
        let marketPayToken2 = await info.point.balanceOf(await info.hypeMemeMarket.getAddress())
        let nftOwnerPayToken2 = await info.point.balanceOf(nftOwner.address)
        let tnftOwnerPayToken2 = await info.point.balanceOf(info.hypeMemeFundRecipientWallet.address)

        let nftOwnerAddPayToken = nftOwnerPayToken2 - nftOwnerPayToken1;
        let tnftOwnerAddPayToken = tnftOwnerPayToken2 - tnftOwnerPayToken1;

        expect(needPayToken).eq(expectNeedPayToken);

        expect(await info.hypeMemeMarket.totalSupply(tid)).eq(buyAmount);
        expect(await info.hypeMemeMarket.balanceOf(tid, user1.address)).eq(buyAmount);
        expect(await info.hypeMemeMarket.balanceOf(tid, await info.hypeMemeMarket.getAddress())).eq(0);
        expect(await info.hypeMemeMarket.balanceOf(tid, nftOwner.address)).eq(0);

        expect(user1PayToken2).eq(user1PayToken1 - needPayToken);
        expect(marketPayToken2 - marketPayToken1).eq(curvePayToken);
        expect(curvePayToken + nftOwnerAddPayToken + tnftOwnerAddPayToken).eq(needPayToken);

        expect(curvePayToken / (nftOwnerAddPayToken + tnftOwnerAddPayToken)).eq(62); // 100 / 1.6 == 62.5

        expect(
          new Decimal(nftOwnerAddPayToken.toString()).dividedBy(new Decimal(tnftOwnerAddPayToken.toString())).toFixed(3).toString()
        ).eq(
          new Decimal(10).dividedBy(new Decimal(6)).toFixed(3).toString()
        );

      }
    });

  });
});
