
console.clear();
const config = () => require('./settings/config');
process.on("uncaughtException", console.error);

let makeWASocket, Browsers, useMultiFileAuthState, DisconnectReason,
    fetchLatestBaileysVersion, jidDecode, downloadContentFromMessage,
    jidNormalizedUser, isPnUser;

const loadBaileys = async () => {
    const baileys = await import('@whiskeysockets/baileys');
    makeWASocket = baileys.default;
    Browsers = baileys.Browsers;
    useMultiFileAuthState = baileys.useMultiFileAuthState;
    DisconnectReason = baileys.DisconnectReason;
    fetchLatestBaileysVersion = baileys.fetchLatestBaileysVersion;
    jidDecode = baileys.jidDecode;
    downloadContentFromMessage = baileys.downloadContentFromMessage;
    jidNormalizedUser = baileys.jidNormalizedUser;
    isPnUser = baileys.isPnUser;
};

const pino = require('pino');
const FileType = require('file-type');
const readline = require("readline");
const fs = require('fs');
const chalk = require("chalk");
const path = require("path");

const { Boom } = require('@hapi/boom');
const { getBuffer } = require('./library/function');
const { smsg } = require('./library/serialize');
const { videoToWebp, writeExifImg, writeExifVid, addExif, toPTT, toAudio } = require('./library/exif');

const question = (text) => {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    return new Promise(resolve => {
        rl.question(chalk.yellow(text), answer => {
            resolve(answer);
            rl.close();
        });
    });
};

const clientstart = async () => {
    await loadBaileys();

    const browserOptions = [
        Browsers.macOS('Chrome'),
        Browsers.windows('Edge'),
        Browsers.ubuntu('Chrome'),
        Browsers.baileys('Baileys')
    ];

    const randomBrowser = browserOptions[Math.floor(Math.random() * browserOptions.length)];

    const store = {
        messages: new Map(),
        contacts: new Map(),
        loadMessage: async (jid, id) => store.messages.get(`${jid}:${id}`) || null,
        bind: (ev) => {
            ev.on('messages.upsert', ({ messages }) => {
                for (const msg of messages) {
                    if (msg.key?.remoteJid && msg.key?.id) {
                        store.messages.set(`${msg.key.remoteJid}:${msg.key.id}`, msg);
                    }
                }
            });
        }
    };

    const { state, saveCreds } = await useMultiFileAuthState(`./${config().session}`);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        logger: pino({ level: "silent" }),
        printQRInTerminal: !config().status.terminal,
        auth: state,
        version,
        browser: randomBrowser
    });

    if (config().status.terminal && !sock.authState.creds.registered) {
        const phoneNumber = await question('Enter your WhatsApp number (with country code): ');
        const code = await sock.requestPairingCode(phoneNumber);
        console.log(
            chalk.green('🐆 Dark Panther MD Pairing Code:\n') +
            chalk.bold.green(code)
        );
    }

    store.bind(sock.ev);
    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (connection === 'connecting') {
            console.log(chalk.yellow('🔄 Connecting to WhatsApp...'));
        }

        if (connection === 'open') {
            console.log(chalk.green('✅ Dark Panther MD Connected Successfully'));

            const ownerJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';

            sock.sendMessage(ownerJid, {
                text:
`🐆 *DARK PANTHER MD* IS ONLINE

• Owner : Bashiri
• Prefix : .
• Mode : ${sock.public ? 'Public' : 'Self'}
• Version : 1.0.0

📢 WhatsApp Channel:
https://whatsapp.com/channel/0029VbCTghVBA1f3zXA50Z1z`
            }).catch(() => {});
        }

        if (connection === 'close') {
            const shouldReconnect =
                lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;

            console.log(chalk.red('❌ Connection Closed'));

            if (shouldReconnect) {
                console.log(chalk.yellow('🔁 Reconnecting...'));
                setTimeout(clientstart, 5000);
            } else {
                console.log(chalk.red('🚫 Logged Out'));
            }
        }

        if (qr) {
            console.log(chalk.blue('📱 Scan QR to connect Dark Panther MD'));
        }
    });

    sock.ev.on('messages.upsert', async chatUpdate => {
        try {
            const mek = chatUpdate.messages[0];
            if (!mek.message) return;

            mek.message = Object.keys(mek.message)[0] === 'ephemeralMessage'
                ? mek.message.ephemeralMessage.message
                : mek.message;

            if (!sock.public && !mek.key.fromMe) return;
            if (mek.key.id.startsWith('BAE5')) return;

            const m = await smsg(sock, mek, store);
            require("./message")(sock, m, chatUpdate, store);

        } catch (err) {
            console.log(err);
        }
    });

    sock.public = config().status.public;

    sock.sendText = async (jid, text, quoted = '', options = {}) => {
        return sock.sendMessage(jid, { text, ...options }, { quoted });
    };

    sock.downloadMediaMessage = async (message) => {
        let mime = (message.msg || message).mimetype || '';
        let messageType = message.mtype
            ? message.mtype.replace(/Message/gi, '')
            : mime.split('/')[0];

        const stream = await downloadContentFromMessage(message, messageType);
        let buffer = Buffer.from([]);
        for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
        return buffer;
    };

    return sock;
};

clientstart();

/* Hot Reload */
let file = require.resolve(__filename);
fs.watchFile(file, () => {
    fs.unwatchFile(file);
    console.log(chalk.redBright("🔁 index.js updated"));
    delete require.cache[file];
    require(file);
});
