import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { ethers } from "hardhat";
import { expect } from "chai";
import { deployAllContracts } from "./shared/deploy";

describe("DegenGateNFTClaim", function () {
  it("view", async function () {
    const info = (await loadFixture(deployAllContracts)).degenGateInfo;

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

    await expect(info.degenGateNFTClaim.setSignatureAddress(newSign.address)).revertedWith(
      "Ownable: caller is not the owner",
    );
    await info.degenGateNFTClaim.connect(newOwner).setSignatureAddress(newSign.address);
    expect(await info.degenGateNFTClaim.signatureAddress()).eq(newSign.address);
  });

  it("isClaim claimNFT tokenIdToBegen", async function () {
    const info = (await loadFixture(deployAllContracts)).degenGateInfo;
    await info.degenGateVault.addApproveDegen();

    let nftOwner1 = info.wallets[info.nextWalletIndex + 1];
    let nftOwner2 = info.wallets[info.nextWalletIndex + 2];

    expect(await info.degenGateNFTClaim.tokenIdToBegen(1)).eq(0);
    expect(await info.degenGateNFTClaim.tokenIdToBegen(2)).eq(0);

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
        specialBegenAmount: 0
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
              "tuple(uint256 degenAmount, uint256 specialBegenAmount)",
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
        specialBegenAmount: BigInt(10) ** BigInt(18) * BigInt(100)
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
              "tuple(uint256 degenAmount, uint256 specialBegenAmount)",
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

    let degenGateNFTClaimBegen2_1 = await info.degenGateNFTClaim.tokenIdToBegen(2);
    let degenGateNFTClaimBegen1 = await info.begen.balanceOf(await info.degenGateNFTClaim.getAddress());

    let nftOwner2Begen1 = await info.begen.balanceOf(nftOwner2.address);

    expect(degenGateNFTClaimBegen2_1).eq(degenGateNFTClaimBegen1).eq(fee);



    expect(await info.publicNFT.ownerOf(1)).eq(info.userWallet.address);
    expect(await info.publicNFT.ownerOf(2)).eq(await info.degenGateNFTClaim.getAddress());

    await info.degenGateNFTClaim.claimNFT(params.info.tid, nftOwner2.address, signatureClaim);

    expect(await info.publicNFT.ownerOf(1)).eq(info.userWallet.address);
    expect(await info.publicNFT.ownerOf(2)).eq(nftOwner2.address);

    let degenGateNFTClaimBegen2_2 = await info.degenGateNFTClaim.tokenIdToBegen(2);
    let degenGateNFTClaimBegen2 = await info.begen.balanceOf(await info.degenGateNFTClaim.getAddress());
    let nftOwner2Begen2 = await info.begen.balanceOf(nftOwner2.address);

    expect(await info.degenGateNFTClaim.isClaim(params.info.tid)).eq(true);
    expect(degenGateNFTClaimBegen2_2).eq(degenGateNFTClaimBegen2).eq(0);
    expect(nftOwner2Begen2).eq(nftOwner2Begen1 + degenGateNFTClaimBegen2_1);

    // re claim error
    await expect(info.degenGateNFTClaim.claimNFT(params.info.tid, nftOwner2.address, signatureClaim)).revertedWith("CE");

    // claim onft tid error
    let signatureClaimTidError = await info.signatureWallet.signMessage(
      ethers.toBeArray(
        ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(["string", "address"], ["aaaaaa", nftOwner2.address])),
      ),
    );
    await expect(info.degenGateNFTClaim.claimNFT("aaaaaa", nftOwner2.address, signatureClaimTidError)).revertedWith("TE1");

    await expect(info.publicNFT.ownerOf(3)).revertedWith("ERC721: invalid token ID");
    await expect(info.publicNFT.ownerOf(4)).revertedWith("ERC721: invalid token ID");

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
        specialBegenAmount: 0
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
              "tuple(uint256 degenAmount, uint256 specialBegenAmount)",
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
        specialBegenAmount: BigInt(10) ** BigInt(18) * BigInt(100)
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
              "tuple(uint256 degenAmount, uint256 specialBegenAmount)",
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
    expect(await info.publicNFT.ownerOf(4)).eq(info.userWallet.address);
    expect(await info.degenGateNFTClaim.isClaim(params2.info.tid)).eq(true);

    // claim onft
    let signatureClaim2 = await info.signatureWallet.signMessage(
      ethers.toBeArray(
        ethers.keccak256(
          ethers.AbiCoder.defaultAbiCoder().encode(["string", "address"], [params2.info.tid, nftOwner2.address]),
        ),
      ),
    );
    // re claim
    await expect(info.degenGateNFTClaim.claimNFT(params2.info.tid, nftOwner2.address, signatureClaim2)).revertedWith("CE");
  });

  it("setClaim", async function () {
    const info = (await loadFixture(deployAllContracts)).degenGateInfo;
    await info.degenGateVault.addApproveDegen();

    expect(await info.degenGateNFTClaim.tokenIdToBegen(1)).eq(0);
    expect(await info.degenGateNFTClaim.tokenIdToBegen(2)).eq(0);

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
        specialBegenAmount: 0
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
              "tuple(uint256 degenAmount, uint256 specialBegenAmount)",
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
        specialBegenAmount: BigInt(10) ** BigInt(18) * BigInt(100)
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
              "tuple(uint256 degenAmount, uint256 specialBegenAmount)",
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
    await expect(info.degenGateNFTClaim.setClaim(params.info.tid)).revertedWith("SE");
  });

  it("withdraw", async function () {
    const info = (await loadFixture(deployAllContracts)).degenGateInfo;
    await info.degenGateVault.addApproveDegen();

    let newOwner = info.wallets[info.nextWalletIndex + 3];

    expect(await info.degenGateNFTClaim.owner()).eq(info.deployWallet.address);
    await info.degenGateNFTClaim.connect(info.deployWallet).transferOwnership(newOwner.address);
    expect(await info.degenGateNFTClaim.owner()).eq(newOwner.address);

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
        specialBegenAmount: 0
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
              "tuple(uint256 degenAmount, uint256 specialBegenAmount)",
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
        specialBegenAmount: BigInt(10) ** BigInt(18) * BigInt(100)
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
              "tuple(uint256 degenAmount, uint256 specialBegenAmount)",
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

    let degenGateNFTClaimBegenAmount2_1 = await info.degenGateNFTClaim.tokenIdToBegen(2);
    let degenGateNFTClaimBegen1 = await info.begen.balanceOf(await info.degenGateNFTClaim.getAddress());

    expect(degenGateNFTClaimBegen1).eq(degenGateNFTClaimBegenAmount2_1);
    expect(degenGateNFTClaimBegenAmount2_1).gt(0);

    await expect(info.degenGateNFTClaim.withdraw(params.info.tid, degenGateNFTClaimBegenAmount2_1)).revertedWith(
      "Ownable: caller is not the owner",
    );

    await expect(
      info.degenGateNFTClaim.connect(newOwner).withdraw(params.info.tid, degenGateNFTClaimBegenAmount2_1 + BigInt(1)),
    ).revertedWith("EAE");

    let newOwnerBegen1 = await info.begen.balanceOf(newOwner.address);

    await info.degenGateNFTClaim.connect(newOwner).withdraw(params.info.tid, degenGateNFTClaimBegenAmount2_1 - BigInt(1));

    let degenGateNFTClaimBegenAmount2_2 = await info.degenGateNFTClaim.tokenIdToBegen(2);
    let degenGateNFTClaimBegen2 = await info.begen.balanceOf(await info.degenGateNFTClaim.getAddress());
    let newOwnerBegen2 = await info.begen.balanceOf(newOwner.address);

    expect(degenGateNFTClaimBegen2).eq(degenGateNFTClaimBegenAmount2_2).eq(1);
    expect(newOwnerBegen2).eq(newOwnerBegen1 + degenGateNFTClaimBegenAmount2_1 - BigInt(1));

    await info.degenGateNFTClaim.connect(newOwner).withdraw(params.info.tid, BigInt(1));

    let degenGateNFTClaimBegenAmount2_3 = await info.degenGateNFTClaim.tokenIdToBegen(2);
    let degenGateNFTClaimBegen3 = await info.begen.balanceOf(await info.degenGateNFTClaim.getAddress());
    let newOwnerBegen3 = await info.begen.balanceOf(newOwner.address);

    expect(degenGateNFTClaimBegen3).eq(degenGateNFTClaimBegenAmount2_3).eq(0);
    expect(newOwnerBegen3).eq(newOwnerBegen2 + BigInt(1));

    await expect(info.degenGateNFTClaim.connect(newOwner).withdraw(params.info.tid, BigInt(1))).revertedWith("EAE");
    await expect(info.degenGateNFTClaim.connect(newOwner).withdraw("t1234", BigInt(1))).revertedWith("TE1");
  });

});
