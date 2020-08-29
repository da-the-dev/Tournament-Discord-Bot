const Discord = require('discord.js')
const dotenv = require('dotenv').config()
const fs = require('fs')
/**@type {string} */
const prefix = JSON.parse(fs.readFileSync('settings.json').toString()).prefix

/**@param {number} */
const isPowerOfTwo = (number) => {
    if(Number.isInteger(Math.log2(number)))
        return true
    else
        return false

}

/**@param {Discord.GuildMember} member */
const nicknameOrUsername = (member) => {
    if(member.nickname)
        return member.nickname
    else
        return member.user.username
}

class ParsedMessage {
    /**@param {Discord.Message} msg
     * @param {string} message
    */
    constructor(msg, messsage) {
        /**@type {Discord.Message} */
        this.msg = msg
        /**@type {Array<string>} */
        this.args = messsage.slice(1).split(" ")
        /**@type {string} */
        this.command = this.args.shift()
    }
}

class Tournament {
    constructor() {
        /**@type {string}*/
        this.name = ""
        /**@type {Array<Discord.GuildMember>} */
        this.members = new Array()
        /**@type {Array<Discord.GuildMember>} */
        this.nextStep = new Array()
        /**@type {Array<Array<Discord.GuildMember>>} */
        this.pairs = new Array()

        this.isStarted = false
    }
    create() {
        this.isCreated = true
    }
    /**@param {string} name*/
    setName(name) {
        if(this.isCreated)
            this.name = name
    }
    /**@param {Discord.GuildMember} member */
    addMember(member) {

        if(!this.isStarted)
            if(!this.members.includes(member)) {
                console.log('[DEBUG] Added a new member to tournament')
                this.members.push(member)
                return true
            }
            else
                return false

    }
    start() {

        if(!isPowerOfTwo(this.members.length)) {
            this.isStarted = true

            for(this.i = 0; this.i < this.members.length / 2; this.i++)
                this.pairs[this.i] = [this.members[this.i], this.members[this.i + 1]]
        }

    }
}

const client = new Discord.Client()
client.login(process.env.KEY)

client.once("ready", () => {
    console.log("Tournament Bot ready")
})

var tournament = new Tournament

client.on("message", (message) => {
    if(message.content.slice(0, prefix.length) == prefix && !message.author.bot) {
        var msg = new ParsedMessage(message, message.content)

        switch(msg.command) {
            case "createTournament":
                tournament.setName(msg.args[0])
                tournament.members = new Array
                tournament.isCreated = false

                var reply = new Discord.MessageEmbed()
                    .setTitle(`Tournament created with name "*${msg.args[0]}*"`)
                    .setFooter("Tournament Bot", client.user.avatarURL())
                msg.msg.channel.send(reply)
                break
            case "addMember":
                var member = msg.msg.mentions.members.first()
                if(!member) {
                    msg.msg.reply("invalid user")
                    return
                }
                if(tournament.addMember(member)) {
                    var reply = new Discord.MessageEmbed()
                        .setTitle(`Added user '*${nicknameOrUsername(member)}*' to tournament '*${tournament.name}*'`)
                        .setFooter("Tournament Bot", client.user.avatarURL())
                } else {
                    var reply = new Discord.MessageEmbed()
                        .setTitle(`User '*${nicknameOrUsername(member)}*' is already in tournament '*${tournament.name}*'`)
                        .setFooter("Tournament Bot", client.user.avatarURL())
                }
                msg.msg.channel.send(reply)
            case "startTournament":
                tournament.start()
            case "printTournament":
                console.log(tournament)
            case "printPairs":
                console.log(tournament.pairs)
        }
    }
})