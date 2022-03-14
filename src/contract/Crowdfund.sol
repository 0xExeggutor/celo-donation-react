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
    

    // for likes and unlike a campaign
    // Just this required to check if a user has like a campaign or not
    mapping(address => mapping(uint256 => bool)) internal likedCampaign;

    // events for specific functions
    event campaignAdded(address indexed, string name);
    event campaignClosed(address indexed, string name);
    event donationReceived(address indexed, uint256 amount, uint256 campaignIndex);
    event campaignLiked(address indexed, uint256 index);


    function writeCampaign(
        string memory _name,
        string memory _image,
        string memory _description
    ) public {
        campaigns[campaignsLength] = Campaign(
            payable(msg.sender),
            _name,
            _image,
            _description,
            0,
            false
        );
        campaignsLength++;
        emit campaignAdded(msg.sender, _name);
    }

    function readCampaign(uint _index) public view returns(
        address payable,
        string memory,
        string memory,
        string memory,
        uint,
        bool,
        bool // this bool is to check if the user has already liked this particular campaign or not
    ) {
        return (
            campaigns[_index].owner,
            campaigns[_index].name,
            campaigns[_index].image,
            campaigns[_index].description,
            campaigns[_index].amountFunded,
            campaigns[_index].completed,
            likedCampaign[msg.sender][_index] // If user has liked, you can update your frontend accordingly. This essentially replaces the getLikedCampaigns().
        );
    }

    function closeCampaignAndClaim(uint _index) public {
        require(
            campaigns[_index].owner == msg.sender,
            "Only the campaign owner can call this function"
        );
        if (campaigns[_index].amountFunded > 0) { // checking if the campaign is funded or not, if not then no need to take overhead of transfer function.
            require(
            IERC20Token(cUsdTokenAddress).transfer(
                campaigns[_index].owner,
                campaigns[_index].amountFunded
            ),
            "Transfer failed"
        );
        }
        campaigns[_index].completed = true;
        emit campaignClosed(msg.sender, campaigns[_index].name);
    }

    function donateToCampaign(uint _index, uint _amount) public payable {
        // require(IERC20Token(cUsdTokenAddress).balanceOf(address(msg.sender)) > 0);
        // IERC20Token(cUsdTokenAddress).transferFrom(msg.sender, payable(address(this)), _amount);
        require(
            campaigns[_index].owner != msg.sender,
            "Campaign owner cannot donate to its own Campaign"
        );
        require(
            IERC20Token(cUsdTokenAddress).transferFrom(
                msg.sender,
                address(this),
                _amount
            ),
            "Transfer failed"
        );
        campaigns[_index].amountFunded += _amount;
        emit donationReceived(msg.sender, _amount, _index);
    }

    function getCampaignsLength() public view returns (uint) {
        return campaignsLength;
    }

    function likeCampaign(uint _index) public {
        require(_index <= campaignsLength -1);
        userFavouriteCampaigns[msg.sender].push(_index);
        if (likedCampaign[msg.sender][_index] == false) { // checks if campaign already liked, if not then like it
            likedCampaign[msg.sender][_index] = true;
            emit campaignLiked(msg.sender, _index);
        } else { // if yes then dislike it
            likedCampaign[msg.sender][_index] = false;
        }
    }
}