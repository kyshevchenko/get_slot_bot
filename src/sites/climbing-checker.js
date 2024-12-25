import puppeteer from 'puppeteer';

import { climbingSiteURL, timesDates } from './constants.js';

const checkClimblingSlots = async (bot, ownerID) => {
  const browser = await puppeteer.launch({
    // executablePath: '/snap/bin/chromium',
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu',
      '--no-zygote',
      '--single-process',
    ],
  });

  const pages = await browser.pages();
  const page = pages[0];
  await page.setViewport({ width: 1000, height: 3080 * 5 }); // Увеличиваем высоту экрана для загрузки большего количества контента
  await page.goto(climbingSiteURL, { waitUntil: 'networkidle0' });

  setInterval(async () => {
    try {
      await page.reload({ waitUntil: 'networkidle0' });

      const data = await page.evaluate((timesDates) => {
        const availableSlot = [];

        const cards = Array.from(
          document.querySelectorAll('.activity-card-header'),
        );
        for (const card of cards) {
          const cardDate = card.querySelector('.date-time').textContent.trim();
          const availabilityText = card
            .querySelector('.availability-text')
            .textContent.trim();

          if (timesDates.includes(cardDate) && availabilityText !== 'Нет мест')
            availableSlot.push(cardDate);
        }

        return availableSlot;
      }, timesDates);

      if (data.length > 0)
        await bot.telegram.sendMessage(
          ownerID,
          `Запись появилась! ---> \n${data.join('\n')}`,
        );
    } catch (error) {
      console.error(
        'Ошибка при перезагрузке страницы или выполнении проверки:',
        error.message,
      );
      bot.telegram.sendMessage(
        ownerID,
        `Возникла ошибка при перезагрузке страницы на СКАЛОДРОМЕ: ${error.message}`,
      );
    }
  }, 60000);
};

export default checkClimblingSlots;
