import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { ethers } from "hardhat";
import { expect } from "chai";
import { deployAllContracts } from "./shared/deploy";

describe("DegenGateNFTClaim", function () {
  it("view", async function () {
    const info = (await loadFixture(deployAllContracts)).degenGateInfo;

    expect(await info.degenGateNFTClaim.point()).eq(await info.point.getAddress());

    expect(await info.degenGateNFTClaim.degenGate()).eq(await info.degenGate.getAddress());
    expect(await info.degenGateNFTClaim.publicNFT()).eq(await info.publicNFT.getAddress());
    expect(await info.degenGateNFTClaim.market()).eq(await info.market.getAddress());
    expect(await info.degenGateNFTClaim.signatureAddress()).eq(info.signatureWallet.address);

    expect(await info.degenGateNFTClaim.owner()).eq(info.deployWallet.address);
  });

  it("setSignatureAddress", async function () {
    const info = (await loadFixture(deployAllContracts)).degenGateInfo;

    let newOwner = info.wallets[info.nextWalletIndex];
    let newSign = info.wallets[info.nextWalletIndex + 1];

    expect(await info.degenGateNFTClaim.owner()).eq(info.deployWallet.address);
    await info.degenGateNFTClaim.connect(info.deployWallet).transferOwnership(newOwner.address);
    expect(await info.degenGateNFTClaim.owner()).eq(newOwner.address);

    await expect(
      info.degenGateNFTClaim.setSignatureAddress(newSign.address)
    ).revertedWithCustomError(info.degenGateNFTClaim, "OwnableUnauthorizedAccount");
    await info.degenGateNFTClaim.connect(newOwner).setSignatureAddress(newSign.address);
    expect(await info.degenGateNFTClaim.signatureAddress()).eq(newSign.address);
  });

  it("isClaim claimNFT", async function () {
    const info = (await loadFixture(deployAllContracts)).degenGateInfo;
    await info.degenGateVault.addApproveDegen();

    let nftOwner1 = info.wallets[info.nextWalletIndex + 1];
    let nftOwner2 = info.wallets[info.nextWalletIndex + 2];

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
      wrap: {
        degenAmount: 0,
        specialPointAmount: 0
      },
      deadline: deadline,
      nftPrice: 0,
    };
    let signatureCreate = await info.signatureWallet.signMessage(
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
            [params.info, params.wrap, params.nftPrice, params.deadline, info.userWallet.address],
          ),
        ),
      ),
    );

    await info.degenGate.connect(info.userWallet).createTokenWrap(params.info, params.wrap, params.nftPrice, params.deadline, signatureCreate);

    // multiply
    let bignumber = BigInt(10) ** BigInt(18) * BigInt(10000);
    await info.mockDegen.transfer(info.userWallet.address, bignumber);
    await info.mockDegen.connect(info.userWallet).approve(await info.degenGate.getAddress(), bignumber)

    let paramsMultiply = {
      tid: params.info.tid,
      multiplyAmount: BigInt(10) ** BigInt(18) * BigInt(100),
      wrap: {
        degenAmount: 0,
        specialPointAmount: BigInt(10) ** BigInt(18) * BigInt(100)
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

    let tx = await info.degenGate.connect(info.userWallet).multiply(
      paramsMultiply.tid,
      paramsMultiply.multiplyAmount,
      paramsMultiply.wrap,
      paramsMultiply.deadline,
      paramsMultiplySignature
    )



    expect(await info.degenGateNFTClaim.isClaim(params.info.tid)).eq(false);

    let fee = "950009500095000950"
    await expect(tx).to.emit(info.degenGateNFTClaim, "ReceiveBuySellFee").withArgs(2, fee);

    // claim onft
    let signatureClaim = await info.signatureWallet.signMessage(
      ethers.toBeArray(
        ethers.keccak256(
          ethers.AbiCoder.defaultAbiCoder().encode(["string", "address"], [params.info.tid, nftOwner2.address]),
        ),
      ),
    );
    await expect(info.degenGateNFTClaim.claimNFT(params.info.tid, nftOwner1.address, signatureClaim)).revertedWith("VSE");

    expect(await info.publicNFT.ownerOf(1)).eq(info.userWallet.address);
    expect(await info.publicNFT.ownerOf(2)).eq(await info.degenGateNFTClaim.getAddress());

    await info.degenGateNFTClaim.claimNFT(params.info.tid, nftOwner2.address, signatureClaim);

    expect(await info.publicNFT.ownerOf(1)).eq(info.userWallet.address);
    expect(await info.publicNFT.ownerOf(2)).eq(nftOwner2.address);

    expect(await info.degenGateNFTClaim.isClaim(params.info.tid)).eq(true);

    // re claim error
    await expect(info.degenGateNFTClaim.claimNFT(params.info.tid, nftOwner2.address, signatureClaim)).revertedWith("CE");

    // claim onft tid error
    let signatureClaimTidError = await info.signatureWallet.signMessage(
      ethers.toBeArray(
        ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(["string", "address"], ["aaaaaa", nftOwner2.address])),
      ),
    );
    await expect(info.degenGateNFTClaim.claimNFT("aaaaaa", nftOwner2.address, signatureClaimTidError)).revertedWith("TE1");

    await expect(info.publicNFT.ownerOf(3)).revertedWithCustomError(info.publicNFT, "ERC721NonexistentToken");
    await expect(info.publicNFT.ownerOf(4)).revertedWithCustomError(info.publicNFT, "ERC721NonexistentToken");

    let params2 = {
      info: {
        tid: "c",
        tName: "c",
        cid: "c",
        cName: "c",
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
    let signatureCreate2 = await info.signatureWallet.signMessage(
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
            [params2.info, params2.wrap, params2.nftPrice, params2.deadline, info.userWallet.address],
          ),
        ),
      ),
    );

    await info.degenGate.connect(info.userWallet).createTokenWrap(params2.info, params2.wrap, params2.nftPrice, params2.deadline, signatureCreate2);

    // multiply
    let bignumber2 = BigInt(10) ** BigInt(18) * BigInt(10000);
    await info.mockDegen.transfer(info.userWallet.address, bignumber2);
    await info.mockDegen.connect(info.userWallet).approve(await info.degenGate.getAddress(), bignumber2)

    let paramsMultiply2 = {
      tid: params2.info.tid,
      multiplyAmount: BigInt(10) ** BigInt(18) * BigInt(100),
      wrap: {
        degenAmount: 0,
        specialPointAmount: BigInt(10) ** BigInt(18) * BigInt(100)
      },
      deadline: deadline,
    }

    let paramsMultiplySignature2 = await info.signatureWallet.signMessage(
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
            [paramsMultiply2.tid, paramsMultiply2.multiplyAmount, paramsMultiply2.wrap, paramsMultiply2.deadline, info.userWallet.address],
          ),
        ),
      ),
    );

    await info.degenGate.connect(info.userWallet).multiply(
      paramsMultiply2.tid,
      paramsMultiply2.multiplyAmount,
      paramsMultiply2.wrap,
      paramsMultiply2.deadline,
      paramsMultiplySignature2
    )




    expect(await info.publicNFT.ownerOf(3)).eq(info.userWallet.address);
    expect(await info.publicNFT.ownerOf(4)).eq(await info.degenGateNFTClaim.getAddress());
    expect(await info.degenGateNFTClaim.isClaim(params2.info.tid)).eq(false);

    // claim onft
    let signatureClaim2 = await info.signatureWallet.signMessage(
      ethers.toBeArray(
        ethers.keccak256(
          ethers.AbiCoder.defaultAbiCoder().encode(["string", "address"], [params2.info.tid, nftOwner2.address]),
        ),
      ),
    );

    // claim
    await info.degenGateNFTClaim.claimNFT(params2.info.tid, nftOwner2.address, signatureClaim2)
    expect(await info.degenGateNFTClaim.isClaim(params2.info.tid)).eq(true);
    expect(await info.publicNFT.ownerOf(4)).eq(nftOwner2.address);
  });

  it("setClaim", async function () {
    const info = (await loadFixture(deployAllContracts)).degenGateInfo;
    await info.degenGateVault.addApproveDegen();

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
      wrap: {
        degenAmount: 0,
        specialPointAmount: 0
      },
      deadline: deadline,
      nftPrice: 0,
    };
    let signatureCreate = await info.signatureWallet.signMessage(
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
            [params.info, params.wrap, params.nftPrice, params.deadline, info.userWallet.address],
          ),
        ),
      ),
    );

    await info.degenGate.connect(info.userWallet).createTokenWrap(params.info, params.wrap, params.nftPrice, params.deadline, signatureCreate);

    // multiply
    let bignumber = BigInt(10) ** BigInt(18) * BigInt(10000);
    await info.mockDegen.transfer(info.userWallet.address, bignumber);
    await info.mockDegen.connect(info.userWallet).approve(await info.degenGate.getAddress(), bignumber)

    let paramsMultiply = {
      tid: params.info.tid,
      multiplyAmount: BigInt(10) ** BigInt(18) * BigInt(100),
      wrap: {
        degenAmount: 0,
        specialPointAmount: BigInt(10) ** BigInt(18) * BigInt(100)
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

    expect(await info.degenGateNFTClaim.isClaim(params.info.tid)).eq(false);
  });

});
