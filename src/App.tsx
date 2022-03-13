import React, { useEffect, useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import Web3 from 'web3'
import { newKitFromWeb3 } from '@celo/contractkit';
import BigNumber from "bignumber.js";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import BeatLoader from "react-spinners/BeatLoader";
import { RiHeart3Fill, RiHeart3Line } from "react-icons/ri";
import './App.css';
import crowdfundAbi from './contract/crowdfund.abi.json';
import erc20Abi from './contract/erc20.abi.json';
import { AbiItem } from 'web3-utils'

const ERC20_DECIMALS = 18;
const CrownfundContractAddress = "0x5f3D4a88E9d28a2436F4e5b6BA26860824Ee2f3b";
const cUSDContractAddress = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1"

// let kit: any;
// let contract: any;

const NewCampaignForm = ({
  complete,
  loadCampaigns,
  setProgress,
  kit,
  contract
}: {
  complete: any,
  loadCampaigns: any,
  setProgress: any,
  kit: any,
  contract: any
}) => {
  const formik = useFormik({
    initialValues: {
      name: '',
      image: '',
      description: '',
    },
    validationSchema: Yup.object({
      name: Yup.string()
        .min(3, 'Must be more than 3 characters')
        .required('Required'),
      image: Yup.string()
        .required('Required'),
      description: Yup.string()
        .required('Required')
        .min(2, 'Description is too short')
        .max(150, 'Description is too long')
    }),
    onSubmit: async values => {
      // alert(JSON.stringify(values, null, 2));
      setProgress(true)
      const newCampaign = [
        values.name,
        values.image,
        values.description,
      ]

      try {
        const result = await contract.methods.writeCampaign(...newCampaign).send({ from: kit.defaultAccount })
        complete()
        toast("Campaign Added");
        await loadCampaigns()
        setProgress(false)
      } catch (e) {
        console.log(e)
        setProgress(false)
      }
    },
  });

  return (
    <form onSubmit={formik.handleSubmit}>

      <label htmlFor="name" className="justify-start">Name</label>
      <input
        className='w-full border-2 rounded-md p-2'
        id="name"
        type="text"
        {...formik.getFieldProps('name')}
      />
      {formik.touched.name && formik.errors.name ? (
        <div className='text-red-600 font-bold'>{formik.errors.name}</div>
      ) : null}

      <label htmlFor="image">Image URL</label>
      <input
        className='w-full border-2 rounded-md p-2'
        id="image"
        type="text"
        {...formik.getFieldProps('image')}
      />
      {formik.touched.image && formik.errors.image ? (
        <div className='text-red-600 font-bold'>{formik.errors.image}</div>
      ) : null}

      <label htmlFor="description">Description</label>
      <input
        className='w-full border-2 rounded-md p-2'
        id="description"
        type="text"
        {...formik.getFieldProps('description')}
      />
      {formik.touched.description && formik.errors.description ? (
        <div className='text-red-600 font-bold'>{formik.errors.description}</div>
      ) : null}

      <button type="submit"
        className="w-full mt-3 rounded-md border-black border-2 p-3 grow hover:bg-stone-800 hover:text-white">Submit</button>
    </form>
  )
}

const DonationForm = ({
  complete,
  loadCampaigns,
  setProgress,
  kit,
  contract,
  approveAndDonate,
  index,
}: {
  complete: any,
  loadCampaigns: any,
  setProgress: any,
  kit: any,
  contract: any,
  approveAndDonate: any,
  index: any,
}) => {
  const formik = useFormik({
    initialValues: {
      donationAmount: '',
    },
    validationSchema: Yup.object({
      donationAmount: Yup.number()
        .required('Required'),
    }),
    onSubmit: async values => {
      console.log(values)
      setProgress(true)
      const amount = new BigNumber(values.donationAmount)
        .shiftedBy(ERC20_DECIMALS)
        .toString()
      console.log(index, amount)


      try {
        const result = await approveAndDonate({ i: index, amount: amount })
        complete()
        await loadCampaigns()
        setProgress(false)
      } catch (e) {
        console.log(e)
        setProgress(false)
      }

    },
  });

  return (
    <form onSubmit={formik.handleSubmit}>

      <input
        className='w-full border-2 rounded-md p-2'
        id="donationAmount"
        type="number"
        {...formik.getFieldProps('donationAmount')}
      />
      {formik.touched.donationAmount && formik.errors.donationAmount ? (
        <div className='text-red-600 font-bold'>{formik.errors.donationAmount}</div>
      ) : null}


      <button type="submit"
        className="w-full mt-3 rounded-md border-black border-2 p-3 grow hover:bg-stone-800 hover:text-white">Submit</button>
    </form>
  )
}

const Campaign = ({
  campaign,
  onCloseAndClaim,
  like,
  unlike,
  liked,
  kit,
  contract,
  openDonation
}: {
  campaign: any,
  onCloseAndClaim: any,
  like: any,
  unlike: any,
  liked: boolean,
  kit: any,
  contract: any,
  openDonation: any,
}) => {
  return (
    <div className="w-full rounded overflow-hidden shadow-lg mt-5">
      {liked ? (
        <RiHeart3Fill
          color='red'
          onClick={unlike}
          size={30}
          className="absolute ml-2 mt-1"
        />
      ) : (
        <RiHeart3Line
          color='red'
          onClick={like}
          size={30}
          className="absolute ml-2 mt-1"
        />
      )}
      <img
        className="w-full h-[30%] xl:h-[50%] object-cover"
        src={campaign.image}
        alt="Campaign"
      />


      <div className="px-6 py-4">
        {
          campaign.completed ? (
            <div className='text-left'>
              <span className="px-2 py-1 text-xs font-bold leading-none bg-stone-600 rounded-full text-white">
                Completed
              </span>
            </div>

          ) : (
            <div className='text-left'>
              <span className="px-2 py-1 text-xs font-bold leading-none bg-green-600 rounded-full text-white">
                Active
              </span>
            </div>
          )
        }
        <p className="text-left font-bold mt-3 rounded-md border-black border-2 p-3 grow ">
          Amount funded: {campaign.amountFunded.shiftedBy(-ERC20_DECIMALS).toFixed(2)} cUSD
        </p>
        <div className="font-bold text-xl mt-1 mb-1 text-left">{campaign.name}</div>
        <p className="text-gray-700 text-base text-left line-clamp-3">
          {campaign.description}
        </p>

      </div>

      {
        !campaign.completed ? (
          <div className="px-6 pb-2">

            {kit != null && kit.defaultAccount != null && campaign.owner == kit.defaultAccount ? (
              <button
                onClick={onCloseAndClaim}
                className="w-full mt-3 rounded-md border-black border-2 p-3 grow hover:bg-stone-800 hover:text-white"
              >
                Complete and claim
                {/* Buy for {product.price.shiftedBy(-ERC20_DECIMALS).toFixed(2)} cUSD */}
              </button>
            ) : (
              <button
                onClick={openDonation}
                className="w-full mt-3 rounded-md border-black border-2 p-3 grow hover:bg-stone-800 hover:text-white"
              >
                Donate here
              </button>
            )}
          </div>
        ) : null
      }
    </div>
  )
}
declare global {
  interface Window {
    celo?: any;
  }
}

const App = () => {
  let [isOpen, setIsOpen] = useState(false);

  let [isOpenDonate, setIsOpenDonate] = useState(false);

  let [kit, setKit] = useState<any>()
  let [contract, setContract] = useState<any>()

  let [balance, setBalance] = useState<any>()
  let [campaigns, setCampaigns] = useState<any[]>([])
  let [likedCampaigns, setLikedCampaigns] = useState<string[]>([])

  let [loading, setLoading] = useState<boolean>(false)
  let [chosenIndex, setChosenIndex] = useState(0)

  useEffect(() => {
    const getWallet = async () => {
      await connectCeloWallet(false)
    }
    document.title = 'Donation for all'
    getWallet()
  }, []);


  useEffect(() => {
    const start = async () => {
      await getBalance()
      await getCampaigns()
      await getLikedCampaigns()
    }

    if (contract != null && kit != null) {
      start()
    }

  }, [contract, kit]);


  const connectCeloWallet = async (popUp: boolean) => {
    if (window.celo) {
      console.log("⚠️ Please approve this DApp to use it.")
      try {
        // console.log(window.celo)
        if (popUp) {
          await window.celo.enable()
        }

        const web3 = new Web3(window.celo)

        let k = newKitFromWeb3(web3)

        const accounts = await k.web3.eth.getAccounts()
        if (accounts.length > 0) {
          console.log(accounts)
          k.defaultAccount = accounts[0]

          let c = new k.web3.eth.Contract(crowdfundAbi as AbiItem[], CrownfundContractAddress)

          setKit(k)
          setContract(c)
        }

      } catch (error) {
        console.log(`${error}.`)
      }
    } else {
      console.log("⚠️ Please install the CeloExtensionWallet.")
    }
  }

  const getBalance = async () => {
    console.log(kit)
    const totalBalance = await kit.getTotalBalance(kit.defaultAccount)
    const cUSDBalance = totalBalance.cUSD.shiftedBy(-ERC20_DECIMALS).toFixed(2)
    setBalance(cUSDBalance)
  }

  const getCampaigns = async () => {
    const _campaignsLength = await contract.methods.getCampaignsLength().call()
    const refreshedCampaigns = []
    for (let i = 0; i < _campaignsLength; i++) {
      let _campaign = await contract.methods.readCampaign(i).call()
      const campaign = {
        index: i,
        owner: _campaign[0],
        name: _campaign[1],
        image: _campaign[2],
        description: _campaign[3],
        amountFunded: new BigNumber(_campaign[4]),
        completed: _campaign[5],
      }
      refreshedCampaigns.push(campaign)
    }
    setCampaigns([...refreshedCampaigns])
  }

  const getLikedCampaigns = async () => {
    const likedCampaigns = await contract.methods.getLikedCampaigns().call()
    console.log('liked', likedCampaigns)
    setLikedCampaigns([...likedCampaigns])
  }

  const likeCampaign = async ({ i }: { i: any }) => {
    try {
      const result = await contract.methods
        .likeCampaign(i)
        .send({ from: kit.defaultAccount })
      toast("Campaign liked")
      await getLikedCampaigns()
    } catch (e) {
      console.log(e)
    }
  }

  const unlikeCampaign = async ({ i }: { i: any }) => {
    try {
      const result = await contract.methods
        .unlikeCampaign(i)
        .send({ from: kit.defaultAccount })
      toast("Campaign unliked")
      await getLikedCampaigns()
    } catch (e) {
      console.log(e)
    }
  }

  const approveAndDonate = async ({ i, amount }: { i: any, amount: any }) => {
    const cUSDConract = new kit.web3.eth.Contract(erc20Abi, cUSDContractAddress)

    try {
      const result = await cUSDConract.methods
        .approve(CrownfundContractAddress, amount)
        .send({ from: kit.defaultAccount })
      toast("cUSD approved")
      const paidResult = await contract.methods
        .donateToCampaign(i, amount)
        .send({ from: kit.defaultAccount })
      toast("Donation done!")
      await getCampaigns()
      await getBalance()
    } catch (e) {
      console.log(e)
    }
  }

  const completeAndClaim = async ({ i }: { i: any }) => {
    try {
      const result = await contract.methods
        .closeCampaignAndClaim(i)
        .send({ from: kit.defaultAccount })
      toast("Complete and claim")
      await getCampaigns()
      await getBalance()
    } catch (e) {
      console.log(e)
    }
  }

  const DonationDialog = () => {
    return (
      <Transition appear show={isOpenDonate} as={Fragment}>
        <Dialog
          as="div"
          className="fixed inset-0 z-10 overflow-y-auto"
          onClose={() => setIsOpenDonate(false)}
        >
          <div className="min-h-screen px-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              // enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />
            </Transition.Child>

            {/* This element is to trick the browser into centering the modal contents. */}
            <span
              className="inline-block h-screen align-middle"
              aria-hidden="true"
            >
              &#8203;
            </span>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">

                {loading ? (
                  <div className='flex place-content-center'>
                    <BeatLoader color={'#000'} loading={true} size={40} />
                  </div>
                ) : (
                  <>
                    <div
                      className='flex justify-between items-center'
                    >
                      <Dialog.Title
                        as="h3"
                        className="w-full text-lg font-medium leading-6 text-gray-900 mb-3"
                      >
                        Donation Amount
                      </Dialog.Title>
                      <button
                        onClick={() => setIsOpenDonate(false)}
                        className="w-1/3 mt-3 rounded-md p-2 grow hover:bg-stone-300 bg-stone-800 text-white hover:text-black">Close</button>
                    </div>

                    <DonationForm
                      complete={() => setIsOpenDonate(false)}
                      loadCampaigns={() => getCampaigns()}
                      setProgress={(loading: boolean) => setLoading(loading)}
                      kit={kit}
                      contract={contract}
                      approveAndDonate={approveAndDonate}
                      index={chosenIndex}
                    />
                  </>
                )}

              </div>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
    )
  }

  const NewProductDialog = () => {
    return (
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog
          as="div"
          className="fixed inset-0 z-10 overflow-y-auto"
          onClose={() => setIsOpen(false)}
        >
          <div className="min-h-screen px-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              // enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />
            </Transition.Child>

            {/* This element is to trick the browser into centering the modal contents. */}
            <span
              className="inline-block h-screen align-middle"
              aria-hidden="true"
            >
              &#8203;
            </span>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">

                {loading ? (
                  <div className='flex place-content-center'>
                    <BeatLoader color={'#000'} loading={true} size={40} />
                  </div>
                ) : (
                  <>
                    <div
                      className='flex justify-between items-center'
                    >
                      <Dialog.Title
                        as="h3"
                        className="w-full text-lg font-medium leading-6 text-gray-900 mb-3"
                      >
                        Add Campaign
                      </Dialog.Title>
                      <button
                        onClick={() => setIsOpen(false)}
                        className="w-1/3 mt-3 rounded-md p-2 grow hover:bg-stone-300 bg-stone-800 text-white hover:text-black">Close</button>
                    </div>

                    <NewCampaignForm
                      complete={() => setIsOpen(false)}
                      loadCampaigns={() => getCampaigns()}
                      setProgress={(loading: boolean) => setLoading(loading)}
                      kit={kit}
                      contract={contract}
                    />
                  </>
                )}

              </div>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
    )
  }

  return (
    <div className="App">
      <ToastContainer />
      <div className="container mx-auto px-20 pb-20">

        <div className="justify-between flex mt-2 items-center">
          <span className="font-bold text-lg">Donation for all</span>
          {kit != null && contract != null ? (<span className="bg-stone-100 border rounded-full p-2">
            <span id="balance">{balance} </span>
            cUSD
          </span>) : (
            <button
              onClick={() => connectCeloWallet(true)}
              className='bg-stone-100 border rounded-full p-2'
            >
              Connect wallet
            </button>)
          }
        </div>

        <button
          onClick={() => {
            setIsOpen(true)
          }}
          className="w-full mt-3 rounded-md border-black border-2 p-3 grow hover:bg-stone-800">Add Campaign</button>

        <div className="grid lg:grid-cols-3 grid-cols-1 gap-4">
          {campaigns.map((campaign, index) => {
            return <Campaign
              campaign={campaign}
              onCloseAndClaim={() => completeAndClaim({ i: index })}
              like={() => likeCampaign({ i: index })}
              unlike={() => unlikeCampaign({ i: index })}
              liked={likedCampaigns.filter(likedIndex => likedIndex === index.toString()).length > 0}
              kit={kit}
              contract={contract}
              openDonation={() => {
                setIsOpenDonate(true)
                setChosenIndex(index)
              }}
            />
          })}
        </div>

        <NewProductDialog />
        <DonationDialog />
      </div>

    </div>
  );
}

export default App;
