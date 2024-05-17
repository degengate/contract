import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { ethers } from "hardhat";
import { expect } from "chai";
import { MAX_UINT256, deployAllContracts } from "./shared/deploy";

describe("Base", function () {
  it("test", async function () {
    const info = (await loadFixture(deployAllContracts)).degenGateInfo;

    let nftOwner = info.wallets[info.nextWalletIndex];

    const currentTimestamp = Math.floor(new Date().getTime() / 1000);
    const deadline = currentTimestamp + 60 * 60
    // create token a price 0
    let paramsA = {
      info: {
        tid: "a",
        tName: "a",
        cid: "a",
        cName: "a",
        followers: 123,
        omf: 2212,
      },
      deadline: deadline,
      nftPrice: 0,
    };

    let signatureA = await info.signatureWallet.signMessage(
      ethers.toBeArray(
        ethers.keccak256(
          ethers.AbiCoder.defaultAbiCoder().encode(
            [
              "tuple(string tid, string tName, string cid, string cName, uint256 followers, uint256 omf)",
              "uint256",
              "uint256",
              "address",
            ],
            [paramsA.info, paramsA.nftPrice, paramsA.deadline, nftOwner.address],
          ),
        ),
      ),
    );

    await info.degenGate.connect(nftOwner).createToken(paramsA.info, paramsA.nftPrice, paramsA.deadline, signatureA);

    // create token b price 1
    let paramsB = {
      info: {
        tid: "b",
        tName: "b",
        cid: "bc",
        cName: "bc",
        followers: 123,
        omf: 2212,
      },
      wrap: {
        degenAmount: 100,
        specialBegenAmount: 24
      },
      deadline: deadline,
      nftPrice: 123,
    };
    let signatureB = await info.signatureWallet.signMessage(
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
            [paramsB.info, paramsB.wrap, paramsB.nftPrice, paramsB.deadline, nftOwner.address],
          ),
        ),
      ),
    );

    await info.degenGateVault.addApproveDegen();

    let bignumber = BigInt(10) ** BigInt(18) * BigInt(100);
    await info.mockDegen.transfer(nftOwner.address, bignumber);
    await info.mockDegen.connect(nftOwner).approve(await info.degenGate.getAddress(), bignumber)

    await info.degenGate.connect(nftOwner).createTokenWrap(paramsB.info, paramsB.wrap, paramsB.nftPrice, paramsB.deadline, signatureB);

    // multiply
    await info.mockDegen.transfer(info.userWallet.address, bignumber);
    await info.mockDegen.connect(info.userWallet).approve(await info.degenGate.getAddress(), bignumber)

    let paramsMultiply = {
      tid: paramsA.info.tid,
      multiplyAmount: 100,
      wrap: {
        degenAmount: 100,
        specialBegenAmount: 100
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

    let multiplyResult = await info.degenGate.connect(info.userWallet).multiply.staticCall(
      paramsMultiply.tid,
      paramsMultiply.multiplyAmount,
      paramsMultiply.wrap,
      paramsMultiply.deadline,
      paramsMultiplySignature
    )

    await info.degenGate.connect(info.userWallet).multiply(
      paramsMultiply.tid,
      paramsMultiply.multiplyAmount,
      paramsMultiply.wrap,
      paramsMultiply.deadline,
      paramsMultiplySignature
    )

    // multiply add
    let paramsMultiplyAdd = {
      nftTokenId: multiplyResult.nftTokenId,
      multiplyAmount: 200,
      wrap: {
        degenAmount: 200,
        specialBegenAmount: 1
      },
      deadline: deadline,
    }


    let paramsMultiplyAddSignature = await info.signatureWallet.signMessage(
      ethers.toBeArray(
        ethers.keccak256(
          ethers.AbiCoder.defaultAbiCoder().encode(
            [
              "uint256",
              "uint256",
              "tuple(uint256 degenAmount, uint256 specialBegenAmount)",
              "uint256",
              "address",
            ],
            [paramsMultiplyAdd.nftTokenId, paramsMultiplyAdd.multiplyAmount, paramsMultiplyAdd.wrap, paramsMultiplyAdd.deadline, info.userWallet.address],
          ),
        ),
      ),
    );

    await info.degenGate.connect(info.userWallet).multiplyAdd(
      paramsMultiplyAdd.nftTokenId,
      paramsMultiplyAdd.multiplyAmount,
      paramsMultiplyAdd.wrap,
      paramsMultiplyAdd.deadline,
      paramsMultiplyAddSignature
    )


    // multiply
    let paramsMultiply2 = {
      tid: paramsA.info.tid,
      multiplyAmount: BigInt(10) ** BigInt(18) * BigInt(1000000),
      wrap: {
        degenAmount: BigInt(10) ** BigInt(18) * BigInt(1000000),
        specialBegenAmount: 0
      },
      deadline: deadline,
    }

    let paramsMultiply2Signature = await info.signatureWallet.signMessage(
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
            [paramsMultiply2.tid, paramsMultiply2.multiplyAmount, paramsMultiply2.wrap, paramsMultiply2.deadline, info.deployWallet.address],
          ),
        ),
      ),
    );

    await info.mockDegen.approve(await info.degenGate.getAddress(), MAX_UINT256)
    await info.degenGate.multiply(
      paramsMultiply2.tid,
      paramsMultiply2.multiplyAmount,
      paramsMultiply2.wrap,
      paramsMultiply2.deadline,
      paramsMultiply2Signature
    )

    // cash
    let userDegenBalanceOf_1 = await info.mockDegen.balanceOf(info.userWallet)
    let userTokenAmount = paramsMultiply.multiplyAmount + paramsMultiplyAdd.multiplyAmount;

    expect((await info.mortgageNFT.info(multiplyResult.nftTokenId)).amount).eq(userTokenAmount);
    let cashResult = await info.degenGate.connect(info.userWallet).cash.staticCall(multiplyResult.nftTokenId, userTokenAmount);
    await info.degenGate.connect(info.userWallet).cash(multiplyResult.nftTokenId, userTokenAmount);

    let userDegenBalanceOf_2 = await info.mockDegen.balanceOf(info.userWallet)
    expect(userDegenBalanceOf_2).eq(userDegenBalanceOf_1 + cashResult)

    let nftOwnerA1DegenBalanceOf_1 = await info.mockDegen.balanceOf(nftOwner.address)
    let nftOwnerA1BegenBalanceOf_1 = await info.begen.balanceOf(nftOwner.address)
    await info.degenGateVault.connect(nftOwner).collectAll("0x");
    let nftOwnerA1DegenBalanceOf_2 = await info.mockDegen.balanceOf(nftOwner.address)
    let nftOwnerA1BegenBalanceOf_2 = await info.begen.balanceOf(nftOwner.address)

    expect(
      nftOwnerA1DegenBalanceOf_2 - nftOwnerA1DegenBalanceOf_1
    ).eq(
      nftOwnerA1BegenBalanceOf_1 - nftOwnerA1BegenBalanceOf_2
    )
  });
});
