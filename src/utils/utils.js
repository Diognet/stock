import axios from 'axios';
const schedule = require('node-schedule');

// Configuration
const TELEGRAM_BOT_TOKEN = 'MY_TELEGRAM_BOT_TOKEN';
const TELEGRAM_CHAT_ID = 'YOUR_TELEGRAM_CHAT_ID';
const STOCK_TICKER = 'AAPL'; // For example, Apple Inc. (AAPL)
const ALERT_THRESHOLD = 0.02; // 2%
const MONITOR_INTERVAL = '*/5 * * * *'; // Every 5 minutes


// function of sending messages in Telegram
 function sendTelegramMessage(message = "") {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  const data = {
    chat_id: TELEGRAM_CHAT_ID,
    text: message,
  };

  try {
    console.log('Sending Telegram message...');
    axios.post(url, data);
    console.log('Telegram message sent successfully.');
  } catch (error) {
    console.error('Error sending message to Telegram:', error);
  }
}

// Функция для получения цены акции
async function getStockPrice() {
  const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${'AAPL'}&apikey=YOUR_ALPHAVANTAGE_API_KEY`;

  try {
    const response = await axios.get(url);
    const price = response.data['Global Quote']['05. price'];
    return parseFloat(price);
  } catch (error) {
    console.error('Ошибка при получении цены акции:', error);
    return null;
  }
}

// Функция для мониторинга цены акции
async function monitorStockPrice() {
  let initialPrice = await getStockPrice();
  let priceDropCount = 0;

  // Задача для планировщика
  const job = schedule.scheduleJob(MONITOR_INTERVAL, async function () {
    const currentPrice = await getStockPrice();
    const priceDrop = (initialPrice - currentPrice) / initialPrice;

    if (priceDrop >= ALERT_THRESHOLD) {
      priceDropCount++;
    } else {
      priceDropCount = 0;
    }

    if (priceDropCount >= 5) {
      const message = `Цена акции ${STOCK_TICKER} упала на 2% или более за 5 минут. Текущая цена: $${currentPrice}`;
      await sendTelegramMessage(message);
      priceDropCount = 0; // Сброс счетчика
    }

    initialPrice = currentPrice;
  });
}

// Запуск мониторинга
monitorStockPrice();
