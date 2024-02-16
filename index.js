const TeleBot = require('telebot')
const mongoose = require('mongoose')
var ObjectId = require('mongoose').Types.ObjectId

const bot = new TeleBot({
    token: '738270129:AAHJxx7NEP6t9_m3n6CSvQ_HhGiHy5MKV8g',
    polling: {
        interval: 100,
        timeout: 0,
        limit: 100,
        retryTimeout: 500,
        proxy: 'http://HohrVp:6H8BY2@81.4.108.157:35357'
    }
})

mongoose.connect('mongodb://dbuser:oFpxqW71@127.0.0.1:27017/proverbs')

const ProverbsSchema = { text: String }
const Proverbs = mongoose.model('proverbs', ProverbsSchema)
const AuthorsSchema = { name: String }
const Authors = mongoose.model('authors', AuthorsSchema)
const CategoriesSchema = { text: String }
const Categories = mongoose.model('categories', CategoriesSchema)
const CountriesSchema = { name: String }
const Countries = mongoose.model('countries', CountriesSchema)

process.on('unhandledRejection', (reason, p) => { console.log('Unhandled Rejection at: Promise', p, 'reason:', reason); })

var state = []

const RM_main = bot.keyboard([
    [bot.button('🔎 Поиск')],
    [bot.button('📁 Категории')],
], { resize: true })

const RM_cat = bot.keyboard([
    [bot.button('👤 Автор')],
    [bot.button('🏳️ Страна')],
    [bot.button('🗄 Категория')],
    [bot.button('◀️ Назад')],
], { resize: true })

const RM_back = bot.keyboard([[bot.button('◀️ Назад')]], { resize: true })

bot.on('text', async function (msg) {
    var uid = msg.from.id
    if (msg.text == "/start") {
        bot.sendMessage(uid, "Добро пожаловатль в нашего бота! Выберете функцию кнопками ниже:", { replyMarkup: RM_main })

    }
    else if (msg.text == "📁 Категории") {

        bot.sendMessage(uid, "Выберете интересующую категорию:", { replyMarkup: RM_cat })
    }
    else if (msg.text == "👤 Автор") {
        var a_list = await Authors.find({}).limit(11)
        var kb = { inline_keyboard: [[]] }
        var l = a_list.length
        if (a_list.length > 10)
            l = a_list.length
        for (var i = 0; i < l; i++)
            kb.inline_keyboard[i] = [{ text: a_list[i].name, callback_data: 'name_' + a_list[i]._id + "_0" }]
        if (a_list.length == 11)
            kb.inline_keyboard[a_list.length] = [{ text: 'Показать ещё', callback_data: 'nextname_1' }]
        bot.sendMessage(uid, "Выберете интересующего автора:", { replyMarkup: kb })
    }
    else if (msg.text == "🏳️ Страна") {
        var a_list = await Countries.find({}).limit(11)
        var kb = { inline_keyboard: [[]] }
        var l = a_list.length
        if (a_list.length > 10)
            l = a_list.length
        for (var i = 0; i < l; i++)
            kb.inline_keyboard[i] = [{ text: a_list[i].name, callback_data: 'country_' + a_list[i]._id + "_0" }]
        if (a_list.length == 11)
            kb.inline_keyboard[a_list.length] = [{ text: 'Показать ещё', callback_data: 'nextcountry_1' }]
        bot.sendMessage(uid, "Выберете интересующую страну:", { replyMarkup: kb })
    }
    else if (msg.text == "🗄 Категория") {
        var a_list = await Categories.find({}).limit(11)
        var kb = { inline_keyboard: [[]] }
        var l = a_list.length
        if (a_list.length > 10)
            l = a_list.length
        for (var i = 0; i < l; i++)
            kb.inline_keyboard[i] = [{ text: a_list[i].text, callback_data: 'cat_' + a_list[i]._id + "_0" }]
        if (a_list.length == 11)
            kb.inline_keyboard[a_list.length] = [{ text: 'Показать ещё', callback_data: 'nextcat_1' }]
        bot.sendMessage(uid, "Выберете интересующую категорию:", { replyMarkup: kb })
    }
    else if (msg.text == "◀️ Назад") {
        bot.sendMessage(uid, "Выберете функцию кнопками ниже:", { replyMarkup: RM_main })
        state[uid] = undefined
    }
    else if (msg.text == "🔎 Поиск") {
        bot.sendMessage(uid, "Введите слово для поиска более 3-х букв:", { replyMarkup: RM_back })
        state[uid] = 1
    }
    else if (state[uid] == 1) {
        if (msg.text.length < 3) {
            bot.sendMessage(uid, "В запросе должно быть более 3-х букв:", { replyMarkup: RM_back })
        }
        else {
            var results = await Proverbs.find({ text: { $regex: ".*" + msg.text + ".*", $options: "$i" } }).limit(11)
            var str = ''
            var l = results.length
            if (l > 10) l = 10
            for (var i = 0; i < l; i++)
                str += results[i].text + '\n\n'
            if (results.length == 0) {
                bot.sendMessage(uid, "Ничего не найдено. Неудача - это часть успеха. Попробуйте ещё раз", { replyMarkup: RM_main })
            }
            else if (results.length > 10) {
                const Markup = bot.inlineKeyboard([[bot.inlineButton('Показать ещё', { callback: 'search_' + msg.text + '_1' })]]);
                bot.sendMessage(uid, str, { replyMarkup: Markup })
            }
            else
                bot.sendMessage(uid, str, { replyMarkup: RM_main })
            state[uid] = undefined
        }

    }
})

bot.on('callbackQuery', async (msg) => {
    var d = msg.data
    var uid = msg.from.id
    var mid = msg.message.message_id
    var type = d.split("_")[0]
    if (type == "search") {
        var text = d.split("_")[1]
        var skip = Number(d.split("_")[2]) * 10
        var results = await Proverbs.find({ text: { $regex: ".*" + text + ".*", $options: "$i" } }).limit(11).skip(skip)
        var str = ''
        var l = results.length
        if (l > 10) l = 10
        for (var i = 0; i < l; i++)
            str += results[i].text + '\n\n'
        if (results.length > 10) {
            const Markup = bot.inlineKeyboard([[bot.inlineButton('Показать ещё', { callback: 'search_' + text + '_' + ((skip / 10) + 1) })]]);
            bot.editMessageText({ chatId: uid, messageId: mid, replyMarkup: Markup }, str)
        }
        else
            bot.editMessageText({ chatId: uid, messageId: mid }, str)
    }
    if (type == "nextname") {
        var skip = Number(d.split("_")[1]) * 10
        var a_list = await Authors.find({}).limit(11).skip(skip)
        var kb = { inline_keyboard: [[]] }
        var l = a_list.length
        if (a_list.length > 10)
            l = a_list.length
        for (var i = 0; i < l; i++)
            kb.inline_keyboard[i] = [{ text: a_list[i].name, callback_data: 'name_' + a_list[i]._id + "_0" }]
        if (a_list.length == 11)
            kb.inline_keyboard[a_list.length] = [{ text: 'Показать ещё', callback_data: 'nextname_' + ((skip / 10) + 1) }]
        bot.editMessageText({ chatId: uid, messageId: mid, replyMarkup: kb }, "Выберете интересующее имя::")
    }

    if (type == "name") {
        var name = d.split("_")[1]
        var skip = Number(d.split("_")[2]) * 10
        var results = await Proverbs.find({ author: new ObjectId(name) }).limit(11).skip(skip)
        var str = ''
        var l = results.length
        if (l > 10) l = 10
        for (var i = 0; i < l; i++)
            str += results[i].text + '\n\n'
        if (results.length > 10) {
            const Markup = bot.inlineKeyboard([[bot.inlineButton('Показать ещё', { callback: 'name_' + name + '_' + ((skip / 10) + 1) })]]);
            bot.editMessageText({ chatId: uid, messageId: mid, replyMarkup: Markup }, str)
        }
        else
            bot.editMessageText({ chatId: uid, messageId: mid }, str)
    }

    if (type == "nextcountry") {
        var skip = Number(d.split("_")[1]) * 10
        var a_list = await Countries.find({}).limit(11).skip(skip)
        var kb = { inline_keyboard: [[]] }
        var l = a_list.length
        if (a_list.length > 10)
            l = a_list.length
        for (var i = 0; i < l; i++)
            kb.inline_keyboard[i] = [{ text: a_list[i].name, callback_data: 'country_' + a_list[i]._id + "_0" }]
        if (a_list.length == 11)
            kb.inline_keyboard[a_list.length] = [{ text: 'Показать ещё', callback_data: 'nextcountry_' + ((skip / 10) + 1) }]
        bot.editMessageText({ chatId: uid, messageId: mid, replyMarkup: kb }, "Выберете интересующую страну:")
    }

    if (type == "country") {
        var name = d.split("_")[1]
        var skip = Number(d.split("_")[2]) * 10
        var results = await Proverbs.find({ country: new ObjectId(name) }).limit(11).skip(skip)
        var str = ''
        var l = results.length
        if (l > 10) l = 10
        for (var i = 0; i < l; i++)
            str += results[i].text + '\n\n'
        if (results.length > 10) {
            const Markup = bot.inlineKeyboard([[bot.inlineButton('Показать ещё', { callback: 'country_' + name + '_' + ((skip / 10) + 1) })]]);
            bot.editMessageText({ chatId: uid, messageId: mid, replyMarkup: Markup }, str)
        }
        else
            bot.editMessageText({ chatId: uid, messageId: mid }, str)
    }

    if (type == "nextcat") {
        var skip = Number(d.split("_")[1]) * 10
        var a_list = await Categories.find({}).limit(11).skip(skip)
        var kb = { inline_keyboard: [[]] }
        var l = a_list.length
        if (a_list.length > 10)
            l = a_list.length
        for (var i = 0; i < l; i++)
            kb.inline_keyboard[i] = [{ text: a_list[i].text, callback_data: 'cat_' + a_list[i]._id + "_0" }]
        if (a_list.length == 11)
            kb.inline_keyboard[a_list.length] = [{ text: 'Показать ещё', callback_data: 'nextcat_' + ((skip / 10) + 1) }]
        bot.editMessageText({ chatId: uid, messageId: mid, replyMarkup: kb }, "Выберете интересующую категорию:")
    }

    if (type == "cat") {
        var name = d.split("_")[1]
        var skip = Number(d.split("_")[2]) * 10
        var results = await Proverbs.find({ category: new ObjectId(name) }).limit(11).skip(skip)
        var str = ''
        var l = results.length
        if (l > 10) l = 10
        for (var i = 0; i < l; i++)
            str += results[i].text + '\n\n'
        if (results.length > 10) {
            const Markup = bot.inlineKeyboard([[bot.inlineButton('Показать ещё', { callback: 'cat_' + name + '_' + ((skip / 10) + 1) })]]);
            bot.editMessageText({ chatId: uid, messageId: mid, replyMarkup: Markup }, str)
        }
        else
            bot.editMessageText({ chatId: uid, messageId: mid }, str)
    }
    bot.answerCallbackQuery(msg.id, `Inline button callback: ${msg.data}`, true);
})

bot.start()