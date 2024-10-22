import { DegenGateAllContractInfo } from "./shared/deploy_degen_gate";
import { deployAllContracts, MAX_UINT256 } from "./shared/deploy";

import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

import { ethers } from "hardhat";

async function createTokenAndMultiply_100000(info: DegenGateAllContractInfo) {
  const currentTimestamp = Math.floor(new Date().getTime() / 1000);
  const deadline = currentTimestamp + 60 * 60

  // create token
  let params = {
    info: {
      tid: "a",
      tName: "a",
      cid: "a",
      cName: "a",
      followers: 123,
      omf: 2212,
    },
    wrap: {
      degenAmount: 0,
      specialPointAmount: 0
    },
    deadline: deadline,
    nftPrice: 0,
  };
  let signature = await info.signatureWallet.signMessage(
    ethers.toBeArray(
      ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(
          [
            "tuple(string tid, string tName, string cid, string cName, uint256 followers, uint256 omf)",
            "tuple(uint256 degenAmount, uint256 specialPointAmount)",
            "uint256",
            "uint256",
            "address",
          ],
          [params.info, params.wrap, params.nftPrice, params.deadline, info.deployWallet.address],
        ),
      ),
    ),
  );

  // createTokenWrap
  await info.degenGate.connect(info.deployWallet).createTokenWrap(params.info, params.wrap, params.nftPrice, params.deadline, signature);

  // multiply
  let paramsMultiply = {
    tid: params.info.tid,
    multiplyAmount: BigInt(10) ** BigInt(18) * BigInt(100000),
    wrap: {
      degenAmount: 0,
      specialPointAmount: BigInt(10) ** BigInt(18) * BigInt(200000)
    },
    deadline: deadline,
  }

  let paramsMultiplySignature = await info.signatureWallet.signMessage(
    ethers.toBeArray(
      ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(
          [
            "string",
            "uint256",
            "tuple(uint256 degenAmount, uint256 specialPointAmount)",
            "uint256",
            "address",
          ],
          [paramsMultiply.tid, paramsMultiply.multiplyAmount, paramsMultiply.wrap, paramsMultiply.deadline, info.userWallet.address],
        ),
      ),
    ),
  );

  await info.degenGate.connect(info.userWallet).multiply(
    paramsMultiply.tid,
    paramsMultiply.multiplyAmount,
    paramsMultiply.wrap,
    paramsMultiply.deadline,
    paramsMultiplySignature
  )
}

describe("DegenGate.createTokenAndMultiply", function () {
  it("signature success", async function () {
    const info = (await loadFixture(deployAllContracts)).degenGateInfo;
    await createTokenAndMultiply_100000(info)

    const currentTimestamp = Math.floor(new Date().getTime() / 1000);
    const deadline = currentTimestamp + 60 * 60;

    let params = {
      info: {
        tid: "b",
        tName: "b",
        cid: "bc",
        cName: "bc",
        followers: 123,
        omf: 2212,
      },
      deadline: deadline,
      nftPrice: BigInt(10) ** BigInt(18) * BigInt(1),
      multiplyAmount: BigInt(10) ** BigInt(18) * BigInt(100),
    };
    let payTokenAmountMax = BigInt("2100011000110001100")

    let signature = await info.signatureWallet.signMessage(
      ethers.toBeArray(
        ethers.keccak256(
          ethers.AbiCoder.defaultAbiCoder().encode(
            [
              "tuple(string tid, string tName, string cid, string cName, uint256 followers, uint256 omf)",
              "uint256",
              "uint256",
              "address",
            ],
            [params.info, params.nftPrice, params.deadline, info.deployWallet.address],
          ),
        ),
      ),
    );

    await info.point.connect(info.deployWallet).approve(await info.degenGate.getAddress(), payTokenAmountMax);

    await info.degenGate
      .connect(info.deployWallet)
      .createTokenAndMultiply(params.info, params.nftPrice, params.deadline, signature, params.multiplyAmount, payTokenAmountMax);

  });

  it("signature sender error", async function () {
    const info = (await loadFixture(deployAllContracts)).degenGateInfo;
    await createTokenAndMultiply_100000(info)

    const currentTimestamp = Math.floor(new Date().getTime() / 1000);
    const deadline = currentTimestamp + 60 * 60;

    let params = {
      info: {
        tid: "b",
        tName: "b",
        cid: "bc",
        cName: "bc",
        followers: 123,
        omf: 2212,
      },
      deadline: deadline,
      nftPrice: BigInt(10) ** BigInt(18) * BigInt(1),
      multiplyAmount: BigInt(10) ** BigInt(18) * BigInt(100),
    };
    let payTokenAmountMax = BigInt("2100011000110001100")

    let signature = await info.signatureWallet.signMessage(
      ethers.toBeArray(
        ethers.keccak256(
          ethers.AbiCoder.defaultAbiCoder().encode(
            [
              "tuple(string tid, string tName, string cid, string cName, uint256 followers, uint256 omf)",
              "uint256",
              "uint256",
              "address",
            ],
            [params.info, params.nftPrice, params.deadline, info.userWallet.address],
          ),
        ),
      ),
    );

    await info.point.connect(info.deployWallet).approve(await info.degenGate.getAddress(), payTokenAmountMax);

    await expect(
      info.degenGate
        .connect(info.deployWallet)
        .createTokenAndMultiply(params.info, params.nftPrice, params.deadline, signature, params.multiplyAmount, payTokenAmountMax)
    ).revertedWith("VSE");

  });

  it("signature info error", async function () {
    const info = (await loadFixture(deployAllContracts)).degenGateInfo;
    await createTokenAndMultiply_100000(info)

    const currentTimestamp = Math.floor(new Date().getTime() / 1000);
    const deadline = currentTimestamp + 60 * 60;

    let params = {
      info: {
        tid: "b",
        tName: "b",
        cid: "bc",
        cName: "bc",
        followers: 123,
        omf: 2212,
      },
      deadline: deadline,
      nftPrice: BigInt(10) ** BigInt(18) * BigInt(1),
      multiplyAmount: BigInt(10) ** BigInt(18) * BigInt(100),
    };
    let payTokenAmountMax = BigInt("2100011000110001100")

    let signature = await info.signatureWallet.signMessage(
      ethers.toBeArray(
        ethers.keccak256(
          ethers.AbiCoder.defaultAbiCoder().encode(
            [
              "tuple(string tid, string tName, string cid, string cName, uint256 followers, uint256 omf)",
              "uint256",
              "uint256",
              "address",
            ],
            [params.info, params.nftPrice + BigInt(1), params.deadline, info.deployWallet.address],
          ),
        ),
      ),
    );

    await info.point.connect(info.deployWallet).approve(await info.degenGate.getAddress(), payTokenAmountMax);

    await expect(
      info.degenGate
        .connect(info.deployWallet)
        .createTokenAndMultiply(params.info, params.nftPrice, params.deadline, signature, params.multiplyAmount, payTokenAmountMax)
    ).revertedWith("VSE");

  });

  it("signatureAddress error", async function () {
    const info = (await loadFixture(deployAllContracts)).degenGateInfo;
    await createTokenAndMultiply_100000(info)

    const currentTimestamp = Math.floor(new Date().getTime() / 1000);
    const deadline = currentTimestamp + 60 * 60;

    let params = {
      info: {
        tid: "b",
        tName: "b",
        cid: "bc",
        cName: "bc",
        followers: 123,
        omf: 2212,
      },
      deadline: deadline,
      nftPrice: BigInt(10) ** BigInt(18) * BigInt(1),
      multiplyAmount: BigInt(10) ** BigInt(18) * BigInt(100),
    };
    let payTokenAmountMax = BigInt("2100011000110001100")

    let signature = await info.deployWallet.signMessage(
      ethers.toBeArray(
        ethers.keccak256(
          ethers.AbiCoder.defaultAbiCoder().encode(
            [
              "tuple(string tid, string tName, string cid, string cName, uint256 followers, uint256 omf)",
              "uint256",
              "uint256",
              "address",
            ],
            [params.info, params.nftPrice, params.deadline, info.deployWallet.address],
          ),
        ),
      ),
    );

    await info.point.connect(info.deployWallet).approve(await info.degenGate.getAddress(), payTokenAmountMax);

    await expect(
      info.degenGate
        .connect(info.deployWallet)
        .createTokenAndMultiply(params.info, params.nftPrice, params.deadline, signature, params.multiplyAmount, payTokenAmountMax)
    ).revertedWith("VSE");

    await info.degenGate.setSignatureAddress(info.deployWallet.address);
    await info.degenGate
      .connect(info.deployWallet)
      .createTokenAndMultiply(params.info, params.nftPrice, params.deadline, signature, params.multiplyAmount, payTokenAmountMax);

  });

  it("deadline error", async function () {
    const info = (await loadFixture(deployAllContracts)).degenGateInfo;
    await createTokenAndMultiply_100000(info)

    const currentTimestamp = Math.floor(new Date().getTime() / 1000);
    const deadline = currentTimestamp - 60 * 60;

    let params = {
      info: {
        tid: "b",
        tName: "b",
        cid: "bc",
        cName: "bc",
        followers: 123,
        omf: 2212,
      },
      deadline: deadline,
      nftPrice: BigInt(10) ** BigInt(18) * BigInt(1),
      multiplyAmount: BigInt(10) ** BigInt(18) * BigInt(100),
    };
    let payTokenAmountMax = BigInt("2100011000110001100")

    let signature = await info.signatureWallet.signMessage(
      ethers.toBeArray(
        ethers.keccak256(
          ethers.AbiCoder.defaultAbiCoder().encode(
            [
              "tuple(string tid, string tName, string cid, string cName, uint256 followers, uint256 omf)",
              "uint256",
              "uint256",
              "address",
            ],
            [params.info, params.nftPrice, params.deadline, info.deployWallet.address],
          ),
        ),
      ),
    );

    await info.point.connect(info.deployWallet).approve(await info.degenGate.getAddress(), payTokenAmountMax);

    await expect(
      info.degenGate
        .connect(info.deployWallet)
        .createTokenAndMultiply(params.info, params.nftPrice, params.deadline, signature, params.multiplyAmount, payTokenAmountMax)
    ).revertedWith("CTE");

  });

  it("point < nft price + multiply", async function () {
    const info = (await loadFixture(deployAllContracts)).degenGateInfo;
    await createTokenAndMultiply_100000(info)

    const currentTimestamp = Math.floor(new Date().getTime() / 1000);
    const deadline = currentTimestamp + 60 * 60;

    let params = {
      info: {
        tid: "b",
        tName: "b",
        cid: "bc",
        cName: "bc",
        followers: 123,
        omf: 2212,
      },
      deadline: deadline,
      nftPrice: BigInt(10) ** BigInt(18) * BigInt(1),
      multiplyAmount: BigInt(10) ** BigInt(18) * BigInt(100),
    };
    let payTokenAmountMax = 1

    let signature = await info.signatureWallet.signMessage(
      ethers.toBeArray(
        ethers.keccak256(
          ethers.AbiCoder.defaultAbiCoder().encode(
            [
              "tuple(string tid, string tName, string cid, string cName, uint256 followers, uint256 omf)",
              "uint256",
              "uint256",
              "address",
            ],
            [params.info, params.nftPrice, params.deadline, info.deployWallet.address],
          ),
        ),
      ),
    );

    await info.point.connect(info.deployWallet).approve(await info.degenGate.getAddress(), payTokenAmountMax);

    await expect(
      info.degenGate
        .connect(info.deployWallet)
        .createTokenAndMultiply(params.info, params.nftPrice, params.deadline, signature, params.multiplyAmount, payTokenAmountMax),
    ).revertedWithCustomError(info.point, "ERC20InsufficientBalance")
  });

  it("point == nft price + multiply | tid != cid", async function () {
    const info = (await loadFixture(deployAllContracts)).degenGateInfo;
    await createTokenAndMultiply_100000(info)

    const currentTimestamp = Math.floor(new Date().getTime() / 1000);
    const deadline = currentTimestamp + 60 * 60;

    let params = {
      info: {
        tid: "b",
        tName: "b",
        cid: "bc",
        cName: "bc",
        followers: 123,
        omf: 2212,
      },
      deadline: deadline,
      nftPrice: BigInt(10) ** BigInt(18) * BigInt(1),
      multiplyAmount: BigInt(10) ** BigInt(18) * BigInt(100),
    };
    let payTokenAmountMax = BigInt("2100011000110001100")

    let signature = await info.signatureWallet.signMessage(
      ethers.toBeArray(
        ethers.keccak256(
          ethers.AbiCoder.defaultAbiCoder().encode(
            [
              "tuple(string tid, string tName, string cid, string cName, uint256 followers, uint256 omf)",
              "uint256",
              "uint256",
              "address",
            ],
            [params.info, params.nftPrice, params.deadline, info.deployWallet.address],
          ),
        ),
      ),
    );

    let deployWallet_point_1 = await info.point.balanceOf(info.deployWallet.address);
    let degenGate_point_1 = await info.point.balanceOf(await info.degenGate.getAddress());
    let degenGateFundRecipientWallet_point_1 = await info.point.balanceOf(info.degenGateFundRecipientWallet.address);
    let market_point_1 = await info.point.balanceOf(await info.market.getAddress());
    let mortgage_point_1 = await info.point.balanceOf(info.mortgageFeeWallet.address);
    let degenGateNFTClaim_point_1 = await info.point.balanceOf(await info.degenGateNFTClaim.getAddress());

    await info.point.connect(info.deployWallet).approve(await info.degenGate.getAddress(), payTokenAmountMax);

    let result = await info.degenGate
      .connect(info.deployWallet)
      .createTokenAndMultiply.staticCall(params.info, params.nftPrice, params.deadline, signature, params.multiplyAmount, payTokenAmountMax);

    expect(result).eq(payTokenAmountMax)
    await expect(info.publicNFT.ownerOf(3)).revertedWithCustomError(info.publicNFT, "ERC721NonexistentToken")
    await expect(info.publicNFT.ownerOf(4)).revertedWithCustomError(info.publicNFT, "ERC721NonexistentToken")

    await expect(info.mortgageNFT.ownerOf(2)).revertedWithCustomError(info.mortgageNFT, "ERC721NonexistentToken")

    await info.degenGate
      .connect(info.deployWallet)
      .createTokenAndMultiply(params.info, params.nftPrice, params.deadline, signature, params.multiplyAmount, payTokenAmountMax);

    expect(await info.publicNFT.ownerOf(3)).eq(info.deployWallet.address);
    expect(await info.publicNFT.ownerOf(4)).eq(await info.degenGateNFTClaim.getAddress());

    let info1 = await info.publicNFT.tokenIdToInfo(3)
    expect(info1.tid).eq(params.info.tid)
    expect(info1.percent).eq(5000)

    let info2 = await info.publicNFT.tokenIdToInfo(4)
    expect(info2.tid).eq(params.info.tid)
    expect(info2.percent).eq(95000)

    expect(await info.mortgageNFT.ownerOf(2)).eq(info.deployWallet.address);
    expect((await info.mortgageNFT.info(2)).amount).eq(params.multiplyAmount)

    let curve = await info.market.getPayTokenAmount(0, params.multiplyAmount);

    let deployWallet_point_2 = await info.point.balanceOf(info.deployWallet.address);
    let degenGate_point_2 = await info.point.balanceOf(await info.degenGate.getAddress());
    let degenGateFundRecipientWallet_point_2 = await info.point.balanceOf(info.degenGateFundRecipientWallet.address);
    let market_point_2 = await info.point.balanceOf(await info.market.getAddress());
    let mortgage_point_2 = await info.point.balanceOf(info.mortgageFeeWallet.address);
    let degenGateNFTClaim_point_2 = await info.point.balanceOf(await info.degenGateNFTClaim.getAddress());

    // deployWallet_point_1 - nftPrice - multiplyPayAmount + nftFee = deployWallet_point_2
    let nft_fee_point = deployWallet_point_2 - deployWallet_point_1 + result;
    let mortgage_point_add = mortgage_point_2 - mortgage_point_1;

    expect(await info.publicNFT.ownerOf(3)).eq(info.deployWallet.address);
    expect(await info.publicNFT.ownerOf(4)).eq(await info.degenGateNFTClaim.getAddress());

    expect(degenGateNFTClaim_point_2).eq(degenGateNFTClaim_point_1).eq(0)

    expect(curve / mortgage_point_add).eq(1000);
    expect(curve / (nft_fee_point)).eq(100);

    expect(result - params.nftPrice).eq(mortgage_point_add + nft_fee_point);

    expect((curve + nft_fee_point) / (result - params.nftPrice)).eq(91);

    expect(degenGate_point_2).eq(degenGate_point_1).eq(0);
    expect(degenGateFundRecipientWallet_point_2).eq(degenGateFundRecipientWallet_point_1 + params.nftPrice);
    expect(market_point_2).eq(market_point_1).eq(0);
  });

  it("point > nft price + multiply", async function () {
    const info = (await loadFixture(deployAllContracts)).degenGateInfo;
    await createTokenAndMultiply_100000(info)

    const currentTimestamp = Math.floor(new Date().getTime() / 1000);
    const deadline = currentTimestamp + 60 * 60;

    let params = {
      info: {
        tid: "b",
        tName: "b",
        cid: "bc",
        cName: "bc",
        followers: 123,
        omf: 2212,
      },
      deadline: deadline,
      nftPrice: BigInt(10) ** BigInt(18) * BigInt(1),
      multiplyAmount: BigInt(10) ** BigInt(18) * BigInt(100),
    };
    let payTokenAmountMax = BigInt("2100011000110001100") * BigInt(2)

    let signature = await info.signatureWallet.signMessage(
      ethers.toBeArray(
        ethers.keccak256(
          ethers.AbiCoder.defaultAbiCoder().encode(
            [
              "tuple(string tid, string tName, string cid, string cName, uint256 followers, uint256 omf)",
              "uint256",
              "uint256",
              "address",
            ],
            [params.info, params.nftPrice, params.deadline, info.deployWallet.address],
          ),
        ),
      ),
    );

    let deployWallet_point_1 = await info.point.balanceOf(info.deployWallet.address);
    let degenGate_point_1 = await info.point.balanceOf(await info.degenGate.getAddress());
    let degenGateFundRecipientWallet_point_1 = await info.point.balanceOf(info.degenGateFundRecipientWallet.address);
    let market_point_1 = await info.point.balanceOf(await info.market.getAddress());
    let mortgage_point_1 = await info.point.balanceOf(info.mortgageFeeWallet.address);
    let degenGateNFTClaim_point_1 = await info.point.balanceOf(await info.degenGateNFTClaim.getAddress());

    await info.point.connect(info.deployWallet).approve(await info.degenGate.getAddress(), payTokenAmountMax);

    let result = await info.degenGate
      .connect(info.deployWallet)
      .createTokenAndMultiply.staticCall(params.info, params.nftPrice, params.deadline, signature, params.multiplyAmount, payTokenAmountMax);

    expect(result).lt(payTokenAmountMax)

    await info.degenGate
      .connect(info.deployWallet)
      .createTokenAndMultiply(params.info, params.nftPrice, params.deadline, signature, params.multiplyAmount, payTokenAmountMax);

    let curve = await info.market.getPayTokenAmount(0, params.multiplyAmount);

    let deployWallet_point_2 = await info.point.balanceOf(info.deployWallet.address);
    let degenGate_point_2 = await info.point.balanceOf(await info.degenGate.getAddress());
    let degenGateFundRecipientWallet_point_2 = await info.point.balanceOf(info.degenGateFundRecipientWallet.address);
    let market_point_2 = await info.point.balanceOf(await info.market.getAddress());
    let mortgage_point_2 = await info.point.balanceOf(info.mortgageFeeWallet.address);
    let degenGateNFTClaim_point_2 = await info.point.balanceOf(await info.degenGateNFTClaim.getAddress());

    // deployWallet_point_1 - nftPrice - multiplyPayAmount + nftFee = deployWallet_point_2
    let nft_fee_point = deployWallet_point_2 - deployWallet_point_1 + result;
    let mortgage_point_add = mortgage_point_2 - mortgage_point_1;

    expect(await info.publicNFT.ownerOf(3)).eq(info.deployWallet.address);
    expect(await info.publicNFT.ownerOf(4)).eq(await info.degenGateNFTClaim.getAddress());

    expect(degenGateNFTClaim_point_2).eq(degenGateNFTClaim_point_1).eq(0);
    expect(curve / mortgage_point_add).eq(1000);
    expect(curve / nft_fee_point).eq(100);

    expect(result - params.nftPrice).eq(mortgage_point_add + nft_fee_point);

    expect((curve + nft_fee_point) / (result - params.nftPrice)).eq(91);

    expect(degenGate_point_2).eq(degenGate_point_1).eq(0);
    expect(degenGateFundRecipientWallet_point_2).eq(degenGateFundRecipientWallet_point_1 + params.nftPrice);
    expect(market_point_2).eq(market_point_1).eq(0);

    await expect(
      info.degenGate
        .connect(info.deployWallet)
        .createTokenAndMultiply(params.info, params.nftPrice, params.deadline, signature, params.multiplyAmount, payTokenAmountMax)
    ).revertedWith("TE");
  });

  it("point == nft price + multiply onft==cnft", async function () {
    const info = (await loadFixture(deployAllContracts)).degenGateInfo;
    await createTokenAndMultiply_100000(info)

    const currentTimestamp = Math.floor(new Date().getTime() / 1000);
    const deadline = currentTimestamp + 60 * 60;

    let params = {
      info: {
        tid: "b",
        tName: "b",
        cid: "b",
        cName: "b",
        followers: 123,
        omf: 2212,
      },
      deadline: deadline,
      nftPrice: BigInt(10) ** BigInt(18) * BigInt(1),
      multiplyAmount: BigInt(10) ** BigInt(18) * BigInt(100),
    };
    let payTokenAmountMax = BigInt("2100011000110001100")

    let signature = await info.signatureWallet.signMessage(
      ethers.toBeArray(
        ethers.keccak256(
          ethers.AbiCoder.defaultAbiCoder().encode(
            [
              "tuple(string tid, string tName, string cid, string cName, uint256 followers, uint256 omf)",
              "uint256",
              "uint256",
              "address",
            ],
            [params.info, params.nftPrice, params.deadline, info.deployWallet.address],
          ),
        ),
      ),
    );

    let deployWallet_point_1 = await info.point.balanceOf(info.deployWallet.address);
    let degenGate_point_1 = await info.point.balanceOf(await info.degenGate.getAddress());
    let degenGateFundRecipientWallet_point_1 = await info.point.balanceOf(info.degenGateFundRecipientWallet.address);
    let market_point_1 = await info.point.balanceOf(await info.market.getAddress());
    let mortgage_point_1 = await info.point.balanceOf(info.mortgageFeeWallet.address);
    let degenGateNFTClaim_point_1 = await info.point.balanceOf(await info.degenGateNFTClaim.getAddress());

    await info.point.connect(info.deployWallet).approve(await info.degenGate.getAddress(), payTokenAmountMax);

    let result = await info.degenGate
      .connect(info.deployWallet)
      .createTokenAndMultiply.staticCall(params.info, params.nftPrice, params.deadline, signature, params.multiplyAmount, payTokenAmountMax);

    expect(result).eq(payTokenAmountMax)
    await expect(info.publicNFT.ownerOf(3)).revertedWithCustomError(info.publicNFT, "ERC721NonexistentToken")
    await expect(info.publicNFT.ownerOf(4)).revertedWithCustomError(info.publicNFT, "ERC721NonexistentToken")

    await expect(info.mortgageNFT.ownerOf(2)).revertedWithCustomError(info.mortgageNFT, "ERC721NonexistentToken")

    await info.degenGate
      .connect(info.deployWallet)
      .createTokenAndMultiply(params.info, params.nftPrice, params.deadline, signature, params.multiplyAmount, payTokenAmountMax);

    expect(await info.publicNFT.ownerOf(3)).eq(info.deployWallet.address);
    expect(await info.publicNFT.ownerOf(4)).eq(await info.degenGateNFTClaim.getAddress());

    let info1 = await info.publicNFT.tokenIdToInfo(3)
    expect(info1.tid).eq(params.info.tid)
    expect(info1.percent).eq(5000)

    let info2 = await info.publicNFT.tokenIdToInfo(4)
    expect(info2.tid).eq(params.info.tid)
    expect(info2.percent).eq(95000)

    expect(await info.mortgageNFT.ownerOf(2)).eq(info.deployWallet.address);
    expect((await info.mortgageNFT.info(2)).amount).eq(params.multiplyAmount)


    let curve = await info.market.getPayTokenAmount(0, params.multiplyAmount);

    let deployWallet_point_2 = await info.point.balanceOf(info.deployWallet.address);
    let degenGate_point_2 = await info.point.balanceOf(await info.degenGate.getAddress());
    let degenGateFundRecipientWallet_point_2 = await info.point.balanceOf(info.degenGateFundRecipientWallet.address);
    let market_point_2 = await info.point.balanceOf(await info.market.getAddress());
    let mortgage_point_2 = await info.point.balanceOf(info.mortgageFeeWallet.address);
    let degenGateNFTClaim_point_2 = await info.point.balanceOf(await info.degenGateNFTClaim.getAddress());

    // deployWallet_point_1 - nftPrice - multiplyPayAmount + nftFee = deployWallet_point_2
    let nftFee = deployWallet_point_2 - deployWallet_point_1 + result;
    let mortgage_point_add = mortgage_point_2 - mortgage_point_1;

    expect(await info.publicNFT.ownerOf(3)).eq(info.deployWallet.address);
    expect(await info.publicNFT.ownerOf(4)).eq(await info.degenGateNFTClaim.getAddress());

    expect(degenGateNFTClaim_point_2).eq(degenGateNFTClaim_point_1).eq(0);

    expect(curve / mortgage_point_add).eq(1000);
    expect(curve / nftFee).eq(100);

    expect(result - params.nftPrice).eq(mortgage_point_add + nftFee);

    expect((curve + nftFee) / (result - params.nftPrice)).eq(91);

    expect(degenGate_point_2).eq(degenGate_point_1).eq(0);
    expect(degenGateFundRecipientWallet_point_2).eq(degenGateFundRecipientWallet_point_1 + params.nftPrice);
    expect(market_point_2).eq(market_point_1).eq(0);
  });

});
