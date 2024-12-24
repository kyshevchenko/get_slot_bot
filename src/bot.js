import puppeteer from 'puppeteer';
import { Telegraf } from 'telegraf';
import dotenv from 'dotenv';

import { getWorkDaysCount } from '../utils';

dotenv.config();

const bot = new Telegraf(process.env.BOT_TOKEN);
const ownerID = process.env.OWNER_ID;
const iceRincSite = process.env.ICE_RINC_SITE;

bot.telegram.sendMessage(ownerID, 'Бот начал работать.');

const date = new Date();
const startBotDate = date.toLocaleDateString();
const startBotTime = date.toLocaleTimeString();
const users = {};

const reqiredDay = '01.12.2024';
const reqiredTime = '16:00';

bot.start((ctx) => {
  const userId = ctx.message.from.id;
  const userName = `@${ctx.message.from.username}`;

  if (!users[userId]) {
    users[userId] = {
      tag: userName,
    };

    ctx.reply(
      `Ты добавлен в список рассылки ожидания свободного слота ${reqiredDay} в ${reqiredTime} 👌\n\n${iceRincSite}`,
    );

    bot.telegram.sendMessage(ownerID, `Подписался: ${userName}, ${userId}`);
  } else {
    ctx.reply(
      `Ты уже был добавлен в список рассылки ранее. Сиди и жди чуда, малыш ✨`,
    );
  }

  if (userId == ownerID) {
    ctx.reply(
      `Бот работает с ${startBotDate} ${startBotTime}, дней работы: ${getWorkDaysCount(date)}.`,
    );
  }
});

bot.command('stop', (ctx) => {
  const userId = ctx.message.from.id;
  const userName = `@${ctx.message.from.username}`;

  if (users[userId]) {
    delete users[userId];

    ctx.reply(`Ты удален из списка рассылки.`);
    bot.telegram.sendMessage(ownerID, `Отписался: ${userName}, ${userId}`);
  } else {
    ctx.reply(`Тебя уже/еще нет в списке рассылки.`);
  }
});

// Функция для проверки доступности слотов
const waitAvailableSlot = async () => {
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
  await page.goto(iceRincSite, { waitUntil: 'domcontentloaded' });

  console.log(
    `Запустили проверку доступности слотов в ${startBotDate} ${startBotTime}...`,
  );

  setInterval(async () => {
    try {
      // Перезагружаем страницу с тайм-аутом 30 секунд
      await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 });

      // Выполняем проверку на странице
      const isDayFound = await page.evaluate((reqiredDay) => {
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
            if (slots[slots.length - 3].textContent !== 'Мест нет') {
              return true;
            }
          }
        }
        return false;
      }, reqiredDay);

      if (isDayFound) {
        const usersArr = Object.keys(users); // Список всех пользователей
        for (const userId of usersArr) {
          try {
            await bot.telegram.sendMessage(
              userId,
              `Запись на ${reqiredDay} в ${reqiredTime} появилась! 🎉\n\n
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
  }, 30000);
};

// Запускаем проверку слотов
waitAvailableSlot();

bot.launch();
