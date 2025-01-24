// index.js
import { Telegraf } from 'telegraf'
import fs from 'fs'
import path from 'path'
import { getNFTSales } from './salesChecker.js'
import pkg from 'node-persist'
import axios from 'axios'
const { init, getItem, setItem, values } = pkg
// start the fuckin node-persist storage
await init({ dir: './chat-ids' })

const bot = new Telegraf(process.env.BOT_TOKEN)
const checkIntervalInMs = 300000 //300k milliseconds, 5minutes


bot.command('getchatid', (ctx) => {
  const chatId = ctx.chat.id
  ctx.reply(`the chat id of this channel is: ${chatId}`)
})

bot.command('addsprotobot', async (ctx) => {
    try {
        let currentChatId = ctx.chat.id
        console.log('the chat id of the channel we are trying to add:', currentChatId)
        let chatIds = await pkg.getItem('chat-ids')
        console.log(chatIds)
        // check if the chat id is in db
        if(!chatIds) {
            chatIds = []
        }
        if (!chatIds.includes(currentChatId) || chatIds.length < 1) {
            chatIds.push(currentChatId) // add the chat id to the list
            await pkg.setItem('chat-ids', chatIds) // save the updated list db
            ctx.reply(`chat id ${currentChatId} has been successfully added for sproto gremlin sales bot action extravaganza!`)
            console.log(`added chat ID: ${currentChatId}`, chatIds)
        } else {
            console.log(`this chat id ${currentChatId} is already in the list.`)
        }
    } catch(e) {
        console.log(e, 'THIS IS THE ERROR TO GIVE TO OLDMAN')
    }
})

bot.command('removesprotobot', async (ctx) => {
    try {
        let currentChatId = ctx.chat.id
        console.log('the chat idof the channel we are trying to remove:', currentChatId)

        let chatIds = await pkg.getItem('chat-ids')
        if (!chatIds) {
            chatIds = []
        }

        // check if the chat id is in the list
        if (chatIds.includes(currentChatId)) {
            // remove the chat id from the list
            chatIds = chatIds.filter(id => id !== currentChatId)
            await pkg.setItem('chat-ids', chatIds) // save the updated list in the DB
            ctx.reply(`chat id ${currentChatId} has been successfully removed from the list.`)
            console.log(`removed chat id: ${currentChatId}`, chatIds)
        } else {
            console.log(`chat id ${currentChatId} was not found in the list.`)
        }
    } catch (e) {
        console.log(e, 'error while removing chat id')
    }
})

// main function that checks sales and sends the notification
async function checkAndNotify() {
    console.log('checking')
  const sales = await getNFTSales()
  if(sales.length < 1) return console.log(`no sales in the last ${checkIntervalInMs/1000}seconds`)
  if(!sales) return console.log('smth went wrong fetching sales...')
  for (let i = 0; i < sales.length; i++) {
    const tokenId = sales[i].token.tokenId
    const transactionHash = sales[i].txHash
    const ethPrice = sales[i].price.amount.decimal
    let usdPrice
    if(!sales[i]?.price?.netAmount?.usd) {
        let price = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd')
        if(price.ethereum.usd) {
            usdPrice = (parseInt(price.ethereum.usd)*parseInt(ethPrice))
        } else {
            usdPrice = "unknown"
        }
    } else {
        usdPrice = sales[i].price.netAmount.usd
    }
    const formattedUsdPrice = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(usdPrice)

    // start building a message variable
    const message = `
      💎 Sproto Gremlin #${tokenId} has been adopted for <b>${ethPrice} ETH</b> (${formattedUsdPrice})
      \nhttps://magiceden.io/item-details/ethereum/0xeeca64ea9fcf99a22806cd99b3d29cf6e8d54925/${tokenId}
    `

    // the bottom clickie thing linking to the etherscan tx
    const inlineKeyboard = {
      inline_keyboard: [
        [
          { text: '🔗 Etherscan Tx', url: `https://etherscan.io/tx/${transactionHash}` }
        ]
      ]
    }

    console.log(message)
    let chatIds
    try {
        chatIds = await pkg.getItem('chat-ids')
    } catch(e) {
        console.log(e, 'couldnt get chatids from db')
    }
    if(chatIds.length > 0) {
        for (let chatIdHolder of chatIds) {
            try {
                console.log('sending to:', chatIdHolder)
                // send photo with message to the chat
                await bot.telegram.sendPhoto(
                chatIdHolder,
                { source: fs.createReadStream(path.join('./files', `${tokenId}.png`)) },
                { caption: message, parse_mode: 'HTML', reply_markup: inlineKeyboard }
                )

                // sleep function for use to avoid rate-limiting issues
                const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))
                await sleep(3000) // wait for 3 seconds before sending the next message cuz we dont wanna spam the telegram api
            } catch(e) {
                console.log(e, 'this error happened while trying to send messages to all channels')
            }
        }
    }
  }
}

// call the function every 5 minutes (300000 ms = 5 minutes)
setInterval(checkAndNotify, checkIntervalInMs)

// start the bot
bot.launch().then(() => {
  console.log(`bot is running and will check for new sales every ${checkIntervalInMs/1000} seconds`)
})
