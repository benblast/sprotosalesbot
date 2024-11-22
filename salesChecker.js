// salesChecker.js
import moment from 'moment'
import dotenv from 'dotenv'
import axios from 'axios'

dotenv.config()

// the sproto contract address
const contractAddress = '0xeeca64ea9fcf99a22806cd99b3d29cf6e8d54925'

// last checked timestamp (starting 5 minutes ago)
let lastCheckedTimestamp = moment().subtract(5, 'minutes').unix()

export async function getNFTSales() {
  try {
    // build the call to Reservoir API
    const options = {
      method: 'GET',
      url: `https://api.reservoir.tools/sales/v4?collection=${contractAddress}&startTimestamp=${lastCheckedTimestamp}`,
      headers: {
        accept: '*/*',
        'x-api-key': process.env.reservoir_api
      }
    }

    console.log('checking for nft sales...')
    // fetch data from the API
    const response = await axios.request(options)

    const sales = response.data.sales
    lastCheckedTimestamp = moment().unix() // update the timestamp for the next request

    return sales
  } catch (error) {
    console.error('Error fetching NFT sales:', error)
    return []
  }
}
