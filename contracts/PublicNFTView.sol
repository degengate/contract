// SPDX-License-Identifier: BUSL-1.1
pragma solidity >=0.8.20;

import "base64-sol/base64.sol";

import "./interfaces/INFTView.sol";
import "./interfaces/IFoundry.sol";
import "./interfaces/IPublicNFT.sol";
import "./interfaces/INFTClaim.sol";
import "./interfaces/IPublicNFTViewBG.sol";

contract PublicNFTView is INFTView {
  struct Info {
    string tid;
    string tName;
    string cid;
    string cName;
    uint256 followers;
    uint256 omf;
    uint256 percent;
    uint256 timestamp;
    bool isClaim;
  }

  address public immutable foundry;
  uint256 public immutable appId;
  address public immutable publicNFT;
  address public immutable nftClaim;
  address public immutable viewBG;

  constructor(address _foundry, uint256 _appId, address _publicNFT, address _nftClaim, address _viewBG) {
    foundry = _foundry;
    appId = _appId;
    publicNFT = _publicNFT;
    nftClaim = _nftClaim;
    viewBG = _viewBG;
  }

  function name() external pure override returns (string memory) {
    return "Gate of Degen";
  }

  function symbol() external pure override returns (string memory) {
    return "GOD";
  }

  function tokenURI(uint256 tokenId) external view override returns (string memory) {
    Info memory info = _getInfo(tokenId);

    string[7] memory parts;

    parts[0] = '<svg width="528" height="527" viewBox="0 0 528 527" fill="none" xmlns="http://www.w3.org/2000/svg">';
    parts[1] = IPublicNFTViewBG(viewBG).BG();
    parts[2] = _getTnamePart(info.tName);

    parts[3] = _getIconPart(info.percent);

    parts[4] = _getOtherPart(info.percent, info.isClaim);

    parts[5] = _getDescPart(info.percent, info.isClaim);
    parts[6] = "</svg>";

    return _pack(tokenId, parts);
  }

  function _getInfo(uint256 tokenId) private view returns (Info memory info) {
    (info.tid, info.percent, , ) = IPublicNFT(publicNFT).tokenIdToInfo(tokenId);

    bytes memory data = IFoundry(foundry).tokenData(appId, info.tid);
    (info.tName, info.cid, info.cName, info.followers, info.omf, info.timestamp) = abi.decode(
      data,
      (string, string, string, uint256, uint256, uint256)
    );
    info.isClaim = INFTClaim(nftClaim).isClaim(info.tid);
  }

  function _getTnamePart(string memory tName) private pure returns (string memory part) {
    part = string(
      abi.encodePacked(
        '<text fill="#E5E5E5" style="white-space: pre" font-family="Courier New" font-size="32" font-weight="bold" letter-spacing="-0.011em"><tspan x="264" y="83.5156" text-anchor="middle">@',
        tName,
        "</tspan></text>"
      )
    );
  }

  function _getIconPart(uint256 percent) private pure returns (string memory part) {
    if (percent == 5000) {
      part = '<path d="M180.432 169.602C181.042 162.146 178.506 154.477 172.813 148.784C162.527 138.499 145.793 138.499 135.508 148.784C129.809 154.483 127.273 162.165 127.891 169.629C118.301 169.089 108.529 172.471 101.22 179.78C87.6078 193.392 87.6078 215.543 101.22 229.155C108.529 236.464 118.301 239.846 127.891 239.306C127.273 246.77 129.809 254.452 135.508 260.151C138.582 263.225 144.115 265.372 147.998 266.609L147.831 343.031L132.868 343.031L132.868 329.275C132.826 327.245 131.991 325.312 130.54 323.891C129.09 322.47 129.203 322.189 127.172 322.189C125.141 322.189 124.89 322.47 123.439 323.891C121.989 325.312 121.153 327.245 121.112 329.275L121.112 366.58C121.107 367.602 121.305 368.614 121.693 369.559C122.08 370.505 122.378 371.364 123.099 372.088C123.82 372.812 123.931 373.034 124.874 373.426C125.818 373.818 125.628 373.87 126.65 373.87C127.537 373.87 127.769 373.91 128.086 373.779C129.03 373.387 129.887 372.812 130.607 372.088C131.328 371.364 131.899 370.505 132.287 369.559C132.675 368.614 132.872 367.602 132.868 366.58L132.868 354.787L147.796 354.787L147.735 384.118C147.731 385.653 148.184 387.156 149.035 388.434C149.886 389.712 151.098 390.709 152.516 391.299C153.934 391.888 153.404 391.681 155.121 391.745C156.627 391.446 157.124 390.707 158.21 389.621C158.929 388.904 159.5 388.052 159.89 387.114C160.28 386.176 160.481 385.17 160.482 384.154L160.747 266.791C164.971 265.551 169.703 263.268 172.813 260.151C178.505 254.458 181.042 246.789 180.432 239.332C189.846 239.716 199.383 236.324 206.552 229.155C220.165 215.542 220.164 193.392 206.552 179.78C199.383 172.611 189.845 169.217 180.432 169.602ZM146.48 159.756C150.715 155.521 157.605 155.521 161.841 159.756C166.076 163.991 166.076 170.882 161.841 175.117C157.605 179.352 150.715 179.352 146.48 175.117C142.244 170.882 142.244 163.991 146.48 159.756ZM112.192 190.752C119.755 183.189 132.059 183.189 139.622 190.752C147.185 198.315 147.185 210.619 139.622 218.182C132.059 225.746 119.755 225.746 112.192 218.183C104.629 210.619 104.629 198.315 112.192 190.752ZM161.841 249.179C157.605 253.414 150.715 253.414 146.48 249.179C142.244 244.943 142.244 238.053 146.48 233.818C150.715 229.582 157.605 229.582 161.841 233.818C166.076 238.053 166.076 244.943 161.841 249.179ZM195.58 218.183C188.017 225.746 175.713 225.746 168.15 218.183C160.586 210.619 160.586 198.315 168.15 190.752C175.713 183.189 188.017 183.189 195.58 190.752C203.143 198.315 203.143 210.619 195.58 218.183Z" fill="#FFA500"></path>';
    } else {
      part = '<path d="M337.324 172.981C337.324 163.564 329.665 155.905 320.243 155.905C310.821 155.905 303.162 163.564 303.162 172.981C303.171 176.823 304.475 180.55 306.863 183.56C309.252 186.569 312.585 188.686 316.325 189.567C309.558 203.058 300.616 215.6 295.826 215.6C291.164 215.6 281.767 202.001 272.262 175.943C275.683 174.442 278.593 171.976 280.634 168.847C282.676 165.717 283.76 162.06 283.755 158.324C283.749 153.2 281.71 148.288 278.086 144.665C274.463 141.043 269.55 139.005 264.426 139C259.302 139.005 254.389 141.042 250.765 144.665C247.14 148.287 245.101 153.199 245.093 158.324C245.086 162.067 246.174 165.731 248.223 168.865C250.272 171.998 253.193 174.463 256.625 175.958C246.508 203.989 237.703 214.317 234.089 214.317C227.375 214.317 218.051 201.261 211.984 189.562C215.727 188.683 219.064 186.567 221.455 183.556C223.846 180.545 225.152 176.816 225.162 172.971C225.162 163.554 217.498 155.895 208.081 155.895C198.664 155.895 191 163.554 191 172.971C191 179.425 194.643 184.988 199.942 187.892L203.326 256.069C203.364 256.851 203.59 257.612 203.983 258.289C204.377 258.965 204.927 259.537 205.588 259.957C206.298 260.413 223.448 271 264.426 271C305.405 271 322.554 260.373 323.264 259.923C323.928 259.499 324.479 258.921 324.873 258.24C325.267 257.558 325.491 256.792 325.527 256.005L328.543 187.804C331.195 186.34 333.407 184.193 334.951 181.587C336.495 178.981 337.314 176.01 337.324 172.981ZM312.951 172.981C312.951 168.965 316.222 165.699 320.238 165.699C324.254 165.699 327.525 168.965 327.525 172.981C327.525 177.001 324.254 180.267 320.238 180.267C316.222 180.267 312.951 177.001 312.951 172.981ZM254.882 158.329C254.938 155.837 255.968 153.466 257.75 151.723C259.533 149.981 261.926 149.005 264.419 149.005C266.912 149.005 269.305 149.981 271.088 151.723C272.87 153.466 273.9 155.837 273.956 158.329C273.956 163.201 270.273 167.246 265.386 167.746C265.062 167.776 264.742 167.842 264.431 167.942C264.117 167.843 263.794 167.778 263.467 167.746C261.121 167.525 258.941 166.438 257.354 164.697C255.766 162.955 254.885 160.685 254.882 158.329ZM208.076 165.699C212.096 165.699 215.363 168.965 215.363 172.981C215.363 176.996 212.096 180.267 208.076 180.267C204.056 180.267 200.789 177.001 200.789 172.981C200.789 168.965 204.056 165.699 208.076 165.699ZM315.86 252.758C310.4 255.271 294.308 261.221 264.421 261.221C234.491 261.221 218.389 255.276 212.963 252.783L210.667 206.584C216.812 215.526 225.064 224.116 234.079 224.116C244.006 224.116 254.206 210.316 264.441 183.064C275.063 211.158 285.601 225.394 295.821 225.394C303.892 225.394 311.791 216.373 317.887 206.829L315.86 252.758Z" fill="#FFA500"></path>';
    }
  }

  function _getOtherPart(uint256 percent, bool isClaim) private pure returns (string memory part) {
    if (percent == 5000) {
      if (isClaim) {
        part = '<text fill="#FFA500" style="white-space: pre" font-family="Courier New" font-size="48" font-weight="bold" letter-spacing="-0.011em"><tspan x="248.086" y="278.773">=</tspan></text><text fill="#FFA500" style="white-space: pre" font-family="Courier New" font-size="40" font-weight="bold" letter-spacing="-0.011em"><tspan x="408.916" y="311.38">%</tspan></text><path d="M368.301 315.595C361.644 315.595 355.685 314.396 350.426 311.997C345.166 309.566 340.989 306.24 337.893 302.018C334.831 297.796 333.2 292.967 333 287.53H350.975C351.308 291.56 353.122 294.854 356.417 297.413C359.713 299.939 363.674 301.203 368.301 301.203C371.929 301.203 375.158 300.403 377.988 298.804C380.817 297.205 383.047 294.982 384.678 292.135C386.309 289.289 387.108 286.043 387.075 282.397C387.108 278.687 386.293 275.392 384.628 272.514C382.964 269.635 380.684 267.381 377.788 265.75C374.892 264.086 371.563 263.255 367.802 263.255C364.739 263.223 361.727 263.767 358.764 264.886C355.802 266.005 353.455 267.477 351.724 269.3L334.997 266.661L340.34 216H399.657V230.872H355.669L352.723 256.922H353.322C355.219 254.779 357.899 253.004 361.361 251.597C364.822 250.158 368.617 249.438 372.745 249.438C378.936 249.438 384.462 250.845 389.322 253.66C394.182 256.442 398.01 260.28 400.806 265.174C403.602 270.067 405 275.664 405 281.965C405 288.457 403.436 294.246 400.307 299.332C397.211 304.385 392.9 308.367 387.374 311.277C381.882 314.156 375.524 315.595 368.301 315.595Z" fill="#FFA500"></path>';
      } else {
        part = '<text style="white-space: pre" letter-spacing="-0.011em" font-weight="bold" font-size="48" font-family="Courier New" fill="#FFA500"><tspan x="248.086" y="305.773">=</tspan></text><text fill="#FFA500" style="white-space: pre" font-family="Courier New" font-size="40" font-weight="bold" letter-spacing="-0.011em"><tspan x="408.916" y="252.38">%</tspan></text><path d="M368.301 256.595C361.644 256.595 355.685 255.396 350.426 252.997C345.166 250.566 340.989 247.24 337.893 243.018C334.831 238.796 333.2 233.967 333 228.53H350.975C351.308 232.56 353.122 235.854 356.417 238.413C359.713 240.939 363.674 242.203 368.301 242.203C371.929 242.203 375.158 241.403 377.988 239.804C380.817 238.205 383.047 235.982 384.678 233.135C386.309 230.289 387.108 227.043 387.075 223.397C387.108 219.687 386.293 216.392 384.628 213.514C382.964 210.635 380.684 208.381 377.788 206.75C374.892 205.086 371.563 204.255 367.802 204.255C364.739 204.223 361.727 204.767 358.764 205.886C355.802 207.005 353.455 208.477 351.724 210.3L334.997 207.661L340.34 157H399.657V171.872H355.669L352.723 197.922H353.322C355.219 195.779 357.899 194.004 361.361 192.597C364.822 191.158 368.617 190.438 372.745 190.438C378.936 190.438 384.462 191.845 389.322 194.66C394.182 197.442 398.01 201.28 400.806 206.174C403.602 211.067 405 216.664 405 222.965C405 229.457 403.436 235.246 400.307 240.332C397.211 245.385 392.9 249.367 387.374 252.277C381.882 255.156 375.524 256.595 368.301 256.595Z" fill="#FFA500"></path><text fill="#FFA500" style="white-space: pre" font-family="Courier New" font-size="48" font-weight="bold" letter-spacing="-0.011em"><tspan x="334.407" y="305.369">+</tspan></text><text fill="#FFA500" style="white-space: pre" font-family="Courier New" font-size="24" font-weight="bold" letter-spacing="-0.011em"><tspan x="413.721" y="374.982">%</tspan></text><path d="M349.285 328.596C351.445 328.611 353.546 328.992 355.588 329.74C357.645 330.472 359.496 331.675 361.141 333.346C362.787 335.002 364.094 337.223 365.064 340.008C366.034 342.793 366.519 346.238 366.519 350.343C366.533 354.213 366.122 357.672 365.284 360.721C364.462 363.756 363.279 366.321 361.736 368.417C360.194 370.514 358.335 372.111 356.161 373.211C353.987 374.31 351.541 374.86 348.823 374.86C345.973 374.86 343.446 374.303 341.242 373.189C339.053 372.075 337.283 370.55 335.931 368.615C334.579 366.68 333.749 364.467 333.441 361.975H341.484C341.896 363.763 342.733 365.185 343.997 366.24C345.275 367.281 346.883 367.802 348.823 367.802C351.952 367.802 354.361 366.446 356.051 363.734C357.74 361.022 358.585 357.255 358.585 352.432H358.277C357.557 353.722 356.624 354.836 355.478 355.774C354.332 356.697 353.032 357.408 351.577 357.907C350.138 358.405 348.61 358.654 346.994 358.654C344.349 358.654 341.969 358.024 339.854 356.763C337.753 355.503 336.085 353.773 334.851 351.574C333.632 349.375 333.015 346.861 333 344.032C333 341.1 333.676 338.469 335.027 336.138C336.394 333.793 338.296 331.946 340.735 330.597C343.174 329.234 346.024 328.567 349.285 328.596ZM349.308 335.193C347.721 335.193 346.288 335.581 345.01 336.358C343.747 337.12 342.748 338.161 342.013 339.48C341.293 340.785 340.933 342.244 340.933 343.856C340.948 345.454 341.308 346.905 342.013 348.21C342.733 349.515 343.71 350.548 344.944 351.31C346.193 352.073 347.618 352.454 349.219 352.454C350.409 352.454 351.519 352.226 352.547 351.772C353.575 351.318 354.472 350.687 355.236 349.881C356.014 349.06 356.616 348.129 357.043 347.088C357.483 346.048 357.696 344.948 357.682 343.79C357.682 342.251 357.314 340.829 356.58 339.524C355.86 338.22 354.868 337.172 353.605 336.38C352.356 335.588 350.924 335.193 349.308 335.193Z" fill="#FFA500"></path><path d="M388.803 374.86C385.864 374.86 383.235 374.31 380.913 373.211C378.592 372.097 376.748 370.572 375.382 368.637C374.03 366.702 373.311 364.489 373.222 361.997H381.156C381.303 363.844 382.103 365.354 383.558 366.526C385.012 367.684 386.761 368.263 388.803 368.263C390.404 368.263 391.829 367.897 393.078 367.164C394.327 366.431 395.311 365.412 396.031 364.108C396.751 362.803 397.103 361.315 397.089 359.644C397.103 357.943 396.743 356.434 396.009 355.114C395.274 353.795 394.268 352.762 392.99 352.014C391.712 351.252 390.242 350.871 388.582 350.871C387.231 350.856 385.901 351.105 384.594 351.618C383.286 352.131 382.25 352.805 381.486 353.641L374.104 352.432L376.462 329.212H402.642V336.028H383.227L381.927 347.968H382.192C383.029 346.986 384.212 346.172 385.74 345.527C387.267 344.868 388.942 344.538 390.764 344.538C393.497 344.538 395.935 345.183 398.08 346.473C400.225 347.748 401.915 349.507 403.149 351.75C404.383 353.993 405 356.558 405 359.446C405 362.422 404.31 365.075 402.929 367.406C401.562 369.722 399.66 371.547 397.221 372.881C394.797 374.2 391.991 374.86 388.803 374.86Z" fill="#FFA500"></path>';
      }
    } else {
      string memory style = 'fill="#A3A9AF"';
      if (isClaim) {
        style = 'fill="#FFA500"';
      }
      string[7] memory parts;
      parts[0] = "<text ";
      parts[1] = style;
      parts[
        2
      ] = ' style="white-space: pre" font-family="Courier New" font-size="24" font-weight="bold" letter-spacing="-0.011em"><tspan x="331.721" y="368.387">%</tspan></text><path d="M229.69 296.002C233.229 296.026 236.673 296.65 240.019 297.875C243.39 299.077 246.424 301.047 249.121 303.785C251.817 306.5 253.96 310.14 255.549 314.705C257.139 319.269 257.933 324.915 257.933 331.642C257.957 337.984 257.283 343.654 255.911 348.651C254.562 353.624 252.624 357.829 250.096 361.264C247.568 364.7 244.522 367.318 240.958 369.12C237.395 370.922 233.386 371.823 228.932 371.823C224.261 371.823 220.119 370.91 216.508 369.084C212.92 367.258 210.019 364.76 207.803 361.588C205.588 358.417 204.228 354.789 203.722 350.705H216.905C217.579 353.636 218.951 355.967 221.022 357.696C223.117 359.402 225.753 360.255 228.932 360.255C234.06 360.255 238.009 358.033 240.778 353.588C243.547 349.144 244.931 342.969 244.931 335.065H244.426C243.246 337.179 241.717 339.005 239.839 340.543C237.961 342.056 235.83 343.222 233.446 344.038C231.087 344.855 228.582 345.264 225.934 345.264C221.6 345.264 217.699 344.231 214.232 342.165C210.789 340.098 208.056 337.264 206.034 333.66C204.035 330.056 203.024 325.936 203 321.299C203 316.494 204.108 312.182 206.323 308.362C208.562 304.518 211.68 301.491 215.677 299.281C219.674 297.047 224.345 295.953 229.69 296.002ZM229.726 306.813C227.126 306.813 224.778 307.449 222.683 308.722C220.613 309.972 218.976 311.677 217.772 313.84C216.592 315.978 216.002 318.368 216.002 321.011C216.026 323.63 216.616 326.008 217.772 328.146C218.951 330.284 220.553 331.978 222.575 333.227C224.622 334.477 226.957 335.101 229.582 335.101C231.532 335.101 233.35 334.729 235.035 333.984C236.721 333.239 238.189 332.206 239.442 330.885C240.718 329.54 241.705 328.014 242.403 326.308C243.125 324.603 243.475 322.801 243.45 320.903C243.45 318.38 242.848 316.05 241.645 313.912C240.465 311.774 238.84 310.056 236.769 308.759C234.722 307.461 232.375 306.813 229.726 306.813Z" ';
      parts[3] = style;
      parts[
        4
      ] = '></path><path d="M294.454 371.823C289.639 371.823 285.329 370.922 281.525 369.12C277.72 367.294 274.699 364.796 272.459 361.624C270.244 358.453 269.065 354.825 268.92 350.741H281.922C282.163 353.768 283.475 356.243 285.859 358.165C288.242 360.063 291.108 361.012 294.454 361.012C297.079 361.012 299.414 360.411 301.461 359.21C303.508 358.009 305.121 356.339 306.301 354.201C307.48 352.063 308.058 349.624 308.034 346.885C308.058 344.099 307.468 341.624 306.264 339.462C305.061 337.3 303.411 335.606 301.317 334.381C299.222 333.131 296.814 332.507 294.093 332.507C291.878 332.483 289.699 332.891 287.556 333.732C285.413 334.573 283.716 335.678 282.464 337.047L270.365 335.065L274.229 297.011H317.136V308.182H285.317L283.186 327.75H283.619C284.992 326.14 286.93 324.807 289.434 323.75C291.938 322.669 294.683 322.128 297.669 322.128C302.147 322.128 306.144 323.185 309.659 325.299C313.175 327.39 315.944 330.272 317.966 333.948C319.989 337.624 321 341.828 321 346.561C321 351.438 319.868 355.786 317.605 359.606C315.366 363.402 312.248 366.393 308.251 368.58C304.278 370.742 299.679 371.823 294.454 371.823Z" ';
      parts[5] = style;
      parts[6] = "></path>";

      part = string(abi.encodePacked(parts[0], parts[1], parts[2], parts[3], parts[4], parts[5], parts[6]));
    }
  }

  function _getDescPart(uint256 percent, bool isClaim) private pure returns (string memory part) {
    if (percent == 5000) {
      return _getCNFTDescPart(isClaim);
    } else {
      return _getONFTDescPart(isClaim);
    }
  }

  function _getCNFTDescPart(bool isClaim) private pure returns (string memory part) {
    string[2] memory parts;

    parts[
      1
    ] = '<text fill="#A3A9AF" fill-opacity="0.8" style="white-space: pre" font-family="Courier New" font-size="14" font-weight="bold" letter-spacing="-0.011em"><tspan x="139.61" y="408.726">Castle tax distribution rights</tspan></text>';

    if (!isClaim) {
      parts[
        0
      ] = '<text fill="#A3A9AF" fill-opacity="0.8" style="white-space: pre" font-family="Courier New" font-size="14" font-weight="bold" letter-spacing="-0.011em"><tspan x="236.05" y="352.226">waiting for</tspan><tspan x="170.016" y="369.226">the Lord to reclaim</tspan></text>';
    }

    part = string(abi.encodePacked(parts[0], parts[1]));
  }

  function _getONFTDescPart(bool isClaim) private pure returns (string memory part) {
    string[2] memory parts;

    parts[
      1
    ] = '<text fill="#A3A9AF" fill-opacity="0.8" style="white-space: pre" font-family="Courier New" font-size="14" font-weight="bold" letter-spacing="-0.011em"><tspan x="139.61" y="408.726">Castle tax distribution rights</tspan></text>';

    if (!isClaim) {
      parts[
        0
      ] = '<text fill="#A3A9AF" fill-opacity="0.8" style="white-space: pre" font-family="Courier New" font-size="14" font-weight="bold" letter-spacing="-0.011em"><tspan x="198.389" y="389.726">awaiting reclaim</tspan></text>';
    }

    part = string(abi.encodePacked(parts[0], parts[1]));
  }

  function _pack(uint256 tokenId, string[7] memory parts) private view returns (string memory output) {
    string memory partsOutput = string(
      abi.encodePacked(parts[0], parts[1], parts[2], parts[3], parts[4], parts[5], parts[6])
    );

    string memory json = Base64.encode(
      bytes(
        string(
          abi.encodePacked(
            '{"name": "',
            _name(tokenId),
            '", "description": "',
            _desc(tokenId),
            '", "image": "data:image/svg+xml;base64,',
            Base64.encode(bytes(partsOutput)),
            '"}'
          )
        )
      )
    );
    output = string(abi.encodePacked("data:application/json;base64,", json));
  }

  function _name(uint256 tokenId) private view returns (string memory) {
    Info memory info = _getInfo(tokenId);
    string memory _type = "";
    if (info.percent == 5000) {
      _type = "Key";
    } else {
      _type = "Crown";
    }
    return string(abi.encodePacked("@", info.tName, " - ", _type));
  }

  function _desc(uint256 tokenId) private view returns (string memory) {
    Info memory info = _getInfo(tokenId);
    if (info.percent == 5000) {
      return
        string(
          abi.encodePacked(
            "The Keyholder to receive 100% of the total castle tax from @",
            info.tName,
            "'s trades. Once @",
            info.tName,
            " reclaim the Crown, the Keyholder will then receive 5%."
          )
        );
    } else {
      return
        string(
          abi.encodePacked(
            "This Crown holder to receive 95% of the total castle tax from @",
            info.tName,
            "'s trades once @",
            info.tName,
            " reclaim the Crown."
          )
        );
    }
  }
}
