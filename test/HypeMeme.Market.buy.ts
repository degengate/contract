import { deployAllContracts, MAX_UINT256 } from "./shared/deploy";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("HypeMeme.Market", function () {
  describe("buy", function () {
    let data = [
      {
        expectNeedPayToken: BigInt("101000010100001010"), // 0.101
        buyAmount: 1,
      },
      {
        expectNeedPayToken: BigInt("1010001010001010001"), // 1.01
        buyAmount: 10,
      },
      {
        expectNeedPayToken: BigInt("10100101001010010100"), // 10.1
        buyAmount: 100,
      },
      {
        expectNeedPayToken: BigInt("101010101010101010101"), // 101.01
        buyAmount: 1000,
      },
      {
        expectNeedPayToken: BigInt("1011011011011011011011"), // 1011.01
        buyAmount: 10000,
      },
      {
        expectNeedPayToken: BigInt("10202020202020202020202"), // 10,202.020
        buyAmount: 100000,
      },
      {
        expectNeedPayToken: BigInt("53157894736842105263157"), // 53,157
        buyAmount: 500000,
      },
      {
        expectNeedPayToken: BigInt("112222222222222222222222"), // 112,222
        buyAmount: 1000000,
      },
      {
        expectNeedPayToken: BigInt("252500000000000000000000"), // 252,500
        buyAmount: 2000000,
      },
      {
        expectNeedPayToken: BigInt("432857142857142857142856"), // 432,857
        buyAmount: 3000000,
      },
      {
        expectNeedPayToken: BigInt("673333333333333333333332"), // 673,333
        buyAmount: 4000000,
      },
      {
        expectNeedPayToken: BigInt("1010000000000000000000000"), // 1,010,000
        buyAmount: 5000000,
      },
      {
        expectNeedPayToken: BigInt("1515000000000000000000000"), // 1,515,000
        buyAmount: 6000000,
      },
      {
        expectNeedPayToken: BigInt("2356666666666666666666666"), // 2,356,666
        buyAmount: 7000000,
      },
      {
        expectNeedPayToken: BigInt("4040000000000000000000000"), // 4,040,000
        buyAmount: 8000000,
      },
      {
        expectNeedPayToken: BigInt("9090000000000000000000000"), // 9,090,000
        buyAmount: 9000000,
      },
    ];

    it("buy one", async function () {
      for (let i = 0; i < data.length; i++) {
        const info = (await loadFixture(deployAllContracts)).hypeMemeAllContractInfo;
        await info.hypeMeme.setSystemReady(true)
        await info.degenGateInfo.foundry.setMortgageFee(info.hypeMemeAppId, 1000)

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

        await info.hypeMemeMarket.connect(user1).buy(tid, buyAmount);

        let curvePayToken = await info.hypeMemeMarket.getPayTokenAmount(0, buyAmount);

        let user1PayToken2 = await info.point.balanceOf(user1.address)
        let marketPayToken2 = await info.point.balanceOf(await info.hypeMemeMarket.getAddress())
        let nftOwnerPayToken2 = await info.point.balanceOf(nftOwner.address)

        let nftOwnerAddPayToken = nftOwnerPayToken2 - nftOwnerPayToken1;

        expect(needPayToken).eq(expectNeedPayToken);

        expect(await info.hypeMemeMarket.totalSupply(tid)).eq(buyAmount);
        expect(await info.hypeMemeMarket.balanceOf(tid, user1.address)).eq(buyAmount);
        expect(await info.hypeMemeMarket.balanceOf(tid, await info.hypeMemeMarket.getAddress())).eq(0);
        expect(await info.hypeMemeMarket.balanceOf(tid, nftOwner.address)).eq(0);

        expect(user1PayToken2).eq(user1PayToken1 - needPayToken);
        expect(marketPayToken2 - marketPayToken1).eq(curvePayToken);
        expect(curvePayToken + nftOwnerAddPayToken).eq(needPayToken);

        expect(curvePayToken / nftOwnerAddPayToken).eq(100);
      }
    });

  });
});
