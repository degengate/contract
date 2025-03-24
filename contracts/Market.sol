// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity >=0.8.20;

import "./interfaces/IFeeNFT.sol";
import "./interfaces/IMortgageNFT.sol";
import "./interfaces/IMarket.sol";
import "./interfaces/IFoundry.sol";
import "./interfaces/IFoundryData.sol";
import "./interfaces/ICurve.sol";
import "./interfaces/IToken.sol";

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract Market is IMarket, ReentrancyGuard {
  uint256 public immutable override feeDenominator;
  uint256 public immutable override totalPercent;

  address public immutable override foundry;
  uint256 public immutable override appId;

  address public immutable override curve;
  address public immutable override payToken;

  address public override feeNFT;
  address public override mortgageNFT;

  constructor(
    address _foundry,
    uint256 _appId,
    uint256 _feeDenominator,
    uint256 _totalPercent,
    address _curve,
    address _payToken
  ) {
    foundry = _foundry;
    appId = _appId;

    feeDenominator = _feeDenominator;
    totalPercent = _totalPercent;

    curve = _curve;
    payToken = _payToken;
  }

  function initialize(address _feeNFT, address _mortgageNFT) external override {
    require(msg.sender == foundry, "onlyFoundry");

    feeNFT = _feeNFT;
    mortgageNFT = _mortgageNFT;

    emit Initialize(_feeNFT, _mortgageNFT);
  }

  function totalSupply(string memory tid) public view override returns (uint256) {
    return IERC20(token(tid)).totalSupply();
  }

  function balanceOf(string memory tid, address account) public view override returns (uint256) {
    return IERC20(token(tid)).balanceOf(account);
  }

  function getBuyPayTokenAmount(
    string memory tid,
    uint256 tokenAmount
  ) public view override returns (uint256 payTokenAmount) {
    uint256 ts = totalSupply(tid);
    return getPayTokenAmount(ts, tokenAmount);
  }

  function getSellPayTokenAmount(
    string memory tid,
    uint256 tokenAmount
  ) public view override returns (uint256 payTokenAmount) {
    uint256 ts = totalSupply(tid);
    return getPayTokenAmount(ts - tokenAmount, tokenAmount);
  }

  function getPayTokenAmount(uint256 base, uint256 add) public view override returns (uint256 payTokenAmount) {
    return ICurve(curve).curveMath(base, add);
  }

  function appFee() public view returns (AppFee memory) {
    IFoundryData.AppFee memory _appFee = IFoundry(foundry).appFees(appId);
    return
      AppFee({
        // app owner buy sell fee
        appOwnerBuyFee: _appFee.appOwnerBuyFee,
        appOwnerSellFee: _appFee.appOwnerSellFee,
        // app owner mortgage fee
        appOwnerMortgageFee: _appFee.appOwnerMortgageFee,
        // app owner all fee recipient
        appOwnerFeeRecipient: _appFee.appOwnerFeeRecipient,
        // nft owner buy sell fee
        nftOwnerBuyFee: _appFee.nftOwnerBuyFee,
        nftOwnerSellFee: _appFee.nftOwnerSellFee,
        // platform mortgage fee
        platformMortgageFee: _appFee.platformMortgageFee,
        platformMortgageFeeRecipient: _appFee.platformMortgageFeeRecipient
      });
  }

  function token(string memory tid) public view override returns (address) {
    return IFoundry(foundry).token(appId, tid);
  }

  function buy(
    string memory tid,
    uint256 tokenAmount
  ) external payable override nonReentrant returns (uint256 payTokenAmount) {
    require(IFoundry(foundry).tokenExist(appId, tid), "TE");

    require(tokenAmount > 0, "TAE");

    NftFeeInfo memory nftFeeInfo;
    address appOwnerFeeTo;
    uint256 appOwnerFeeAmount;

    (payTokenAmount, nftFeeInfo, appOwnerFeeTo, appOwnerFeeAmount) = _buyWithoutPay(msg.sender, tid, tokenAmount);

    if (_payTokenIsERC20()) {
      require(msg.value == 0, "VE");
      _transferFromERC20PayTokenFromSender(payTokenAmount);
      _batchTransferERC20PayTokenToNFTOwners(nftFeeInfo.nftFeeTos, nftFeeInfo.nftFeeAmounts);
      _transferERC20PayToken(appOwnerFeeTo, appOwnerFeeAmount);
    } else {
      require(msg.value >= payTokenAmount, "VE");
      _batchTransferEthToNFTOwners(nftFeeInfo.nftFeeTos, nftFeeInfo.nftFeeAmounts);
      _transferEth(appOwnerFeeTo, appOwnerFeeAmount);
      _refundETH(payTokenAmount);
    }

    emit Buy(tid, tokenAmount, payTokenAmount, msg.sender, nftFeeInfo, appOwnerFeeAmount);
  }

  function sell(
    string memory tid,
    uint256 tokenAmount
  ) external override nonReentrant returns (uint256 payTokenAmount) {
    require(IFoundry(foundry).tokenExist(appId, tid), "TE");

    require(tokenAmount > 0, "TAE");
    require(tokenAmount <= balanceOf(tid, msg.sender), "TAE");

    NftFeeInfo memory nftFeeInfo;
    address appOwnerFeeTo;
    uint256 appOwnerFeeAmount;

    (payTokenAmount, nftFeeInfo, appOwnerFeeTo, appOwnerFeeAmount) = _sellWithoutPay(msg.sender, tid, tokenAmount);

    if (_payTokenIsERC20()) {
      _transferERC20PayToken(msg.sender, payTokenAmount);
      _batchTransferERC20PayTokenToNFTOwners(nftFeeInfo.nftFeeTos, nftFeeInfo.nftFeeAmounts);
      _transferERC20PayToken(appOwnerFeeTo, appOwnerFeeAmount);
    } else {
      _transferEth(msg.sender, payTokenAmount);
      _batchTransferEthToNFTOwners(nftFeeInfo.nftFeeTos, nftFeeInfo.nftFeeAmounts);
      _transferEth(appOwnerFeeTo, appOwnerFeeAmount);
    }

    emit Sell(tid, tokenAmount, payTokenAmount, msg.sender, nftFeeInfo, appOwnerFeeAmount);
  }

  function mortgage(
    string memory tid,
    uint256 tokenAmount
  ) external override nonReentrant returns (uint256 nftTokenId, uint256 payTokenAmount) {
    bool exists;
    (exists, nftTokenId) = _findFirstMortgageNftTokenId(tid);

    if (exists) {
      payTokenAmount = _mortgageAdd(nftTokenId, tokenAmount);
    } else {
      (nftTokenId, payTokenAmount) = _mortgageNew(tid, tokenAmount);
    }
  }

  function mortgageNew(
    string memory tid,
    uint256 tokenAmount
  ) external override nonReentrant returns (uint256 nftTokenId, uint256 payTokenAmount) {
    (nftTokenId, payTokenAmount) = _mortgageNew(tid, tokenAmount);
  }

  function mortgageAdd(
    uint256 nftTokenId,
    uint256 tokenAmount
  ) external override nonReentrant returns (uint256 payTokenAmount) {
    payTokenAmount = _mortgageAdd(nftTokenId, tokenAmount);
  }

  function redeem(
    uint256 nftTokenId,
    uint256 tokenAmount
  ) external payable override nonReentrant returns (uint256 payTokenAmount) {
    require(IERC721(mortgageNFT).ownerOf(nftTokenId) == msg.sender, "AOE");

    (string memory tid, uint256 oldAmount) = IMortgageNFT(mortgageNFT).info(nftTokenId);

    require(tokenAmount > 0, "TAE");
    require(tokenAmount <= oldAmount, "TAE");

    payTokenAmount = getPayTokenAmount(oldAmount - tokenAmount, tokenAmount);

    IMortgageNFT(mortgageNFT).remove(nftTokenId, tokenAmount);

    SafeERC20.safeTransfer(IERC20(token(tid)), msg.sender, tokenAmount);

    if (_payTokenIsERC20()) {
      require(msg.value == 0, "VE");
      _transferFromERC20PayTokenFromSender(payTokenAmount);
    } else {
      require(msg.value >= payTokenAmount, "VE");
      _refundETH(payTokenAmount);
    }

    emit Redeem(nftTokenId, tid, tokenAmount, payTokenAmount, msg.sender);
  }

  function multiply(
    string memory tid,
    uint256 multiplyAmount
  ) public payable override nonReentrant returns (uint256 nftTokenId, uint256 payTokenAmount) {
    bool exists;
    (exists, nftTokenId) = _findFirstMortgageNftTokenId(tid);

    if (exists) {
      payTokenAmount = _multiplyAdd(nftTokenId, multiplyAmount);
    } else {
      (nftTokenId, payTokenAmount) = _multiplyNew(tid, multiplyAmount);
    }
  }

  function multiplyNew(
    string memory tid,
    uint256 multiplyAmount
  ) external payable override nonReentrant returns (uint256 nftTokenId, uint256 payTokenAmount) {
    (nftTokenId, payTokenAmount) = _multiplyNew(tid, multiplyAmount);
  }

  function multiplyAdd(
    uint256 nftTokenId,
    uint256 multiplyAmount
  ) external payable override nonReentrant returns (uint256 payTokenAmount) {
    payTokenAmount = _multiplyAdd(nftTokenId, multiplyAmount);
  }

  function cash(
    uint256 nftTokenId,
    uint256 tokenAmount
  ) external override nonReentrant returns (uint256 payTokenAmount) {
    (
      string memory tid,
      uint256 sellAmount,
      NftFeeInfo memory nftFeeInfo,
      address appOwnerFeeTo,
      uint256 appOwnerFeeAmount,
      uint256 redeemPayTokenAmount
    ) = _cashWithoutPay(nftTokenId, tokenAmount);

    require(sellAmount >= redeemPayTokenAmount, "CE");
    payTokenAmount = sellAmount - redeemPayTokenAmount;

    if (_payTokenIsERC20()) {
      _transferERC20PayToken(msg.sender, payTokenAmount);
      _batchTransferERC20PayTokenToNFTOwners(nftFeeInfo.nftFeeTos, nftFeeInfo.nftFeeAmounts);
      _transferERC20PayToken(appOwnerFeeTo, appOwnerFeeAmount);
    } else {
      _transferEth(msg.sender, payTokenAmount);
      _batchTransferEthToNFTOwners(nftFeeInfo.nftFeeTos, nftFeeInfo.nftFeeAmounts);
      _transferEth(appOwnerFeeTo, appOwnerFeeAmount);
    }

    emit Cash(nftTokenId, tid, tokenAmount, payTokenAmount, msg.sender, nftFeeInfo, appOwnerFeeAmount);
  }

  function forceCash(
    uint256 nftTokenId,
    uint256 tokenAmount
  ) external payable override nonReentrant returns (bool userProfit, uint256 payTokenAmount) {
    (
      string memory tid,
      uint256 sellAmount,
      NftFeeInfo memory nftFeeInfo,
      address appOwnerFeeTo,
      uint256 appOwnerFeeAmount,
      uint256 redeemPayTokenAmount
    ) = _cashWithoutPay(nftTokenId, tokenAmount);

    userProfit = sellAmount >= redeemPayTokenAmount;
    if (userProfit) {
      payTokenAmount = sellAmount - redeemPayTokenAmount;
    } else {
      payTokenAmount = redeemPayTokenAmount - sellAmount;
    }

    if (userProfit) {
      if (_payTokenIsERC20()) {
        _transferERC20PayToken(msg.sender, payTokenAmount);
      } else {
        _transferEth(msg.sender, payTokenAmount);
      }
    } else {
      if (_payTokenIsERC20()) {
        require(msg.value == 0, "VE");
        _transferFromERC20PayTokenFromSender(payTokenAmount);
      } else {
        require(msg.value >= payTokenAmount, "VE");
        _refundETH(payTokenAmount);
      }
    }

    if (_payTokenIsERC20()) {
      _batchTransferERC20PayTokenToNFTOwners(nftFeeInfo.nftFeeTos, nftFeeInfo.nftFeeAmounts);
      _transferERC20PayToken(appOwnerFeeTo, appOwnerFeeAmount);
    } else {
      _batchTransferEthToNFTOwners(nftFeeInfo.nftFeeTos, nftFeeInfo.nftFeeAmounts);
      _transferEth(appOwnerFeeTo, appOwnerFeeAmount);
    }

    emit ForceCash(nftTokenId, tid, tokenAmount, payTokenAmount, msg.sender, nftFeeInfo, appOwnerFeeAmount, userProfit);
  }

  function merge(
    uint256 nftTokenId,
    uint256 otherNFTTokenId
  ) external override nonReentrant returns (uint256 payTokenAmount) {
    require(IERC721(mortgageNFT).ownerOf(nftTokenId) == msg.sender, "AOE1");
    require(IERC721(mortgageNFT).ownerOf(otherNFTTokenId) == msg.sender, "AOE2");

    (string memory tid, uint256 oldAmount) = IMortgageNFT(mortgageNFT).info(nftTokenId);
    (string memory otherTid, uint256 otherOldAmount) = IMortgageNFT(mortgageNFT).info(otherNFTTokenId);

    require(keccak256(abi.encodePacked(tid)) == keccak256(abi.encodePacked(otherTid)), "TE");

    IMortgageNFT(mortgageNFT).burn(otherNFTTokenId);
    IMortgageNFT(mortgageNFT).add(nftTokenId, otherOldAmount);

    uint256 curveAmount = getPayTokenAmount(oldAmount, otherOldAmount) - getPayTokenAmount(0, otherOldAmount);

    AppFee memory _appFee = appFee();
    uint256 platformMortgageFeeAmount = (_appFee.platformMortgageFee * curveAmount) / feeDenominator;
    uint256 appOwnerMortgageFeeAmount = (_appFee.appOwnerMortgageFee * curveAmount) / feeDenominator;

    payTokenAmount = curveAmount - platformMortgageFeeAmount - appOwnerMortgageFeeAmount;

    if (_payTokenIsERC20()) {
      _transferERC20PayToken(msg.sender, payTokenAmount);
      _transferERC20PayToken(_appFee.platformMortgageFeeRecipient, platformMortgageFeeAmount);
      _transferERC20PayToken(_appFee.appOwnerFeeRecipient, appOwnerMortgageFeeAmount);
    } else {
      _transferEth(msg.sender, payTokenAmount);
      _transferEth(_appFee.platformMortgageFeeRecipient, platformMortgageFeeAmount);
      _transferEth(_appFee.appOwnerFeeRecipient, appOwnerMortgageFeeAmount);
    }

    emit Merge(
      nftTokenId,
      tid,
      otherNFTTokenId,
      payTokenAmount,
      msg.sender,
      platformMortgageFeeAmount,
      appOwnerMortgageFeeAmount
    );
  }

  function split(
    uint256 nftTokenId,
    uint256 splitAmount
  ) external payable override nonReentrant returns (uint256 payTokenAmount, uint256 newNFTTokenId) {
    require(IERC721(mortgageNFT).ownerOf(nftTokenId) == msg.sender, "AOE");

    (string memory tid, uint256 oldAmount) = IMortgageNFT(mortgageNFT).info(nftTokenId);
    require(splitAmount > 0, "SAE");
    require(splitAmount < oldAmount, "SAE");

    IMortgageNFT(mortgageNFT).remove(nftTokenId, splitAmount);
    newNFTTokenId = IMortgageNFT(mortgageNFT).mint(msg.sender, tid, splitAmount);

    payTokenAmount = getPayTokenAmount(oldAmount - splitAmount, splitAmount) - getPayTokenAmount(0, splitAmount);

    if (_payTokenIsERC20()) {
      require(msg.value == 0, "VE");
      _transferFromERC20PayTokenFromSender(payTokenAmount);
    } else {
      require(msg.value >= payTokenAmount, "VE");
      _refundETH(payTokenAmount);
    }

    emit Split(nftTokenId, newNFTTokenId, tid, splitAmount, payTokenAmount, msg.sender);
  }

  function _buyWithoutPay(
    address to,
    string memory tid,
    uint256 tokenAmount
  )
    private
    returns (uint256 payTokenAmount, NftFeeInfo memory nftFeeInfo, address appOwnerFeeTo, uint256 appOwnerFeeAmount)
  {
    uint256 amount = getBuyPayTokenAmount(tid, tokenAmount);

    AppFee memory _appFee = appFee();
    uint256 totalNFTFee;
    (totalNFTFee, nftFeeInfo) = _getNFTOwnerbuyOrSellFee(tid, amount, _appFee.nftOwnerBuyFee);

    appOwnerFeeTo = _appFee.appOwnerFeeRecipient;
    appOwnerFeeAmount = (amount * _appFee.appOwnerBuyFee) / feeDenominator;

    payTokenAmount = amount + totalNFTFee + appOwnerFeeAmount;

    IToken(token(tid)).marketMint(tokenAmount);
    SafeERC20.safeTransfer(IERC20(token(tid)), to, tokenAmount);
  }

  function _sellWithoutPay(
    address from,
    string memory tid,
    uint256 tokenAmount
  )
    private
    returns (uint256 payTokenAmount, NftFeeInfo memory nftFeeInfo, address appOwnerFeeTo, uint256 appOwnerFeeAmount)
  {
    uint256 amount = getSellPayTokenAmount(tid, tokenAmount);

    AppFee memory _appFee = appFee();

    uint256 totalNFTFee;
    (totalNFTFee, nftFeeInfo) = _getNFTOwnerbuyOrSellFee(tid, amount, _appFee.nftOwnerSellFee);

    appOwnerFeeTo = _appFee.appOwnerFeeRecipient;
    appOwnerFeeAmount = (amount * _appFee.appOwnerSellFee) / feeDenominator;

    payTokenAmount = amount - totalNFTFee - appOwnerFeeAmount;

    if (from != address(this)) {
      SafeERC20.safeTransferFrom(IERC20(token(tid)), from, address(this), tokenAmount);
    }
    IToken(token(tid)).marketBurn(tokenAmount);
  }

  function _mortgageNew(
    string memory tid,
    uint256 tokenAmount
  ) private returns (uint256 nftTokenId, uint256 payTokenAmount) {
    require(IFoundry(foundry).tokenExist(appId, tid), "TE");
    require(tokenAmount > 0, "TAE");
    require(tokenAmount <= balanceOf(tid, msg.sender), "TAE");

    nftTokenId = IMortgageNFT(mortgageNFT).mint(msg.sender, tid, tokenAmount);

    payTokenAmount = _mortgageAddBase(nftTokenId, tid, 0, tokenAmount, msg.sender);
  }

  function _mortgageAdd(uint256 nftTokenId, uint256 tokenAmount) private returns (uint256 payTokenAmount) {
    require(IERC721(mortgageNFT).ownerOf(nftTokenId) == msg.sender, "AOE");

    (string memory tid, uint256 oldAmount) = IMortgageNFT(mortgageNFT).info(nftTokenId);

    require(tokenAmount > 0, "TAE");
    require(tokenAmount <= balanceOf(tid, msg.sender), "TAE");

    IMortgageNFT(mortgageNFT).add(nftTokenId, tokenAmount);

    payTokenAmount = _mortgageAddBase(nftTokenId, tid, oldAmount, tokenAmount, msg.sender);
  }

  function _mortgageAddBase(
    uint256 tokenId,
    string memory tid,
    uint256 oldAmount,
    uint256 addAmount,
    address user
  ) private returns (uint256 payTokenAmount) {
    uint256 curveAmount = getPayTokenAmount(oldAmount, addAmount);

    AppFee memory _appFee = appFee();
    uint256 platformMortgageFeeAmount = (_appFee.platformMortgageFee * curveAmount) / feeDenominator;
    uint256 appOwnerMortgageFeeAmount = (_appFee.appOwnerMortgageFee * curveAmount) / feeDenominator;

    payTokenAmount = curveAmount - platformMortgageFeeAmount - appOwnerMortgageFeeAmount;

    SafeERC20.safeTransferFrom(IERC20(token(tid)), user, address(this), addAmount);

    if (_payTokenIsERC20()) {
      _transferERC20PayToken(msg.sender, payTokenAmount);
      _transferERC20PayToken(_appFee.platformMortgageFeeRecipient, platformMortgageFeeAmount);
      _transferERC20PayToken(_appFee.appOwnerFeeRecipient, appOwnerMortgageFeeAmount);
    } else {
      _transferEth(msg.sender, payTokenAmount);
      _transferEth(_appFee.platformMortgageFeeRecipient, platformMortgageFeeAmount);
      _transferEth(_appFee.appOwnerFeeRecipient, appOwnerMortgageFeeAmount);
    }

    emit Mortgage(
      tokenId,
      tid,
      addAmount,
      payTokenAmount,
      platformMortgageFeeAmount,
      appOwnerMortgageFeeAmount,
      msg.sender
    );
  }

  function _multiplyNew(
    string memory tid,
    uint256 multiplyAmount
  ) private returns (uint256 nftTokenId, uint256 payTokenAmount) {
    require(IFoundry(foundry).tokenExist(appId, tid), "TE");
    require(multiplyAmount > 0, "TAE");

    nftTokenId = IMortgageNFT(mortgageNFT).mint(msg.sender, tid, multiplyAmount);

    payTokenAmount = _multiplyAddBase(nftTokenId, tid, 0, multiplyAmount);
  }

  function _multiplyAdd(uint256 nftTokenId, uint256 multiplyAmount) private returns (uint256 payTokenAmount) {
    require(IERC721(mortgageNFT).ownerOf(nftTokenId) == msg.sender, "AOE");
    require(multiplyAmount > 0, "TAE");

    (string memory tid, uint256 oldAmount) = IMortgageNFT(mortgageNFT).info(nftTokenId);
    IMortgageNFT(mortgageNFT).add(nftTokenId, multiplyAmount);

    payTokenAmount = _multiplyAddBase(nftTokenId, tid, oldAmount, multiplyAmount);
  }

  function _multiplyAddBase(
    uint256 nftTokenId,
    string memory tid,
    uint256 oldAmount,
    uint256 multiplyAmount
  ) private returns (uint256 payTokenAmount) {
    (
      uint256 multiplyPayTokenAmount,
      NftFeeInfo memory nftFeeInfo,
      address appOwnerFeeTo,
      uint256 appOwnerFeeAmount
    ) = _buyWithoutPay(address(this), tid, multiplyAmount);

    uint256 curveAmount = getPayTokenAmount(oldAmount, multiplyAmount);

    uint256 platformMortgageFeeAmount;
    uint256 appOwnerMortgageFeeAmount;
    AppFee memory _appFee = appFee();
    {
      platformMortgageFeeAmount = (_appFee.platformMortgageFee * curveAmount) / feeDenominator;
      appOwnerMortgageFeeAmount = (_appFee.appOwnerMortgageFee * curveAmount) / feeDenominator;
      uint256 mortAmount = curveAmount - platformMortgageFeeAmount - appOwnerMortgageFeeAmount;
      payTokenAmount = multiplyPayTokenAmount - mortAmount;
    }

    if (_payTokenIsERC20()) {
      require(msg.value == 0, "VE");
      _transferFromERC20PayTokenFromSender(payTokenAmount);
      _transferERC20PayToken(_appFee.platformMortgageFeeRecipient, platformMortgageFeeAmount);
      _transferERC20PayToken(_appFee.appOwnerFeeRecipient, appOwnerMortgageFeeAmount);
      _batchTransferERC20PayTokenToNFTOwners(nftFeeInfo.nftFeeTos, nftFeeInfo.nftFeeAmounts);
      _transferERC20PayToken(appOwnerFeeTo, appOwnerFeeAmount);
    } else {
      require(msg.value >= payTokenAmount, "VE");
      _transferEth(_appFee.platformMortgageFeeRecipient, platformMortgageFeeAmount);
      _transferEth(_appFee.appOwnerFeeRecipient, appOwnerMortgageFeeAmount);
      _batchTransferEthToNFTOwners(nftFeeInfo.nftFeeTos, nftFeeInfo.nftFeeAmounts);
      _transferEth(appOwnerFeeTo, appOwnerFeeAmount);
      _refundETH(payTokenAmount);
    }

    emit Multiply(
      nftTokenId,
      tid,
      multiplyAmount,
      payTokenAmount,
      msg.sender,
      nftFeeInfo,
      appOwnerFeeAmount,
      platformMortgageFeeAmount,
      appOwnerMortgageFeeAmount
    );
  }

  function _cashWithoutPay(
    uint256 nftTokenId,
    uint256 tokenAmount
  )
    private
    returns (
      string memory tid,
      uint256 sellAmount,
      NftFeeInfo memory nftFeeInfo,
      address appOwnerFeeTo,
      uint256 appOwnerFeeAmount,
      uint256 redeemPayTokenAmount
    )
  {
    require(IERC721(mortgageNFT).ownerOf(nftTokenId) == msg.sender, "AOE");
    uint256 oldAmount;
    (tid, oldAmount) = IMortgageNFT(mortgageNFT).info(nftTokenId);
    require(tokenAmount > 0, "TAE");
    require(tokenAmount <= oldAmount, "TAE");

    IMortgageNFT(mortgageNFT).remove(nftTokenId, tokenAmount);

    (sellAmount, nftFeeInfo, appOwnerFeeTo, appOwnerFeeAmount) = _sellWithoutPay(address(this), tid, tokenAmount);

    redeemPayTokenAmount = getPayTokenAmount(oldAmount - tokenAmount, tokenAmount);
  }

  function _getNFTOwnerbuyOrSellFee(
    string memory tid,
    uint256 amount,
    uint256 buyOrSellFee
  ) private view returns (uint256 totalFee, NftFeeInfo memory nftFeeInfo) {
    uint256[] memory percents;

    (nftFeeInfo.nftFeeTokenIds, percents, , nftFeeInfo.nftFeeTos) = IFeeNFT(feeNFT).tidToInfos(tid);

    nftFeeInfo.nftFeeAmounts = new uint256[](percents.length);

    for (uint256 i = 0; i < percents.length; i++) {
      uint256 feeAmount = (amount * buyOrSellFee * percents[i]) / totalPercent / feeDenominator;
      nftFeeInfo.nftFeeAmounts[i] = feeAmount;
      totalFee += feeAmount;
    }
  }

  function _payTokenIsERC20() private view returns (bool) {
    return payToken != address(0);
  }

  function _findFirstMortgageNftTokenId(string memory tid) private view returns (bool exists, uint256 tokenId) {
    IMortgageNFT.Info[] memory infos = IMortgageNFT(mortgageNFT).tokenInfosOfOwnerByTid(msg.sender, tid);
    if (infos.length == 0) {
      exists = false;
    } else {
      exists = true;
      tokenId = infos[0].tokenId;
    }
  }

  function _transferFromERC20PayTokenFromSender(uint256 value) private {
    if (value > 0) {
      SafeERC20.safeTransferFrom(IERC20(payToken), msg.sender, address(this), value);
    }
  }

  function _refundETH(uint256 needPay) private {
    uint256 refund = msg.value - needPay;
    if (refund > 0) {
      _transferEth(msg.sender, refund);
    }
  }

  function _batchTransferEthToNFTOwners(address[] memory tos, uint256[] memory amounts) private {
    for (uint256 i = 0; i < amounts.length; i++) {
      _transferEth(tos[i], amounts[i]);
    }
  }

  function _batchTransferERC20PayTokenToNFTOwners(address[] memory tos, uint256[] memory amounts) private {
    for (uint256 i = 0; i < amounts.length; i++) {
      _transferERC20PayToken(tos[i], amounts[i]);
    }
  }

  function _transferEth(address to, uint256 value) private {
    if (value > 0) {
      (bool success, ) = to.call{value: value}(new bytes(0));
      require(success, "TEE");
    }
  }

  function _transferERC20PayToken(address to, uint256 value) private {
    if (value > 0) {
      SafeERC20.safeTransfer(IERC20(payToken), to, value);
    }
  }
}
