require("dotenv").config();

const BOT_API       = process.env.BOT_API || '';
const PORT          = process.env.PORT || 3000;
const URL           = process.env.URL || 'https://your-heroku-app.herokuapp.com';

const { Telegraf, Markup } = require('telegraf')
const bot       = new Telegraf(BOT_API);

const config = require('./config');

// Bota start verdiğinizde atılan ilk mesaj
bot.start((ctx) => {
    return ctx.reply("Hey");
});


bot.hears(/selam/ig, async (ctx, next) => {
    await ctx.telegram.sendPhoto(ctx.chat.id,
        'https://www.ajanskirim.com/wp-content/uploads/2019/03/1525995635Merhaba.jpg',
        { caption:  `<b>${ctx.from.first_name}</b>`,  parse_mode: 'HTML' })
    return next();
});


bot.command('botsohbet', async (ctx, next) => {
    
    await bot.telegram.sendDocument(ctx.chat.id, {
        source: './dosyalar/botsohbet.mp4'
    }, {
        filename: 'botsohbet.mp4',
        caption: 'https://t.me/botsohbet'
    })
    return next()
    
});


bot.command('komut', async (ctx, next) => {
    await ctx.telegram.sendMessage(ctx.chat.id, `<b>${ctx.from.first_name}</b>`, { parse_mode: 'HTML' })
    return next();
});


async function searchMessage(ctx){
    await ctx.reply('<b>Hangi arama motorunu kullanmak istiyorsunuz?</b>', {
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard([
            [Markup.button.url('Google', 'www.google.com')],
            [ Markup.button.callback('Yok ben almıyım.', 'kapat'), Markup.button.callback('Diğer', 'all')]
        ])
    })
}


bot.action('all', async (ctx) => {
    await ctx.answerCbQuery()
    await ctx.editMessageText('Yandex, DuckDuckGo, Yahoo ?', Markup.inlineKeyboard([
        [Markup.button.url('Yandex', 'https://yandex.com.tr/'), Markup.button.url('DuckDuckGo', 'https://duckduckgo.com/')],
        [Markup.button.url('Yahoo', 'https://www.yahoo.com/')],
        [Markup.button.callback('Geri', 'geri')]
    ]))
});


bot.action('geri', ctx => {
    ctx.deleteMessage()
    searchMessage(ctx)
});


bot.action('kapat', ctx => {
    ctx.answerCbQuery()
    ctx.deleteMessage()
});


bot.command("buton", ctx => {
    ctx.deleteMessage()
    searchMessage(ctx)
});


function getUserLink(user) {
    const lastName = user.last_name ? ` ${user.last_name}` : '';
    const username = user.username ? ` \nKullanıcı Adı: @${user.username}` : '';
    const userBio = user.bio ? ` \nBio: ${user.bio}` : '';
    return `<a href="tg://user?id=${user.id}">${user.first_name}${lastName}</a>${username}${userBio}\nID: <code>${user.id}</code>`;
}


bot.command("who", async (ctx) => {
    const Id = ctx.message.reply_to_message ? ctx.message.reply_to_message.from.id : ctx.message.from.id;
    const messageId = ctx.message.reply_to_message ? ctx.message.reply_to_message.message_id : null;
    const getUserInfo = await ctx.telegram.getChat(Id);
    const getUser = [getUserInfo].map(getUserLink).join(', ')
    return ctx.replyWithHTML(getUser,  { reply_to_message_id: messageId })
});


bot.use(
    require('./handlers/middlewares'),
    require('./plugin')
);

// Kodlarda hata çıkarsa bunun sayesinde çalışmaya devam eder.
bot.catch(err => res.status(501).send("User- query promise was rejected. Handle according to specific case."));


// Botun kullanıcı adını alan bir kod.
bot.telegram.getMe().then(botInfo => {
    bot.options.username = botInfo.username
    console.log(`Bot Başlatıldı! => ${bot.options.username}`)
});

// Heroku sitesinde botunuzun kullanıcı adı gözükür -> deneyselbot.herokuapp.com
const cb = function(req, res) {
    res.end(`${bot.options.username}`)
}

// Botun webhook ile çalışmasını sağlar.
bot.launch({
    webhook: {
        domain: `${URL}`,
        port: `${PORT}`,
        cb
    }
});

// Bu botumuzu nazikçe durdurmayı etkinleştirir.
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
