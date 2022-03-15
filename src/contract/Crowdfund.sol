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
        uint totalAmountFunded;
        uint amountAvailableForWithdrawal;
        uint amountWithdrawn;
        uint likes;
        bool completed;
        mapping(address => bool) hasLiked;
    }

    address internal cUsdTokenAddress = 0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1;

    //Variable used for the index 
    uint internal campaignsLength = 0;

    //Mapping of index ot the campaign
    mapping (uint => Campaign) internal campaigns;

    //Maps the address of the user to the array of index of the campaigns that he has liked
    mapping (address => uint[]) userFavouriteCampaigns;

    //Modifier which only allows the user to access
    modifier onlyOwner(uint _index){
        require(msg.sender == campaigns[_index].owner);
        _;
    }

    //Event that will fire when a new campaign is added
    event newCampaign(address indexed owner, uint index);

    //Event that will fire when a campaign gets a new donation
    event newDonation(address indexed owner, uint index, uint amount, address indexed donator);

    ////Event that will fire when a campaign is closed
    event campaignClosed(address indexed owner, uint index, uint TotalAmountCollected);

    //Function that creates a campaign and assigns it to the campaigns mapping
    function writeCampaign(
        string memory _name,
        string memory _image,
        string memory _description
    ) public {
        Campaign storage campaign = campaigns[campaignsLength];
        campaign.owner = payable( msg.sender);
        campaign.name = _name;
        campaign.image = _image;
        campaign.description = _description;

        emit newCampaign(msg.sender, campaignsLength);

        campaignsLength++;

    }


    //Function that retrieves all the properties of the campaign 
    function readCampaign(uint _index) public view returns(
        address payable,
        string memory,
        string memory,
        string memory,
        uint,
        uint,
        uint,
        uint,
        bool,
        bool
    ) {
        return(
            campaigns[_index].owner,
            campaigns[_index].name,
            campaigns[_index].image,
            campaigns[_index].description,
            campaigns[_index].totalAmountFunded,
            campaigns[_index].amountAvailableForWithdrawal,
            campaigns[_index].amountWithdrawn,
            campaigns[_index].likes,
            campaigns[_index].completed,
            campaigns[_index].hasLiked[msg.sender]
        );
    }

    //Function using which the campaign owner can claim the money available money and close the campaign
    function closeCampaignAndClaim(uint _index) public onlyOwner(_index){
        require(
            IERC20Token(cUsdTokenAddress).transfer(
                campaigns[_index].owner,
                campaigns[_index].amountAvailableForWithdrawal
            ),
            "Transfer failed"
        );
        campaigns[_index].completed = true;

        emit campaignClosed(msg.sender, _index, campaigns[_index].totalAmountFunded);
    }


    /*Function using which the poster of the campaign can claim the money funded to the 
      campaign without closing the campaign  */
    function claimMoney(uint _index) public onlyOwner(_index){
        Campaign storage campaign = campaigns[_index];
        require(
            IERC20Token(cUsdTokenAddress).transfer(
                campaign.owner,
                campaign.amountAvailableForWithdrawal
            ),
            "Transfer failed"
        );
        campaign.amountWithdrawn += campaign.amountAvailableForWithdrawal;
        campaign.amountAvailableForWithdrawal = 0;
    }


    //Function used by the users to donate to the campaign using Cusd token
    function donateToCampaign(uint _index, uint _amount) public payable {
        // require(IERC20Token(cUsdTokenAddress).balanceOf(address(msg.sender)) > 0);
        // IERC20Token(cUsdTokenAddress).transferFrom(msg.sender, payable(address(this)), _amount);
        require(campaigns[_index].owner != msg.sender);
        require(campaigns[_index].completed == false, "The campaign is closed");
        require(
            IERC20Token(cUsdTokenAddress).transferFrom(
                msg.sender,
                address(this),
                _amount
            ),
            "Transfer failed"
        );
        campaigns[_index].totalAmountFunded += _amount;
        campaigns[_index].amountAvailableForWithdrawal += _amount;

        emit newDonation(campaigns[_index].owner, _index, _amount, msg.sender);

    }

    function getCampaignsLength() public view returns (uint) {
        return campaignsLength;
    }

    //Function that will add the index of the campaign to the hasLiked mapping of the user and also increases the liked of the campaign
    function likeCampaign(uint _index) public {
        require(_index <= campaignsLength -1);
        require(campaigns[_index].hasLiked[msg.sender] == false, "You can like the campaign only once");

        campaigns[_index].likes += 1;
        userFavouriteCampaigns[msg.sender].push(_index);
    }

    //Function using which the users can unlike the campaign and remove the campaign from their list
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
        campaigns[_index].likes -= 1;
    }

    /*Function that will return all the indexes of the campaigns the user has liked
       Using this we can render only the liked camapaigns for the user separately for 
       him to track */
    function getLikedCampaigns() public view returns(uint[] memory){
        return userFavouriteCampaigns[msg.sender];
    }
}

/*
    1)Extended the concept of claiming the funds whenever the user wishes
        1.1) made a separate function where the user could claim the money without 
            the need to close the campaign
        1.2)Added moneyClaimed and the money available to be claimed properties to the 
            struct so that the data will be visible to all the users of the dapp
    
    2)Made the likes publicly visible as the users can see the importance of the campaign 
      by the number of likes it has.
        2.1)Refactored parts of the code to make this feature work securely
    3)Added useful events
    4)Added comments on the code for documentation
*/
