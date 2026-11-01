// tg_fixed_reply.js - fixed VN + help + safer bot initialization + !spam/!reply commands
// Updated:
// - !spam simplified to just spam a fixed text a fixed number of times globally (no target/mention).
// - NEW: Added !reply and !dreply for global text auto-reply to all new messages.
// - NEW: Added !delay reply.

const fs = require("fs");
const path = require("path");
const TelegramBot = require("node-telegram-bot-api");
const gTTS = require("gtts");

// ---------- CONFIG ----------
const STATE_FILE = "state.json";
const TOKENS_FILE = "8808904948:AAEhgDsHraM4WRF3p36jfyfKF_JXOz8d5cE,8543117776:AAG0PWaWQQE5wYM3vSd8a2bHaWhqWVX42eg,8591193736:AAEXBUpUcFB_QhR9RZz2otHgKiGgVFbbFYY,8915135430:AAFqLmK-BVx29G4UMq-PROcgWEBRqWpHGEA"; // put your tokens here, one per line; keep this file private
const MAX_BOTS = 20; // will load at most 20 tokens

let chatState = fs.existsSync(STATE_FILE)
  ? JSON.parse(fs.readFileSync(STATE_FILE))
  : {
      // NOTE: Admins should be set using !sudo after initialization, or manually
      // The IDs below are placeholders
      admins: [8369554785, 6580991809], 
      // Added 'reply' delay
      delay: { raid: 2000, nc: 2000, vn: 2000, spam: 2000, reply: 2000 },
    };

// Load tokens from tokens.txt (safe: tokens not stored in source code)
let BOT_TOKENS = [];
try {
  if (fs.existsSync(TOKENS_FILE)) {
    BOT_TOKENS = fs.readFileSync(TOKENS_FILE, "utf8")
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(Boolean)
      .slice(0, MAX_BOTS);
  } else {
    console.warn(`${TOKENS_FILE} not found - no bots will start. Create ${TOKENS_FILE} with one token per line (keep it private).`);
  }
} catch (e) {
  console.error("Failed to read tokens file:", e && e.message ? e.message : e);
}

// Emoji sets per bot (now 20 sets so you can run up to 20 bots and each gets its own set)
const EMOJI_SETS = [
  ["😹","🕸️","😁","🧊","🌊"],
  ["🤩","✨","🙀","💦","😩"],
  ["🫣","🌪️","👻","👽","🌀"],
  ["🌬️","⚡","🌠","🕷️","🦋"],
  ["❤️","💙","💚","💛","💜"],
  ["🍻","🦖","🦅","🐉","🪼"],
  ["🌍","🌎","🌏","🌌","🪐"],
  ["🍕","🍔","🍟","🌭","🥪"],
  ["🎧","🎸","🥃","🍺","🥤"],
  ["🚀","✈️","🚁","🤧","😈"],
  ["🪄","🧿","🔮","✨","🌟"],
  ["🦄","🌈","🎠","🧸","💫"],
  ["🐱","🐶","🐼","🦊","🦁"],
  ["🍩","🍪","🍰","🧁","🍫"],
  ["📚","📝","🧠","🔖","📖"],
  ["🏀","⚽","🏈","🎯","🥊"],
  ["💻","🖱️","⌨️","🧩","📡"],
  ["🌿","🍃","🌸","🌺","🌼"],
  ["🏝️","🗺️","🏔️","🌋","🏕️"],
  ["🎮","🕹️","👾","🧩","🛸"],
];

// Fixed default raid texts (10) - kept as-is
const DEFAULT_RAID_TEXTS = [
  "᭄𝒌𝒎𝒋𝒐𝒓 𝒓𝒂𝒏𝒅𝒊𝒌𝒆 𝒃𝒄𝒉𝒆 𝒄𝒉𝒍 𝒂𝒑𝒏𝒊 𝒃𝒉𝒆𝒏 𝒌𝒊 𝒌𝒂𝒍𝒊 𝒄𝒉𝒖𝒕 𝒅𝒊𝒌𝒉𝒂 ✰",
  "Tmkb M Chappal pdnge Rndyke 😂👍🏻😂👍🏻😂👍🏻😂👍🏻 ",
  "𝑐ℎ𝑙 𝑡𝑟𝑖𝑚𝑎 𝑟𝑛𝑑𝑖 𝑟𝑛𝑑𝑖 𝑟𝑛𝑑𝑖 𝑠𝑏𝑠𝑒 𝑏𝑑𝑖 𝑤𝑎𝑙𝑖 𝑟𝑛𝑑𝑖 𝑡𝑟𝑖𝑚𝑎 😹😹",
  "Try mom chudke bolt𝑖 तितली बन उड 𝑗𝑎𝑢🦋🦋🦋🦋🦋 ",
  "𝘵𝘦𝘳𝘪 𝘮𝘢 𝘬𝘢𝘳𝘢𝘯 𝘈𝘶𝘫𝘭𝘢 𝘬𝘦 𝘨𝘢𝘯𝘦 𝘱𝘦 𝘤udengi                               ~ᵐᵃʰᵒˡ ᵖᵘʳᵃ ʷᵃᵛʸ 🎶😂👌🏻 ",
  "chup dalit की औलाद तेरी maa रंगबिरंगी रंडी 🔥🔥",
  "𝒄𝒉𝒍 𝒓𝒂𝒏𝒅𝒊𝒌𝒆 𝒃𝒄𝒉𝒆 𝒂𝒑𝒏𝒊 𝒎𝒂 𝒌𝒊 𝒄𝒉𝒖𝒄𝒉𝒊𝒚𝒂 𝒅𝒊𝒌𝒉𝒂✰᭄   ",
  "𝐂ʜʟ ᴋᴍᴊᴏʀ 𝙍𝘼𝙉𝘿𝙄𝙆𝙀 𝘽𝘾ʜᴇ तेरी ma की chut 🤢🤢",
  "᭄𝒕𝒆𝒓𝒊 𝒎𝒂𝒂𝒌𝒐 𝒌𝒐 𝒈𝒂𝒏𝒏𝒆 𝒌𝒊 𝒋𝒖𝒊𝒄𝒆 𝒘𝒂𝒍𝒊 𝒎𝒂𝒄𝒉𝒊𝒏𝒆 𝒎 𝒇𝒂𝒔𝒂𝒌𝒓 𝒄𝒐𝒅𝒖𝒏𝒈𝒂 ✰",
  "𝐀ᴜᴛᴏ 𝐖ᴀʟᴇ ᴋᴇ 𝐁ᴇᴛᴇ तेरी ma रंडीchut रंडी᭄"
];

// ---------- HELPERS ----------
function saveState() {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(chatState, null, 2));
  } catch (e) {
    console.error("Failed saving state:", e.message);
  }
}

function isAdmin(userId) {
  // Check both admins and sudo list
  return (chatState.admins && chatState.admins.includes(Number(userId))) ||
         (chatState.sudo && chatState.sudo.includes(Number(userId)));
}

function mentionFromUserObj(user) {
  if (!user) return "Unknown";
  const exactName = [user.first_name, user.last_name].filter(Boolean).join(" ") || user.username || "User";
  // The name text must be escaped for Markdown V1
  return `[${escapeMarkdown(exactName)}](tg://user?id=${user.id})`;
}

function escapeMarkdown(text) {
  // Escapes characters for Markdown V1
  return String(text).replace(/([_\*\[\]\(\)\~\>\#\+\-\=\|\{\}\.\!`])/g, "\\$1");
}

function parseUserRefArg(arg) {
  if (!arg) return null;
  const md = arg.match(/^\[(.+?)\]\(tg:\/\/user\?id=(\d+)\)$/);
  if (md) {
    return { id: Number(md[2]), nameText: md[1] };
  }
  const tg = arg.match(/^tg:\/\/user\?id=(\d+)$/);
  if (tg) return { id: Number(tg[1]), nameText: null };
  if (/^\d+$/.test(arg)) return { id: Number(arg), nameText: null };
  if (arg.startsWith("@")) return { id: null, nameText: arg };
  return null;
}

async function safeSendMessage(bot, chatId, text, replyToMsg, opts = {}) {
  // Default to Markdown V1 for compatibility
  const options = Object.assign({ parse_mode: "Markdown" }, opts); 
  try {
    if (replyToMsg && replyToMsg.message_id) {
      options.reply_to_message_id = replyToMsg.message_id;
      return await bot.sendMessage(chatId, text, options);
    } else {
      return await bot.sendMessage(chatId, text, options);
    }
  } catch (err) {
    // Fallback if replying to a message fails (e.g., message deleted)
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
    await bot.sendVoice(chatId, filePath, opts);
  } catch (err) {
    console.error("sendVoice failed, retrying without reply:", err.message);
    // Fallback if replying to a message fails
    try {
      const { reply_to_message_id, ...fallback } = opts;
      await bot.sendVoice(chatId, filePath, fallback);
    } catch (e) {
      console.error("sendVoice fallback failed:", e.message);
    }
  } finally {
    try { fs.unlinkSync(filePath); } catch {} // Cleanup temp file
  }
}

function parseDelay(raw) {
  if (!raw) return null;
  raw = String(raw).trim();
  if (raw.endsWith("ms")) return Number(raw.slice(0, -2));
  if (raw.endsWith("s")) return Number(raw.slice(0, -1)) * 1000;
  const n = Number(raw);
  return isNaN(n) ? null : n;
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
  console.error("UnhandledRejection:", r && r.stack ? r.stack : r);
});

// ---------- MAIN: create bots ----------
BOT_TOKENS.forEach((token, botIndex) => {
  if (!token) return;
  const bot = new TelegramBot(token, { polling: true });
  console.log(`Bot ${botIndex + 1} started`);

  // Fetch and store bot info asap to avoid matching issues later
  bot.getMe().then((info) => {
    bot.botInfo = info;
    console.log(`Bot ${botIndex + 1} id=${info.id} username=${info.username}`);
  }).catch((e) => {
    console.warn("Failed to getMe for bot", botIndex + 1, e && e.message);
  });

  // NC (name-change) loop per bot
  setInterval(async () => {
    try {
      // Rotate through emoji sets by botIndex so each bot gets its own set
      const emojiSet = EMOJI_SETS[botIndex % EMOJI_SETS.length];
      for (const chatIdStr of Object.keys(chatState)) {
        const cs = chatState[chatIdStr];
        if (cs && cs.nc && cs.nc.texts && cs.nc.texts.length) {
          const emoji = emojiSet[Math.floor(Math.random() * emojiSet.length)];
          const text = cs.nc.texts[Math.floor(Math.random() * cs.nc.texts.length)];
          const title = `${emoji} ${text}`;
          try {
            await bot.setChatTitle(Number(chatIdStr), title);
          } catch (e) {
            // ignore errors for chats where bot can't set title
          }
        } else if (cs && cs.nc && cs.nc.text) {
          const emoji = emojiSet[Math.floor(Math.random() * emojiSet.length)];
          const title = `${emoji} ${cs.nc.text}`;
          try { await bot.setChatTitle(Number(chatIdStr), title); } catch (e) {}
        }
      }
    } catch (e) {}
  }, (chatState.delay && chatState.delay.nc) || 2000);

  // SPAM loop per bot (handles existing spam jobs)
  if (botIndex === 0) { // Only run the spam/reply loops on the first bot instance
    setInterval(async () => {
      try {
        for (const chatIdStr of Object.keys(chatState)) {
          const chatId = Number(chatIdStr);
          const cs = chatState[chatIdStr];
          
          // Spam logic
          if (cs && cs.spam && cs.spam.remaining > 0) {
            const spam = cs.spam;
            
            const messageText = escapeMarkdown(spam.text);
            
            try {
              // Send the spam message
              await safeSendMessage(bot, chatId, messageText, null);
              
              // Decrement remaining count
              cs.spam.remaining -= 1;
              if (cs.spam.remaining <= 0) {
                console.log(`Spam finished for chat ${chatId}`);
                await safeSendMessage(bot, chatId, "🚫 Spam sequence finished.", null);
                cs.spam = null;
              }
              
              saveState();
            } catch (e) {
              console.error(`Spam sending failed for chat ${chatId}:`, e.message);
              // Stop spam if we encounter errors repeatedly
              if (e.message && (e.message.includes("chat not found") || e.message.includes("forbidden"))) {
                cs.spam = null;
                saveState();
              }
            }
          } else if (cs && cs.spam && cs.spam.remaining <= 0) {
              cs.spam = null;
              saveState();
          }
        }
      } catch (e) {
        console.error("Global spam loop failed:", e.message);
      }
    }, (chatState.delay && chatState.delay.spam) || 2000); // Uses global chatState.delay.spam
  }

  // message handler
  bot.on("message", async (msg) => {
    if (!msg || !msg.chat) return;
    const chatId = msg.chat.id;
    const text = msg.text || "";
    const fromId = msg.from && msg.from.id ? Number(msg.from.id) : null;
    const isFromBot = msg.from && bot.botInfo && msg.from.id === bot.botInfo.id;

    ensureChatState(chatId);

    // commands
    if (text.startsWith("!")) {
      const parts = text.trim().split(/\s+/);
      const cmd = parts[0].toLowerCase();
      const args = parts.slice(1);

      if (!isAdmin(fromId)) return;

      switch (cmd) {
        case "!help":
          const helpText = "*Commands:*\n" +
            "!raid <target> [text] - start raid on target (reply or activation methods)\n" +
            "!draid - stop raid\n" +
            "!nc <text1 | text2 | ...> - start name-change loop (texts split by | )\n" +
            "!dnc - stop nc\n" +
            "!vn <target?> <text> - start VN (reply mode or per-target). If no target, replies to ALL new messages.\n" +
            "!dvn - stop vn\n" +
            "!spam <text> <count> - start spamming a fixed message globally (no target)\n" + // UPDATED
            "!dspam - stop spam\n" +
            "!reply <text> - start global text auto-reply to all messages\n" + // NEW
            "!dreply - stop auto-reply\n" + // NEW
            "!delay <raid|nc|vn|spam|reply> <ms/s> - set feature delay\n" + // UPDATED
            "!sudo <id|@user|[Name](tg://user?id=...)> - add sudo\n" +
            "!rmsudo <id|...> - remove sudo\n";
          await safeSendMessage(bot, chatId, helpText, msg);
          break;

        case "!raid": {
          // ... (raid logic is unchanged) ...
          let target = null;
          let targetNameFromArg = null;
          let targetArgsOffset = 0;

          if (msg.reply_to_message && msg.reply_to_message.from) {
            target = { id: Number(msg.reply_to_message.from.id), userObj: msg.reply_to_message.from };
            targetArgsOffset = 0;
          } else if (args.length >= 1) {
            const parsed = parseUserRefArg(args[0]);
            if (parsed && parsed.id) {
              const display = await fetchDisplayName(bot, chatId, parsed.id);
              target = { id: parsed.id, userObj: { id: parsed.id, first_name: display } };
              targetArgsOffset = 1;
            } else if (parsed && parsed.nameText) {
              targetNameFromArg = parsed.nameText;
              target = { id: parsed.id || null, userObj: null };
              targetArgsOffset = 1;
            } else {
              const rest = text.slice(cmd.length).trim();
              const mdMatch = rest.match(/^\[([^\]]+)\]\(tg:\/\/user\?id=(\d+)\)(\s+|$)/);
              if (mdMatch) {
                const id = Number(mdMatch[2]);
                const display = mdMatch[1];
                target = { id, userObj: { id, first_name: display } };
                targetArgsOffset = mdMatch[0].trim().split(/\s+/).length;
              }
            }
          }

          if (!target) {
            await safeSendMessage(bot, chatId, "⚠️ Provide target (reply / @username / id / [Name](tg://user?id=...))", msg);
            break;
          }

          let raidText = "";
          if (args.length > targetArgsOffset) {
            raidText = args.slice(targetArgsOffset).join(" ").trim();
          } else {
            raidText = DEFAULT_RAID_TEXTS[Math.floor(Math.random() * DEFAULT_RAID_TEXTS.length)];
          }

          chatState[chatId].raid = { raidText, target };
          saveState();

          let mentionText;
          if (target.userObj) {
            mentionText = mentionFromUserObj(target.userObj);
          } else if (targetNameFromArg) {
            mentionText = escapeMarkdown(targetNameFromArg);
          } else if (target.id) {
            const display = await fetchDisplayName(bot, chatId, target.id);
            mentionText = `[${escapeMarkdown(display)}](tg://user?id=${target.id})`;
          } else {
            mentionText = "User";
          }

          await safeSendMessage(bot, chatId, `🔥 Raid started on ${mentionText} ${escapeMarkdown(raidText)}`, msg);
          break;
        }

        case "!draid":
          chatState[chatId].raid = null;
          saveState();
          await safeSendMessage(bot, chatId, "🔥 Raid stopped.", msg);
          break;

        case "!nc": {
          // ... (nc logic is unchanged) ...
          const rest = args.join(" ").trim();
          if (!rest) {
            await safeSendMessage(bot, chatId, "⚠️ Usage: !nc text1 | text2 | text3", msg);
            break;
          }
          const texts = rest.split("|").map(s => s.trim()).filter(Boolean);
          chatState[chatId].nc = { texts };
          saveState();
          await safeSendMessage(bot, chatId, `⚡ NC started with texts: ${escapeMarkdown(texts.join(", "))}`, msg);
          break;
        }

        case "!dnc":
          chatState[chatId].nc = null;
          saveState();
          await safeSendMessage(bot, chatId, "⚡ NC stopped.", msg);
          break;

        case "!vn": {
          // ... (vn logic is unchanged) ...
          let target = null;
          let targetArgsOffset = 0;

          if (msg.reply_to_message && msg.reply_to_message.from) {
            target = { id: Number(msg.reply_to_message.from.id), userObj: msg.reply_to_message.from };
            targetArgsOffset = 0;
          } else if (args.length >= 1) {
            const parsed = parseUserRefArg(args[0]);
            if (parsed && parsed.id) {
              const display = await fetchDisplayName(bot, chatId, parsed.id);
              target = { id: parsed.id, userObj: { id: parsed.id, first_name: display } };
              targetArgsOffset = 1;
            } else if (parsed && parsed.nameText) {
              target = { id: parsed.id || null, userObj: null, nameText: parsed.nameText };
              targetArgsOffset = 1;
            }
          }
          
          let vnText = "";
          let lang = "ja";
          
          const textParts = args.slice(targetArgsOffset);
          if (textParts.length > 0) {
              const lastPart = textParts[textParts.length - 1];
              if (lastPart.length === 2 && /^[a-z]{2}$/.test(lastPart)) {
                  lang = lastPart;
                  vnText = textParts.slice(0, -1).join(" ").trim();
              } else {
                  vnText = textParts.join(" ").trim();
              }
          }
          
          if (!vnText) {
              vnText = (msg.reply_to_message && msg.reply_to_message.text) || "こんにちは";
              targetArgsOffset = 0;
          }

          chatState[chatId].vn = { text: vnText, target, lang };
          saveState();

          let mtext;
          if (target && target.userObj) mtext = mentionFromUserObj(target.userObj);
          else if (target && target.nameText) mtext = escapeMarkdown(target.nameText);
          else mtext = "ALL";

          await safeSendMessage(bot, chatId, `🎙 VN started for ${mtext} "${escapeMarkdown(vnText)}" (lang=${lang})`, msg);
          break;
        }

        case "!dvn":
          chatState[chatId].vn = null;
          saveState();
          await safeSendMessage(bot, chatId, "🎙 VN stopped.", msg);
          break;
          
        case "!spam": { // UPDATED SPAM COMMAND (no target)
            if (args.length < 2) {
                await safeSendMessage(bot, chatId, "⚠️ Usage: !spam <text> <count>", msg);
                break;
            }

            const countStr = args[args.length - 1];
            const count = Number(countStr);
            const spamText = args.slice(0, -1).join(" ").trim();

            if (isNaN(count) || count <= 0 || !spamText) {
                await safeSendMessage(bot, chatId, "⚠️ Invalid count or missing text. Usage: !spam <text> <count>", msg);
                break;
            }

            const MAX_SPAM_COUNT = 999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999; 
            const finalCount = Math.min(count, MAX_SPAM_COUNT);

            chatState[chatId].spam = { text: spamText, remaining: finalCount, total: finalCount };
            saveState();
            
            await safeSendMessage(bot, chatId, `🗣️ Spam started with "${escapeMarkdown(spamText)}" for ${finalCount} messages.`, msg);
            break;
        }
        
        case "!dspam": 
            chatState[chatId].spam = null;
            saveState();
            await safeSendMessage(bot, chatId, "🚫 Spam stopped.", msg);
            break;

        case "!reply": { // NEW REPLY COMMAND
            const replyText = args.join(" ").trim();
            if (!replyText) {
                await safeSendMessage(bot, chatId, "⚠️ Usage: !reply <text>", msg);
                break;
            }

            chatState[chatId].reply = { text: replyText };
            saveState();

            await safeSendMessage(bot, chatId, `🔁 Auto-reply started with text: "${escapeMarkdown(replyText)}"`, msg);
            break;
        }

        case "!dreply": { // NEW DREPLY COMMAND
            chatState[chatId].reply = null;
            saveState();
            await safeSendMessage(bot, chatId, "🚫 Auto-reply stopped.", msg);
            break;
        }

        case "!delay": {
          if (args.length < 2) {
            await safeSendMessage(bot, chatId, "Usage: !delay <raid|nc|vn|spam|reply> <ms/s>", msg);
            break;
          }
          const feature = args[0].toLowerCase();
          const raw = args[1];
          const ms = parseDelay(raw);
          // UPDATED: added 'spam' and 'reply' to the allowed features
          if (!ms || !["raid", "nc", "vn", "spam", "reply"].includes(feature)) {
            await safeSendMessage(bot, chatId, "⚠️ Use !delay <raid|nc|vn|spam|reply> <time> (e.g. 1s or 500ms)", msg);
            break;
          }
          chatState.delay = chatState.delay || {};
          chatState.delay[feature] = ms;
          saveState();
          await safeSendMessage(bot, chatId, `⏱ Delay for ${feature} set to ${ms} ms`, msg);
          break;
        }

        case "!sudo": {
          // ... (sudo logic is unchanged) ...
          if (args.length < 1) {
            await safeSendMessage(bot, chatId, "Usage: !sudo <id|@user|[Name](tg://user?id=...))", msg);
            break;
          }
          const parsed = parseUserRefArg(args[0]);
          if (!parsed || !parsed.id) { 
            await safeSendMessage(bot, chatId, "⚠️ Invalid or non-ID target for sudo. Please use ID or link.", msg);
            break;
          }
          chatState.sudo = chatState.sudo || [];
          if (!chatState.sudo.includes(parsed.id)) chatState.sudo.push(parsed.id);
          saveState();
          await safeSendMessage(bot, chatId, `✅ Added sudo ID: ${parsed.id}`, msg);
          break;
        }

        case "!rmsudo": {
          // ... (rmsudo logic is unchanged) ...
          if (args.length < 1) {
            await safeSendMessage(bot, chatId, "Usage: !rmsudo <id|@user|[Name](tg://user?id=...))", msg);
            break;
          }
          const parsed = parseUserRefArg(args[0]);
          if (!parsed || !parsed.id) {
            await safeSendMessage(bot, chatId, "⚠️ Invalid or non-ID target for rmsudo. Please use ID or link.", msg);
            break;
          }
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

    // ---------- NON-COMMAND MESSAGE: potentially trigger raid/vn/reply ----------
    const state = chatState[chatId] || {};
    // ensure all delays exist, default to 2000ms
    const delay = Object.assign({ raid: 2000, nc: 2000, vn: 2000, spam: 2000, reply: 2000 }, chatState.delay);

    // Skip bot's own messages for auto-trigger features
    if (isFromBot) return;

    // RAID trigger
    if (state.raid && state.raid.target) {
      const t = state.raid.target;
      let targetId = t && t.userObj && t.userObj.id ? Number(t.userObj.id) : (t && t.id ? Number(t.id) : null);

      if (targetId && msg.from && Number(msg.from.id) === targetId) {
        const mentionClickable = mentionFromUserObj(msg.from);
        const raidText = state.raid.raidText || DEFAULT_RAID_TEXTS[Math.floor(Math.random() * DEFAULT_RAID_TEXTS.length)];
        const out = ` ${mentionClickable} ${escapeMarkdown(raidText)}`; 
        setTimeout(() => safeSendMessage(bot, chatId, out, msg), delay.raid);
      }
    }
    
    // REPLY trigger (NEW)
    if (state.reply && state.reply.text) {
        setTimeout(async () => {
            try {
                // Reply to the new message with the specified text
                await safeSendMessage(bot, chatId, state.reply.text, msg);
            } catch (e) {
                console.error("Auto-reply failed:", e && e.message ? e.message : e);
            }
        }, delay.reply);
    }

    // VN trigger
    if (state.vn && state.vn.text) {
      const t = state.vn.target || null;
      let shouldReply = false;
      if (!t) shouldReply = true; // global mode - reply to every new message
      else if (t.id && msg.from && Number(msg.from.id) === Number(t.id)) shouldReply = true;

      if (shouldReply) {
        setTimeout(async () => {
          try {
            // text reply
            await safeSendMessage(bot, chatId, state.vn.text, msg);

            // voice reply
            const fileName = path.join(__dirname, `vn_${Date.now()}_${Math.floor(Math.random()*10000)}.mp3`);
            const lang = (state.vn.lang && typeof state.vn.lang === 'string') ? state.vn.lang : 'ja';
            const tts = new gTTS(state.vn.text, lang);
            await new Promise((res, rej) => tts.save(fileName, (err) => (err ? rej(err) : res())));
            await safeSendVoice(bot, chatId, fileName, msg);
          } catch (e) {
            console.error("VN generation/send failed:", e && e.message ? e.message : e);
          }
        }, delay.vn);
      }
    }
  }); // end on message
}); // end forEach tokens
