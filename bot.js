import puppeteer from "puppeteer";
import { Telegraf } from "telegraf";
import dotenv from "dotenv";

dotenv.config();
const bot = new Telegraf(process.env.BOT_TOKEN);

const users = {};
const iceRincLink = "https://katok.sport.moscow/#registration";
const reqiredDay = "01.12.2024";
const reqiredTime = "20:30";

bot.start((ctx) => {
  const userId = ctx.message.from.id;
  const userName = ctx.message.from.username;

  if (!users[userId]) {
    users[userId] = {
      tag: userName,
    };

    ctx.reply(
      `Ты добавлен в список рассылки ожидания свободного слота ${reqiredDay} в ${reqiredTime} 👌\n\n${iceRincLink}`
    );
  } else {
    ctx.reply(
      `Ты уже был добавлен в список рассылки ранее. Сиди и жди чуда, малыш ✨`
    );
  }

  if (userId == process.env.OWNER_ID) {
    const usersList = Object.values(users).map(e => `@${e.tag}`);
    ctx.reply(`Список ждунов: ${usersList}`);
  }
});

bot.command("stop", (ctx) => {
  const userId = ctx.message.from.id;
  if (users[userId]) {
    delete users[userId];

    ctx.reply(`Ты удален из списка рассылки.`);
  } else {
    ctx.reply(`Тебя уже/еще нет в списке рассылки.`);
  }
});

// Функция для проверки доступности слотов
const waitAvailableSlot = async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu',
      '--no-zygote',
      '--single-process'
    ],
  });

  const pages = await browser.pages();
  const page = pages[0];
  // await page.setViewport({ width: 1920, height: 1080 });
  await page.goto(iceRincLink, { waitUntil: "domcontentloaded" });

  console.log("Запустили проверку доступности слотов...");

  const intervalId = setInterval(async () => {
    const isDayFound = await page.evaluate((reqiredDay) => {
      location.reload();

      const calendar = document.querySelector(".swiper-calendar");
      if (!calendar) return false;

      const days = Array.from(calendar.querySelectorAll(".swiper-slide"));

      for (const day of days) {
        const dateElement = day.querySelector(".registration-block__subtitle");
        if (dateElement && dateElement.textContent === reqiredDay) {
          const slots = Array.from(
            day.querySelectorAll(".registration-block__time")
          );
          if (slots[slots.length - 1].textContent !== "Мест нет") {
            return true;
          }
        }
      }
      return false;
    }, reqiredDay);

    if (isDayFound) {
      // console.log("Слот найден!");

      const usersArr = Object.keys(users); // Список всех пользователей
      for (const userId of usersArr) {
        try {
          await bot.telegram.sendMessage(
            userId,
            `Запись на ${reqiredDay} в ${reqiredTime} появилась!\n\n
Поспеши, это уведомление получили еще несколько человек, количество охотников за слотами: ${usersArr.length}\n
${iceRincLink}`
          );
        } catch (error) {
          console.error(
            `Ошибка при отправке сообщения пользователю ${userId}:`,
            error.message
          );
        }
      }

      // clearInterval(intervalId);
      // await browser.close();
    }
    // else {
    //   const fullDate = new Date();
    //   const date = fullDate.toLocaleDateString();
    //   const time = fullDate.toLocaleTimeString();
    //   console.log(date, time, "Дата не найдена, продолжаем искать...");
    // }
  }, 15000);
};

// Запускаем проверку слотов
waitAvailableSlot();

bot.launch();
