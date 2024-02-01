import axios from 'axios';
import schedule from 'node-schedule';
import dotenv from 'dotenv';
dotenv.config();

// Configuration
const {
  TELEGRAM_BOT_TOKEN,
  TELEGRAM_CHAT_ID,
  STOCK_TICKER,
  ALPHAVANTAGE_API_KEY,
  ALERT_THRESHOLD,
  MONITOR_INTERVAL
} = process.env;

// Function to send messages in Telegram
async function sendTelegramMessage(message = "") {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  const data = {
    chat_id: TELEGRAM_CHAT_ID,
    text: message,
  };

  try {
    console.log('Sending Telegram message...');
    await axios.post(url, data);
    console.log('Telegram message sent successfully.');
  } catch (error) {
    console.error('Error sending message to Telegram:', error);
  }
}

// Function to get stock price
async function getStockPrice(ticker) {
  const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${ticker}&apikey=${ALPHAVANTAGE_API_KEY}`;

  try {
    const response = await axios.get(url);//perform an asynchronous GET request to the API
    const globalQuote = response.data['Global Quote'];
    if (!globalQuote || !globalQuote['05. price']) {
      throw new Error('Failed to get stock price');
    }
    const price = globalQuote['05. price'];
    return parseFloat(price);
  } catch (error) {
    console.error('Error getting stock price:', error);
    return null;
  }
}

// Function to monitor stock price
async function monitorStockPrice() {
  let initialPrice = await getStockPrice(STOCK_TICKER);
  let priceDropCount = 0;

  // Schedule job
  const job = schedule.scheduleJob(MONITOR_INTERVAL, async function () {
    const currentPrice = await getStockPrice(STOCK_TICKER);
    const priceDrop = (initialPrice - currentPrice) / initialPrice;

    if (priceDrop >= ALERT_THRESHOLD) {
      priceDropCount++;
    } else {
      priceDropCount = 0;
    }

    if (priceDropCount >= 5) {
      const message = `Stock price for ${STOCK_TICKER} has dropped by 2% or more in the last 5 minutes. Current price: $${currentPrice}`;
      await sendTelegramMessage(message);
      priceDropCount = 0; // Reset counter
    }

    initialPrice = currentPrice;
  });
}

// Start monitoring
monitorStockPrice();