import puppeteer from "puppeteer";
import { Telegraf } from "telegraf";
import dotenv from "dotenv";

dotenv.config();
const bot = new Telegraf(process.env.BOT_TOKEN);

const users = {}; // Список пользователей
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
});

// Функция для проверки доступности слотов
const waitAvailableSlot = async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const pages = await browser.pages();
  const page = pages[0];
  await page.setViewport({ width: 1920, height: 1080 });
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
        if (dateElement && dateElement.textContent.trim() === reqiredDay) {
          return true;
        }
      }
      return false;
    }, reqiredDay);

    if (isDayFound) {
      console.log("Слот найден!");

      const usersArr = Object.keys(users); // Список всех пользователей
      for (const userId of usersArr) {
        try {
          await bot.telegram.sendMessage(
            userId,
            `Запись на ${reqiredDay} в ${reqiredTime} появилась!\n
            Поспеши, это уведомление получили еще ${usersArr.length} человек`
          );
        } catch (error) {
          console.error(`Ошибка при отправке сообщения пользователю ${userId}:`, error.message);
        }
      }

      clearInterval(intervalId); // Останавливаем проверку
      await browser.close(); // Закрываем браузер
    } else {
      const fullDate = new Date();
      const date = fullDate.toLocaleDateString();
      const time = fullDate.toLocaleTimeString();
      console.log(date, time, "Дата не найдена, продолжаем искать...");
    }
  }, 5000);
};

// Запускаем проверку слотов один раз
waitAvailableSlot();

bot.launch();
