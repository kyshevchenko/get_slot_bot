import { Telegraf } from 'telegraf';
import dotenv from 'dotenv';

import { getWorkDaysCount, checkAvailabilityBotTime } from './utils.js';
// import checkClimblingSlots from './sites/climbing-checker.js';
import monitorTickets from './sites/monitorTickets.js';

dotenv.config();

const bot = new Telegraf(process.env.BOT_TOKEN);
const ownerID = process.env.OWNER_ID;

bot.telegram.sendMessage(ownerID, 'Бот начал работать.');

const startDate = new Date();
const startDateFormatted = startDate.toLocaleDateString();
const startTimeFormatted = startDate.toLocaleTimeString();
const users = {};

bot.start((ctx) => {
  const userId = ctx.message.from.id;
  const userName = `@${ctx.message.from.username}`;

  if (!users[userId]) {
    users[userId] = {
      tag: userName,
    };

    // ctx.reply(
    //   `Ты добавлен в список рассылки ожидания свободного слота ${reqiredDay} в ${reqiredTime} 👌\n\n${iceRincSite}`,
    // );

    bot.telegram.sendMessage(ownerID, `Подписался: ${userName}, ${userId}`);
  } else {
    ctx.reply(
      `Ты уже был добавлен в список рассылки ранее. Сиди и жди чуда, малыш ✨`,
    );
  }

  if (userId == ownerID) {
    ctx.reply(
      `Бот работает с ${startDateFormatted} ${startTimeFormatted}, дней работы: ${getWorkDaysCount(startDate)}.`,
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

// Проверка слотов на складором
// checkClimblingSlots(bot, ownerID);

// Запускаем проверку слотов на катке
// checkIceRincSlot(users, bot, ownerID);

console.log(
  `Запустили проверку доступности слотов в ${startDateFormatted} ${startTimeFormatted}...`,
);

checkAvailabilityBotTime(
  startDate,
  startDateFormatted,
  startTimeFormatted,
  bot,
  ownerID,
  users,
);

bot.launch();

// Мониторинг билетов на волну
monitorTickets(bot, ownerID, 'https://russpass.ru/excursion/68872317fc46d805f33c4826')
