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

describe("DegenGate.createToken", function () {
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
      nftPrice: BigInt(10) ** BigInt(18) * BigInt(10),
    };
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

    await info.point.connect(info.deployWallet).approve(await info.degenGate.getAddress(), params.nftPrice);

    await info.degenGate
      .connect(info.deployWallet)
      .createToken(params.info, params.nftPrice, params.deadline, signature);

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
      nftPrice: BigInt(10) ** BigInt(18) * BigInt(10),
    };
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

    await info.point.connect(info.deployWallet).approve(await info.degenGate.getAddress(), params.nftPrice);

    await expect(info.degenGate
      .connect(info.deployWallet)
      .createToken(params.info, params.nftPrice, params.deadline, signature)
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
      nftPrice: BigInt(10) ** BigInt(18) * BigInt(10),
    };
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

    await info.point.connect(info.deployWallet).approve(await info.degenGate.getAddress(), params.nftPrice);

    await expect(info.degenGate
      .connect(info.deployWallet)
      .createToken(params.info, params.nftPrice, params.deadline, signature)
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
      nftPrice: BigInt(10) ** BigInt(18) * BigInt(10),
    };
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

    await info.point.connect(info.deployWallet).approve(await info.degenGate.getAddress(), params.nftPrice);

    await expect(info.degenGate
      .connect(info.deployWallet)
      .createToken(params.info, params.nftPrice, params.deadline, signature)
    ).revertedWith("VSE");

    await info.degenGate.setSignatureAddress(info.deployWallet.address)
    await info.degenGate
      .connect(info.deployWallet)
      .createToken(params.info, params.nftPrice, params.deadline, signature);

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
      nftPrice: BigInt(10) ** BigInt(18) * BigInt(10),
    };
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

    await info.point.connect(info.deployWallet).approve(await info.degenGate.getAddress(), params.nftPrice);

    await expect(info.degenGate
      .connect(info.deployWallet)
      .createToken(params.info, params.nftPrice, params.deadline, signature)
    ).revertedWith("CTE");
  });

  it("point < nft price approve", async function () {
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
      nftPrice: 10,
    };
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

    await info.point.approve(await info.degenGate.getAddress(), params.nftPrice - 1)
    await expect(
      info.degenGate.connect(info.deployWallet).createToken(params.info, params.nftPrice, params.deadline, signature)
    ).revertedWithCustomError(info.point, "ERC20InsufficientAllowance")
  });

  it("point < nft price balanceOf", async function () {
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
      nftPrice: await info.point.balanceOf(info.deployWallet.address) + BigInt(1),
    };
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

    await info.point.approve(await info.degenGate.getAddress(), MAX_UINT256)
    await expect(
      info.degenGate.connect(info.deployWallet).createToken(params.info, params.nftPrice, params.deadline, signature),
    ).revertedWithCustomError(info.point, "ERC20InsufficientBalance")
  });

  it("point eq nft price | cid != tid", async function () {
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
      nftPrice: BigInt(10) ** BigInt(18) * BigInt(10),
    };
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

    let deployWallet_Point1 = await info.point.balanceOf(info.deployWallet.address);
    let degenGate_Point1 = await info.point.balanceOf(await info.degenGate.getAddress());
    let degenGateFundRecipientWallet_Point1 = await info.point.balanceOf(info.degenGateFundRecipientWallet.address);

    await info.point.connect(info.deployWallet).approve(await info.degenGate.getAddress(), params.nftPrice);

    await info.degenGate
      .connect(info.deployWallet)
      .createToken(params.info, params.nftPrice, params.deadline, signature);


    let deployWallet_Point2 = await info.point.balanceOf(info.deployWallet.address);
    let degenGate_Point2 = await info.point.balanceOf(await info.degenGate.getAddress());
    let degenGateFundRecipientWallet_Point2 = await info.point.balanceOf(info.degenGateFundRecipientWallet.address);

    expect(await info.publicNFT.ownerOf(3)).eq(info.deployWallet.address);
    expect(await info.publicNFT.ownerOf(4)).eq(await info.degenGateNFTClaim.getAddress());

    let info1 = await info.publicNFT.tokenIdToInfo(3)
    expect(info1.tid).eq(params.info.tid)
    expect(info1.percent).eq(5000)

    let info2 = await info.publicNFT.tokenIdToInfo(4)
    expect(info2.tid).eq(params.info.tid)
    expect(info2.percent).eq(95000)

    expect(deployWallet_Point2).eq(deployWallet_Point1 - params.nftPrice);
    expect(degenGate_Point2).eq(degenGate_Point1).eq(0);
    expect(degenGateFundRecipientWallet_Point2).eq(degenGateFundRecipientWallet_Point1 + params.nftPrice);

    await expect(
      info.degenGate
        .connect(info.deployWallet)
        .createToken(params.info, params.nftPrice, params.deadline, signature),
    ).revertedWith("TE");
  });

  it("point eq nft price | cid == tid", async function () {
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
      nftPrice: BigInt(10) ** BigInt(18) * BigInt(10),
    };
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

    let deployWallet_Point1 = await info.point.balanceOf(info.deployWallet.address);
    let degenGate_Point1 = await info.point.balanceOf(await info.degenGate.getAddress());
    let degenGateFundRecipientWallet_Point1 = await info.point.balanceOf(info.degenGateFundRecipientWallet.address);

    await info.point.connect(info.deployWallet).approve(await info.degenGate.getAddress(), params.nftPrice);

    await info.degenGate
      .connect(info.deployWallet)
      .createToken(params.info, params.nftPrice, params.deadline, signature);


    let deployWallet_Point2 = await info.point.balanceOf(info.deployWallet.address);
    let degenGate_Point2 = await info.point.balanceOf(await info.degenGate.getAddress());
    let degenGateFundRecipientWallet_Point2 = await info.point.balanceOf(info.degenGateFundRecipientWallet.address);

    expect(await info.publicNFT.ownerOf(3)).eq(info.deployWallet.address);
    expect(await info.publicNFT.ownerOf(4)).eq(await info.degenGateNFTClaim.getAddress());

    let info1 = await info.publicNFT.tokenIdToInfo(3)
    expect(info1.tid).eq(params.info.tid)
    expect(info1.percent).eq(5000)

    let info2 = await info.publicNFT.tokenIdToInfo(4)
    expect(info2.tid).eq(params.info.tid)
    expect(info2.percent).eq(95000)

    expect(deployWallet_Point2).eq(deployWallet_Point1 - params.nftPrice);
    expect(degenGate_Point2).eq(degenGate_Point1).eq(0);
    expect(degenGateFundRecipientWallet_Point2).eq(degenGateFundRecipientWallet_Point1 + params.nftPrice);

    await expect(
      info.degenGate
        .connect(info.deployWallet)
        .createToken(params.info, params.nftPrice, params.deadline, signature),
    ).revertedWith("TE");
  });

  it("point > nft price", async function () {
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
      nftPrice: BigInt(10) ** BigInt(18) * BigInt(10),
    };
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

    let deployWallet_Point1 = await info.point.balanceOf(info.deployWallet.address);
    let degenGate_Point1 = await info.point.balanceOf(await info.degenGate.getAddress());
    let degenGateFundRecipientWallet_Point1 = await info.point.balanceOf(info.degenGateFundRecipientWallet.address);

    await info.point.connect(info.deployWallet).approve(await info.degenGate.getAddress(), MAX_UINT256);

    await info.degenGate
      .connect(info.deployWallet)
      .createToken(params.info, params.nftPrice, params.deadline, signature);


    let deployWallet_Point2 = await info.point.balanceOf(info.deployWallet.address);
    let degenGate_Point2 = await info.point.balanceOf(await info.degenGate.getAddress());
    let degenGateFundRecipientWallet_Point2 = await info.point.balanceOf(info.degenGateFundRecipientWallet.address);

    expect(await info.publicNFT.ownerOf(3)).eq(info.deployWallet.address);
    expect(await info.publicNFT.ownerOf(4)).eq(await info.degenGateNFTClaim.getAddress());

    expect(deployWallet_Point2).eq(deployWallet_Point1 - params.nftPrice);
    expect(degenGate_Point2).eq(degenGate_Point1).eq(0);
    expect(degenGateFundRecipientWallet_Point2).eq(degenGateFundRecipientWallet_Point1 + params.nftPrice);

    await expect(
      info.degenGate
        .connect(info.deployWallet)
        .createToken(params.info, params.nftPrice, params.deadline, signature),
    ).revertedWith("TE");
  });
});
