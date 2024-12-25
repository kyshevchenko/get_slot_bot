import puppeteer from 'puppeteer';
import { iceRincSiteURL, IceTimeSlots } from './sites/constants.js';

const reqiredDay = '25.12.2024';
const requiredTime = '12:00';

const slotNumber = IceTimeSlots[requiredTime];

// Проверка доступности слотов на катке
const checkIceRincSlot = async (users, bot, ownerID) => {
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
  // await page.setViewport({ width: 1920, height: 1080 });
  await page.goto(iceRincSiteURL, { waitUntil: 'domcontentloaded' });

  setInterval(async () => {
    try {
      // Перезагружаем страницу с тайм-аутом 30 секунд
      await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 });

      // Выполняем проверку на странице
      const isDayFound = await page.evaluate(
        (reqiredDay, slotNumber) => {
          const calendar = document.querySelector('.swiper-calendar');
          if (!calendar) return false;

          const days = Array.from(calendar.querySelectorAll('.swiper-slide'));

          for (const day of days) {
            const dateElement = day.querySelector(
              '.registration-block__subtitle',
            );
            if (dateElement && dateElement.textContent === reqiredDay) {
              const slots = Array.from(
                day.querySelectorAll('.registration-block__time'),
              );
              if (slots[slotNumber].textContent !== 'Мест нет') {
                // тут
                return true;
              }
            }
          }
          return false;
        },
        reqiredDay,
        slotNumber,
      );

      if (isDayFound) {
        const usersArr = Object.keys(users); // Список всех пользователей
        for (const userId of usersArr) {
          try {
            await bot.telegram.sendMessage(
              userId,
              `Запись на ${reqiredDay} в ${requiredTime} появилась! 🎉\n\n
Поспеши, это уведомление получили еще несколько человек, количество охотников за слотами: ${usersArr.length}\n\n
Ты удален из списка рассылки. Для отслеживания доступности слота снова нажми /start`,
            );

            delete users[userId];
          } catch (error) {
            console.error(
              `Ошибка при отправке сообщения пользователю ${userId}:`,
              error.message,
            );
          }
        }
        // clearInterval(intervalId); // Останавливаем интервал, если слот найден
      }
    } catch (error) {
      console.error(
        'Ошибка при перезагрузке страницы или выполнении проверки:',
        error.message,
      );
      bot.telegram.sendMessage(
        ownerID,
        `Возникла ошибка при перезагрузке страницы или выполнении проверки: ${error.message}`,
      );
    }
  }, 10000);
};

export default checkIceRincSlot;
