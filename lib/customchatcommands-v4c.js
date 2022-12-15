"use strict";

/*
  Use this file to define custom commands, especially room-centric ones.
  Try to avoid editing chatcommands.js so future updates won't erase your edits.

  Rename this file to customchatcommands.js to use it, OR if the advanced
  configuration setting "useChannelCustomCommands" is true, rename this to
  customchatcommands-roomname.js instead.

  You can also rename this to customchatcommands-(anything).js and edit your
  configuration file accordingly. Within your config, refer to:
    advanced.customCommandsToLoad
  There is more information in the configuration file on how to set this up.

  See chatcommands.js for more information on creating commands.

  !!
  This file may contain usage of emotes or other features
  that you probably don't have in your room. These are just here as examples.
*/

const C = require("cli-color");

const utils = require("./utils.js");
const strings = require("./strings.js");
const api = require("./api.js");
const Command = require("./chatcommands.js").Command;

function getCommands(bot) {
  var commands = {
    "saltpoll": new Command({
      cmdName: "saltpoll",
      minRank: bot.RANKS.MOD,
      rankMatch: ">=",
      userCooldown: 0,
      cmdCooldown: 10000,
      isActive: true,
      requiredChannelPerms: ["pollctl"],
      allowRankChange: true,
      canBeUsedInPM: true
    }, function (cmd, user, message, opts) {
      api.APIcall(bot, "saltybet", null, null, function(status, data, ok) {
        if (!ok) return bot.sendPM(user.name, "There was an error getting SaltyBet data.");
        let poll = {
          title:"PLACE YOUR BETS!",
          opts: [],
          obscured: false
        },
          emoteA = "",
          emoteB = "";
        let spl = message.split(" ");
        if (spl[0]) emoteA = spl[0];
        if (spl[1]) emoteB = spl[1];
        let p1 = emoteA + " " + data.p1name,
            p2 = emoteB + " " + data.p2name;
        if (data.status === "open" || data.status === 2) {
          poll.opts = [p1, p2];
        } else if (data.status === "locked") {
          p1 += " $" + data.p1total;
          p2 += " $" + data.p2total;
          poll.title = "BETTING CLOSED!";
          poll.opts = [p1, p2];
        }
        if (poll.opts.length > 0) {
          bot.openPoll(poll);
        }
      });
      return true;
    }),
    "vidya": new Command({
      cmdName: "vidya",
      minRank: bot.RANKS.MOD,
      rankMatch: ">=",
      userCooldown: 0,
      cmdCooldown: 2000,
      isActive: true,
      requiredChannelPerms: ["seeplaylist", "playlistmove"],
      allowRankChange: true,
      canBeUsedInPM: false
    }, function (cmd, user, message, opts) {
      let vidObj = null;
      let spl = message.split(" ");
      let playlist = bot.CHANNEL.playlist;
      if (message.trim() !== "") {
        vidObj = findLastMedia(spl[0]);
      } else {
        vidObj = findLastMedia(user.name);
      }
      if (vidObj) {
        let TARGETUSER = vidObj.media.queueby;
        if (bot.disallowed(TARGETUSER)) {
            bot.sendPM(user.name, TARGETUSER + " is disallowed.");
            return false;
        }
        let active = bot.getMediaIndex(bot.CHANNEL.currentUID);
        if (!~active) {
          bot.moveMedia(vidObj.media.uid, "prepend");
        } else {
          bot.moveMedia(vidObj.media.uid, playlist[active].uid);
        }
        bot.logger.mod(strings.format(bot, "BUMP_LOG", [
          "VIDYA BUMP",
          utils.formatLink(vidObj.media.media.id, vidObj.media.media.type, true),
          TARGETUSER,
          user.name,
          (vidObj.index+1),
          (~active ? active+1 : 1)
        ]));
        if (bot.db && bot.cfg.db.useTables.users && bot.cfg.db.useTables.bump_stats) {
          let column = "vidya_others";
          if (TARGETUSER === user.name) column = "vidya_self";
          bot.db.run("bumpCount", [user.name, column]);
        }
        return true;
      }
      return false;
    })
  }

  let aliases = {};

  function findLastMedia(name) {
    name = name.toLowerCase();
    let playlist = bot.CHANNEL.playlist;
    let i = playlist.length-1;
    for (;i >= 0;i--) {
      if (playlist[i].queueby.toLowerCase() === name) {
        return {media:playlist[i], index:i};
      }
    }
    return null;
  }

  return {commands: commands, aliases: aliases}
}

module.exports = {
  getCommands:getCommands
}
