// ==========================================
// SHIVAM OS - Telegram Multi-Bot Manager 24/7
// ==========================================

const fs = require("fs");
const path = require("path");
const TelegramBot = require("node-telegram-bot-api");
const gTTS = require("gtts");

// 1. CONFIGURATION & ADMIN IDs (Only your ID is active here)
const ADMIN_IDS = [7353293313]; 
const STATE_FILE = "state.json";
const MAX_BOTS = 20;

// Direct Embedded Bot Tokens (Up to 5 bots)[span_0](start_span)[span_0](end_span)
const BOT_TOKENS = [
  "8611644994:AAHnCJ10aUjPUrl23en1OjC27PiL59izg1g",
  "8808904948:AAEhgDsHraM4WRF3p36jfyfKF_JXOz8d5cE",
  "8543117776:AAG0PWaWQQE5wYM3vSd8a2bHaWhqWVX42eg",
  "8591193736:AAEXBUpUcFB_QhR9RZz2otHgKiGgVFbbFYY",
  "8995808281:AAHcRgToXSpdNs8opWQXeEgDHk-l0Ec9T0o"
];

let chatState = fs.existsSync(STATE_FILE)
  ? JSON.parse(fs.readFileSync(STATE_FILE))
  : {
      admins: [7353293313], 
      delay: { raid: 2000, nc: 2000, vn: 2000, spam: 2000, reply: 2000 },
    };

const EMOJI_SETS = [
  ["😹","🕸️","😁","🧊","🌊"],
  ["🤩","✨","🙀","💦","😩"],
  ["🫣","🌪️","👻","👽","🌀"],
  ["🌬️","⚡","🌠","🕷️","🦋"],
  ["❤️","💙","💚","💛","💜"],
];

const DEFAULT_RAID_TEXTS = [
  "᭄𝒌𝒎𝒋𝒐𝒓 𝒓𝒂𝒏𝒅𝒊𝒌𝒆 𝒃𝒄𝒉𝒆 𝒄𝒉𝒍 𝒂𝒑𝒏𝒊 𝒃𝒉𝒆𝒏 𝒌𝒊 𝒌𝒂𝒍𝒊 𝒄𝒉𝒖𝒕 𝒅𝒊𝒌𝒉𝒂 ✰",
  "Tmkb M Chappal pdnge Rndyke 😂👍🏻😂👍🏻😂👍🏻😂👍🏻 ",
  "𝑐ℎ𝑙 𝑡𝑟𝑖𝑚𝑎 𝑟𝑛𝑑𝑖 𝑟𝑛𝑑𝑖 𝑟𝑛𝑑𝑖 𝑠𝑏𝑠𝑒 𝑏𝑑𝑖 𝑤𝑎𝑙𝑖 𝑟𝑛𝑑𝑖 𝑡𝑟𝑖𝑚𝑎 😹😹",
  "Try mom chudke bolt𝑖 तितली बन उड 𝑗𝑎𝑢🦋🦋🦋🦋🦋 "
];

function saveState() {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(chatState, null, 2));
  } catch (e) {
    console.error("Failed saving state:", e.message);
  }
}

function isAdmin(userId) {
  if (!userId) return false;
  const numId = Number(userId);
  return ADMIN_IDS.includes(numId) || 
         (chatState.admins && chatState.admins.includes(numId)) ||
         (chatState.sudo && chatState.sudo.includes(numId));
}

function mentionFromUserObj(user) {
  if (!user) return "Unknown";
  const exactName = [user.first_name, user.last_name].filter(Boolean).join(" ") || user.username || "User";
  return `[${escapeMarkdown(exactName)}](tg://user?id=${user.id})`;
}

function escapeMarkdown(text) {
  return String(text).replace(/([_\*\[\]\(\)\~\>\#\+\-\=\|\{\}\.\!`])/g, "\\$1");
}

function parseUserRefArg(arg) {
  if (!arg) return null;
  const md = arg.match(/^\[(.+?)\]\(tg:\/\/user\?id=(\d+)\)$/);
  if (md) return { id: Number(md[2]), nameText: md[1] };
  const tg = arg.match(/^tg:\/\/user\?id=(\d+)$/);
  if (tg) return { id: Number(tg[1]), nameText: null };
  if (/^\d+$/.test(arg)) return { id: Number(arg), nameText: null };
  if (arg.startsWith("@")) return { id: null, nameText: arg };
  return null;
}

async function safeSendMessage(bot, chatId, text, replyToMsg, opts = {}) {
  const options = Object.assign({ parse_mode: "Markdown" }, opts); 
  try {
    if (replyToMsg && replyToMsg.message_id) {
      options.reply_to_message_id = replyToMsg.message_id;
    }
    return await bot.sendMessage(chatId, text, options);
  } catch (err) {
    try {
      const { reply_to_message_id, ...fallback } = options;
      return await bot.sendMessage(chatId, text, fallback);
    } catch (e) {
      console.error("safeSendMessage failed:", e.message);
    }
  }
}

async function safeSendVoice(bot, chatId, filePath, replyToMsg) {
  const opts = {};
  if (replyToMsg && replyToMsg.message_id) opts.reply_to_message_id = replyToMsg.message_id;
  try {
    await bot.sendVoice(bot, chatId, filePath, opts);
  } catch (err) {
    try {
      const { reply_to_message_id, ...fallback } = opts;
      await bot.sendVoice(bot, chatId, filePath, fallback);
    } catch (e) {
      console.error("sendVoice fallback failed:", e.message);
    }
  } finally {
    try { fs.unlinkSync(filePath); } catch {}
  }
}

async function fetchDisplayName(bot, chatId, userId) {
  try {
    const member = await bot.getChatMember(chatId, userId);
    const u = member.user;
    return [u.first_name, u.last_name].filter(Boolean).join(" ") || u.username || "User";
  } catch (e) {
    return "User";
  }
}

function ensureChatState(chatId) {
  chatState[chatId] = chatState[chatId] || {};
  return chatState[chatId];
}

process.on("unhandledRejection", (r) => {
  console.error("UnhandledRejection:", r?.stack || r);
});

// ---------- MAIN: START ALL BOTS ----------
BOT_TOKENS.forEach((token, botIndex) => {
  if (!token) return;
  const bot = new TelegramBot(token, { polling: true });
  console.log(`Bot ${botIndex + 1} started successfully.`);

  bot.getMe().then((info) => {
    bot.botInfo = info;
    console.log(`Bot ${botIndex + 1} username=@${info.username}`);
  }).catch((e) => {
    console.warn("Failed to getMe for bot", botIndex + 1, e?.message);
  });

  // Name Change (NC) loop per bot
  setInterval(async () => {
    try {
      const emojiSet = EMOJI_SETS[botIndex % EMOJI_SETS.length];
      for (const chatIdStr of Object.keys(chatState)) {
        const cs = chatState[chatIdStr];
        if (cs && cs.nc && cs.nc.texts && cs.nc.texts.length) {
          const emoji = emojiSet[Math.floor(Math.random() * emojiSet.length)];
          const text = cs.nc.texts[Math.floor(Math.random() * cs.nc.texts.length)];
          const title = `${emoji} ${text}`;
          try { await bot.setChatTitle(Number(chatIdStr), title); } catch (e) {}
        }
      }
    } catch (e) {}
  }, (chatState.delay && chatState.delay.nc) || 2000);

  // Spam loop on the first bot
  if (botIndex === 0) {
    setInterval(async () => {
      try {
        for (const chatIdStr of Object.keys(chatState)) {
          const chatId = Number(chatIdStr);
          const cs = chatState[chatIdStr];
          
          if (cs && cs.spam && cs.spam.remaining > 0) {
            const spam = cs.spam;
            const messageText = escapeMarkdown(spam.text);
            try {
              await safeSendMessage(bot, chatId, messageText, null);
              cs.spam.remaining -= 1;
              if (cs.spam.remaining <= 0) {
                await safeSendMessage(bot, chatId, "🚫 Spam sequence finished.", null);
                cs.spam = null;
              }
              saveState();
            } catch (e) {
              cs.spam = null;
              saveState();
            }
          } else if (cs && cs.spam && cs.spam.remaining <= 0) {
              cs.spam = null;
              saveState();
          }
        }
      } catch (e) {}
    }, (chatState.delay && chatState.delay.spam) || 2000);
  }

  // Message handler for commands and triggers
  bot.on("message", async (msg) => {
    if (!msg || !msg.chat) return;
    const chatId = msg.chat.id;
    const text = msg.text || "";
    const fromId = msg.from && msg.from.id ? Number(msg.from.id) : null;
    const isFromBot = msg.from && bot.botInfo && msg.from.id === bot.botInfo.id;

    ensureChatState(chatId);

    // Command parser
    if (text.startsWith("!")) {
      const parts = text.trim().split(/\s+/);
      const cmd = parts[0].toLowerCase();
      const args = parts.slice(1);

      if (!isAdmin(fromId)) return;

      switch (cmd) {
        case "!help":
          const helpText = "*Commands:*\n" +
            "!raid <target> [text] - start raid[span_1](start_span)[span_1](end_span)\n" +
            "!draid - stop raid[span_2](start_span)[span_2](end_span)\n" +
            "!nc <text1 | text2> - name change loop[span_3](start_span)[span_3](end_span)\n" +
            "!dnc - stop nc[span_4](start_span)[span_4](end_span)\n" +
            "!vn <text> - voice note loop[span_5](start_span)[span_5](end_span)\n" +
            "!dvn - stop vn[span_6](start_span)[span_6](end_span)\n" +
            "!spam <text> <count> - spam messages[span_7](start_span)[span_7](end_span)\n" +
            "!dspam - stop spam[span_8](start_span)[span_8](end_span)\n" +
            "!reply <text> - auto reply[span_9](start_span)[span_9](end_span)\n" +
            "!dreply - stop reply[span_10](start_span)[span_10](end_span)\n" +
            "!delay <feature> <time> - set delay[span_11](start_span)[span_11](end_span)\n" +
            "!sudo <id> - add sudo admin[span_12](start_span)[span_12](end_span)\n" +
            "!rmsudo <id> - remove sudo admin[span_13](start_span)[span_13](end_span)\n";
          await safeSendMessage(bot, chatId, helpText, msg);
          break;

        case "!raid": {
          let target = null;
          let targetArgsOffset = 0;
          if (msg.reply_to_message && msg.reply_to_message.from) {
            target = { id: Number(msg.reply_to_message.from.id), userObj: msg.reply_to_message.from };
          } else if (args.length >= 1) {
            const parsed = parseUserRefArg(args[0]);
            if (parsed && parsed.id) {
              const display = await fetchDisplayName(bot, chatId, parsed.id);
              target = { id: parsed.id, userObj: { id: parsed.id, first_name: display } };
              targetArgsOffset = 1;
            }
          }
          if (!target) {
            await safeSendMessage(bot, chatId, "⚠️ Provide target (reply / id)", msg);
            break;
          }
          let raidText = args.slice(targetArgsOffset).join(" ").trim() || DEFAULT_RAID_TEXTS[Math.floor(Math.random() * DEFAULT_RAID_TEXTS.length)];
          chatState[chatId].raid = { raidText, target };
          saveState();
          await safeSendMessage(bot, chatId, `🔥 Raid started!`, msg);
          break;
        }

        case "!draid":
          chatState[chatId].raid = null;
          saveState();
          await safeSendMessage(bot, chatId, "🔥 Raid stopped.", msg);
          break;

        case "!nc": {
          const rest = args.join(" ").trim();
          if (!rest) {
            await safeSendMessage(bot, chatId, "⚠️ Usage: !nc text1 | text2", msg);
            break;
          }
          const texts = rest.split("|").map(s => s.trim()).filter(Boolean);
          chatState[chatId].nc = { texts };
          saveState();
          await safeSendMessage(bot, chatId, `⚡ NC started!`, msg);
          break;
        }

        case "!dnc":
          chatState[chatId].nc = null;
          saveState();
          await safeSendMessage(bot, chatId, `⚡ NC stopped.`, msg);
          break;

        case "!vn": {
          let target = null;
          let targetArgsOffset = 0;
          if (msg.reply_to_message && msg.reply_to_message.from) {
            target = { id: Number(msg.reply_to_message.from.id), userObj: msg.reply_to_message.from };
          }
          let vnText = args.slice(targetArgsOffset).join(" ").trim() || (msg.reply_to_message && msg.reply_to_message.text) || "Hello";
          chatState[chatId].vn = { text: vnText, target, lang: "ja" };
          saveState();
          await safeSendMessage(bot, chatId, `🎙 VN started!`, msg);
          break;
        }

        case "!dvn":
          chatState[chatId].vn = null;
          saveState();
          await safeSendMessage(bot, chatId, `🎙 VN stopped.`, msg);
          break;

        case "!spam": {
          if (args.length < 2) {
            await safeSendMessage(bot, chatId, "⚠️ Usage: !spam <text> <count>", msg);
            break;
          }
          const count = Number(args[args.length - 1]);
          const spamText = args.slice(0, -1).join(" ").trim();
          if (isNaN(count) || count <= 0 || !spamText) break;
          chatState[chatId].spam = { text: spamText, remaining: count, total: count };
          saveState();
          await safeSendMessage(bot, chatId, `🗣️ Spam started for ${count} messages.`, msg);
          break;
        }

        case "!dspam":
          chatState[chatId].spam = null;
          saveState();
          await safeSendMessage(bot, chatId, `🚫 Spam stopped.`, msg);
          break;

        case "!reply": {
          const replyText = args.join(" ").trim();
          if (!replyText) break;
          chatState[chatId].reply = { text: replyText };
          saveState();
          await safeSendMessage(bot, chatId, `🔁 Auto-reply started.`, msg);
          break;
        }

        case "!dreply":
          chatState[chatId].reply = null;
          saveState();
          await safeSendMessage(bot, chatId, `🚫 Auto-reply stopped.`, msg);
          break;

        case "!sudo": {
          if (args.length < 1) break;
          const parsed = parseUserRefArg(args[0]);
          if (!parsed || !parsed.id) break;
          chatState.sudo = chatState.sudo || [];
          if (!chatState.sudo.includes(parsed.id)) chatState.sudo.push(parsed.id);
          saveState();
          await safeSendMessage(bot, chatId, `✅ Added sudo ID: ${parsed.id}`, msg);
          break;
        }

        case "!rmsudo": {
          if (args.length < 1) break;
          const parsed = parseUserRefArg(args[0]);
          if (!parsed || !parsed.id) break;
          chatState.sudo = (chatState.sudo || []).filter(x => x !== parsed.id);
          saveState();
          await safeSendMessage(bot, chatId, `❌ Removed sudo ID: ${parsed.id}`, msg);
          break;
        }

        default:
          break;
      }
      return;
    }

    // ---------- AUTO TRIGGERS (Raid, Reply, VN) ----------
    const state = chatState[chatId] || {};
    const delay = Object.assign({ raid: 2000, nc: 2000, vn: 2000, spam: 2000, reply: 2000 }, chatState.delay);

    if (isFromBot) return;

    // Raid trigger
    if (state.raid && state.raid.target) {
      const t = state.raid.target;
      let targetId = t?.userObj?.id ? Number(t.userObj.id) : (t?.id ? Number(t.id) : null);
      if (targetId && msg.from && Number(msg.from.id) === targetId) {
        const mentionClickable = mentionFromUserObj(msg.from);
        const raidText = state.raid.raidText;
        setTimeout(() => safeSendMessage(bot, chatId, `${mentionClickable} ${escapeMarkdown(raidText)}`, msg), delay.raid);
      }
    }
    
    // Auto-reply trigger
    if (state.reply && state.reply.text) {
      setTimeout(async () => {
        try { await safeSendMessage(bot, chatId, state.reply.text, msg); } catch (e) {}
      }, delay.reply);
    }

    // Voice Note trigger
    if (state.vn && state.vn.text) {
      const t = state.vn.target || null;
      let shouldReply = false;
      if (!t) shouldReply = true;
      else if (t.id && msg.from && Number(msg.from.id) === Number(t.id)) shouldReply = true;

      if (shouldReply) {
        setTimeout(async () => {
          try {
            await safeSendMessage(bot, chatId, state.vn.text, msg);
            const fileName = path.join(__dirname, `vn_${Date.now()}_${Math.floor(Math.random()*10000)}.mp3`);
            const tts = new gTTS(state.vn.text, state.vn.lang || 'ja');
            await new Promise((res, rej) => tts.save(fileName, (err) => (err ? rej(err) : res())));
            await safeSendVoice(bot, chatId, fileName, msg);
          } catch (e) {}
        }, delay.vn);
      }
    }
  });
});
