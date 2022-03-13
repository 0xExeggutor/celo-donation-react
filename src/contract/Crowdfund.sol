// SPDX-License-Identifier: MIT  
pragma solidity >=0.7.0 <0.9.0;

interface IERC20Token {
  function transfer(address, uint256) external returns (bool);
  function approve(address, uint256) external returns (bool);
  function transferFrom(address, address, uint256) external returns (bool);
  function totalSupply() external view returns (uint256);
  function balanceOf(address) external view returns (uint256);
  function allowance(address, address) external view returns (uint256);

  event Transfer(address indexed from, address indexed to, uint256 value);
  event Approval(address indexed owner, address indexed spender, uint256 value);
}

contract Crowdfund {

    struct Campaign {
        address payable owner;
        string name;
        string image;
        string description;
        uint amountFunded;
        bool completed;
    }

    address internal cUsdTokenAddress = 0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1;
    uint internal campaignsLength = 0;
    mapping (uint => Campaign) internal campaigns;
    mapping (address => uint[]) userFavouriteCampaigns;

    function writeCampaign(
        string memory _name,
        string memory _image,
        string memory _description
    ) public {
        bool _completed = false;
        uint _amountFunded = 0;
        campaigns[campaignsLength] = Campaign(
            payable(msg.sender),
            _name,
            _image,
            _description,
            _amountFunded,
            _completed
        );
        campaignsLength++;
    }

    function readCampaign(uint _index) public view returns(
        address payable,
        string memory,
        string memory,
        string memory,
        uint,
        bool
    ) {
        return (
            campaigns[_index].owner,
            campaigns[_index].name,
            campaigns[_index].image,
            campaigns[_index].description,
            campaigns[_index].amountFunded,
            campaigns[_index].completed
        );
    }

    function closeCampaignAndClaim(uint _index) public {
        require(campaigns[_index].owner == msg.sender);
        require(
            IERC20Token(cUsdTokenAddress).transfer(
                campaigns[_index].owner,
                campaigns[_index].amountFunded
            ),
            "Transfer failed"
        );
        campaigns[_index].completed = true;
    }

    function donateToCampaign(uint _index, uint _amount) public payable {
        // require(IERC20Token(cUsdTokenAddress).balanceOf(address(msg.sender)) > 0);
        // IERC20Token(cUsdTokenAddress).transferFrom(msg.sender, payable(address(this)), _amount);
        require(campaigns[_index].owner != msg.sender);
        require(
            IERC20Token(cUsdTokenAddress).transferFrom(
                msg.sender,
                address(this),
                _amount
            ),
            "Transfer failed"
        );
        campaigns[_index].amountFunded += _amount;
    }

    function getCampaignsLength() public view returns (uint) {
        return campaignsLength;
    }

    function likeCampaign(uint _index) public {
        require(_index <= campaignsLength -1);
        userFavouriteCampaigns[msg.sender].push(_index);
    }

    function unlikeCampaign(uint _index) public {
        require(_index <= campaignsLength -1);
        for (uint i = 0; i < userFavouriteCampaigns[msg.sender].length; i++) {
            // if index is found in user like array
            if (userFavouriteCampaigns[msg.sender][i] == _index) {
                
                // remove from array
                for (uint j = i; j < userFavouriteCampaigns[msg.sender].length-1; j++){
                    userFavouriteCampaigns[msg.sender][i] = userFavouriteCampaigns[msg.sender][i+1];
                }
                userFavouriteCampaigns[msg.sender].pop();
                break;
            }
        }
    }

    function getLikedCampaigns() public view returns(uint[] memory){
        return userFavouriteCampaigns[msg.sender];
    }
}
