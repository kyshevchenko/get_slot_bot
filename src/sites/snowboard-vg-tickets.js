import puppeteer from 'puppeteer';
import { notifyUsers } from '../utils.js';

export const snowVGTMonitorickets = async (bot, ownerID, siteURL) => {
  console.log('🎫 Starting ticket monitoring...');

  const browser = await puppeteer.launch({
    // headless: false,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--window-size=1200,800',
    ],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 800 });

    while (true) {
      try {
        const randomDelay = Math.random() * 1000 + 8000; // около 2-10 секунд
        console.log(
          `⏰ Next check after: ${(randomDelay / 1000).toFixed(2)} seconds`,
        );
        await new Promise((resolve) => setTimeout(resolve, randomDelay));

        console.log('🌐 Loading page...');
        await page.goto(siteURL, {
          waitUntil: 'load',
          timeout: 30000,
        });

        await new Promise((resolve) => setTimeout(resolve, 1000)); // ждем секунду ответа с бэка и отработки скриптов

        console.log('🔍 Searching for available slots...');

        const availableSlotsCount = await page.evaluate(async () => {
          const slotFields = Array.from(
            document.querySelectorAll('.slot__limit'),
          );

          // Найти первый элемент, у которого есть дочерний <strong> с числом > 1
          return slotFields.find((el) => {
            const strongElement = el.querySelector('strong');

            if (!strongElement) {
              return false;
            }

            const textContent = strongElement.textContent?.trim() || '';

            const numberValue = Number(textContent);

            // Проверяем, что это корректное число и оно > 1
            return !isNaN(numberValue) && numberValue > 1;
          });
        });

        if (availableSlotsCount) {
          console.log('📋 availableSlotsCount: ', availableSlotsCount);
          const slotsCountMessage = `${availableSlotsCount} слотов найдено.`;

          await notifyUsers(ownerID, bot, siteURL, slotsCountMessage);

          await new Promise((resolve) => setTimeout(resolve, 600000)); // задержка 10 минут после уведомления о появивишихся слотах
        } else {
          console.log('❌ Slots not found');
        }

        console.log('🔄 Updating page...');
      } catch (error) {
        if (error.name === 'TimeoutError') {
          console.log('⏰ Timeout error download page, repeate again...');
        } else {
          console.error('💥 Download error page:', error.message);
        }
      }
    }
  } catch (error) {
    console.error('💥 Critical error:', error.message);
    await bot.telegram.sendMessage(
      ownerID,
      `❌ Monitoring error: ${error.message}`,
    );
  } finally {
    await browser.close();
  }
};

export default snowVGTMonitorickets;
