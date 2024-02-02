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
  MONITOR_INTERVAL,
} = process.env as { [key: string]: string };

// Function to send messages in Telegram
async function sendTelegramMessage(message: string = ''): Promise<void> {
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
async function getStockPrice(ticker: string): Promise<number | null> {
  const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${ticker}&apikey=${ALPHAVANTAGE_API_KEY}`;

  try {
    // Step 3: Make request GET, using  axios
    const response = await axios.get(url);
    // Step 4: Извлек цену акции из ответа
    const globalQuote = response.data['Global Quote'];
    // Step 5: Check if the Global Quote object and the price field exist
    if (!globalQuote || !globalQuote['05. price']) {
      throw new Error('Failed to get stock price');
    } // Step 6: Extract the price and convert it to a float
    const price = globalQuote['05. price'];
    return parseFloat(price);
  } catch (error) {
    // Step 7: Log the error and return null if there was an issue
    console.error('Error getting stock price:', error);
    return null;
  }
}

// Function to monitor stock price
async function monitorStockPrice(): Promise<void> {
  let initialPrice = await getStockPrice(STOCK_TICKER);
  let priceDropCount = 0;

  // Schedule job
  const job = schedule.scheduleJob(MONITOR_INTERVAL, async function () {
    const currentPrice = await getStockPrice(STOCK_TICKER);

    // Проверяем, что initialPrice и currentPrice не null
    if (initialPrice !== null && currentPrice !== null) {
      const priceDrop = (initialPrice - currentPrice) / initialPrice;

      if (priceDrop >= parseFloat(ALERT_THRESHOLD)) {
        priceDropCount++;
      } else {
        priceDropCount = 0;
      }

      if (priceDropCount >= 5) {
        const message = `Stock price for ${STOCK_TICKER} has dropped by 2% or more in the last 5 minutes. Current price: $${currentPrice}`;
        await sendTelegramMessage(message);
        priceDropCount = 0; // Reset counter
      }
    } else {
      console.error('Failed to get stock price');
    }

    // Обновляем initialPrice, если он не null
    if (currentPrice !== null) {
      initialPrice = currentPrice;
    }
  });
}

// Start monitoring
monitorStockPrice();
