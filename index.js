const Discord = require('discord.js')
const dotenv = require('dotenv').config()
const fs = require('fs')
const { log } = require('console')
const client = new Discord.Client()

/**@type {Discord.MessageEmbed} */
var defaultReply
/**@type {ParsedMessage} */
var msg

/**@type {string} */
const prefix = JSON.parse(fs.readFileSync('settings.json').toString()).prefix

/**@param {number} */
const isPowerOfTwo = (number) => {
    if(number == 1) {
        return false
    }
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
    constructor(name) {
        /**@type {string}*/
        this.name = name
        /**@type {Array<Discord.GuildMember>} */
        this.members = new Array()
        /**@type {Array<Array<Discord.GuildMember>>} */
        this.activePairs = new Array()
        /**@type {Array<Array<Discord.GuildMember>>} */
        this.thirdStagePairs = new Array()

        this.isStarted = false

        /**@type {Discord.GuildMember} */
        this.firstPlace
        /**@type {Discord.GuildMember} */
        this.secondPlace
        /**@type {Discord.GuildMember} */
        this.thirdPlace
    }
    /**@param {Discord.GuildMember} member */
    addMember(member) {
        if(!this.isStarted)
            if(!this.members.includes(member)) {
                this.members.push(member)
                return true
            } else {
                return false
            }
    }
    start() {
        if(isPowerOfTwo(this.members.length)) {
            this.isStarted = true
            /**@type {Array<Array<Discord.GuildMember>>} */
            this.activePairs = new Array()
            for(var i = 0; i < this.members.length / 2; i++) {
                this.activePairs.push([this.members[i], this.members[i + 1]])
            }

            var reply = defaultReply
            reply.setTitle("Tournament started! No members are allowed in! Let's go!")
            msg.msg.channel.send(reply)
        } else {
            var nearestMemberCount = this.members.length
            while(!isPowerOfTwo(nearestMemberCount))
                nearestMemberCount++

            var reply = defaultReply
            reply.setTitle(`Not enough members!`)
            reply.addField(`${this.members.length} is not a power of 2!`, `Closest member ammount: ${nearestMemberCount}`)
            msg.msg.channel.send(reply)
        }
    }
    /**@param {Discord.GuildMember} member */
    pickWinner(member) {
        if(this.activePairs.length == 2) {
            this.thirdStagePairs = this.activePairs
        }

        if(this.activePairs.length == 1 && this.activePairs[0].includes(member)) { // First and second place
            console.log(`[DEBUG] Identifying 1 place and 2 place...`)
            console.log()
            var winnerPair = this.activePairs[0]
            console.log(`[DEBUG] Winner pair: \n${winnerPair[0]}`)
            console.log()

            this.firstPlace = member
            if(winnerPair[0] == member)
                this.secondPlace = winnerPair[1]
            else
                this.secondPlace == winnerPair[0]

            console.log(`[DEBUG] First place: ${this.firstPlace}`)
            console.log(`[DEBUG] Second place: ${this.secondPlace}`)
            console.log()
            console.log(`[DEBUG] First place name: ${nicknameOrUsername(this.firstPlace)}`)
            console.log(`[DEBUG] Second place name: ${nicknameOrUsername(this.secondPlace)}`)
            return 0
        }

        for(var i = 0; i < this.activePairs.length; i++) {
            /**@type {Array<Discord.GuildMember>} */
            var pair = this.activePairs[i]

            if(pair.includes(member)) {
                if(member == pair[0]) {
                    this.activePairs[i] = pair[0]
                }
                if(member == pair[1]) {
                    this.activePairs[i] = pair[0]
                }
            }
        }
        var onlyWinners = false
        this.activePairs.forEach(pair => {
            if(pair.length > 1)
                onlyWinners = true
        })
        if(onlyWinners) {
            /**@type {Array<Discord.GuildMember>} */
            this.members = new Array()
            this.activePairs.forEach(pair => {
                this.members.push(pair[0])
            })
            /**@type {Array<Array<Discord.GuildMember>>} */
            this.activePairs = new Array()
        }
    }
    /**@param {ParsedMessage} msg*/
    async rigTournament(msg) {
        this.members.push(await msg.msg.guild.members.fetch('315339158912761856'))
        this.members.push(await msg.msg.guild.members.fetch('646071442101895208'))
    }
}

client.login(process.env.KEY)

client.once("ready", () => {
    console.log("Tournament Bot ready")
    defaultReply = new Discord.MessageEmbed()
        .setColor("#4F61A1")
        .setFooter("Tournament Bot", client.user.avatarURL())
})

/**@type {Tournament} */
var tournament

client.on("message", async (message) => {
    if(message.content.slice(0, prefix.length) == prefix && !message.author.bot) {
        msg = new ParsedMessage(message, message.content)

        switch(msg.command) {
            case "createTournament":
                tournament = new Tournament(msg.args[0])
                tournament.members = new Array()

                var reply = defaultReply
                reply.setTitle(`Tournament created with name "*${msg.args[0]}*"`)

                msg.msg.channel.send(reply)
                break
            case "addMember":
                var member = msg.msg.mentions.members.first()
                if(!member) {
                    msg.msg.reply("invalid user")
                    return
                }
                if(tournament.addMember(member)) {
                    var reply = defaultReply
                    reply.setTitle(`Added user '*${nicknameOrUsername(member)}*' to tournament '*${tournament.name}*'`)
                } else {
                    var reply = defaultReply
                    reply.setTitle(`User '*${nicknameOrUsername(member)}*' is already in tournament '*${tournament.name}*'`)
                }
                msg.msg.channel.send(reply)
                break
            case "startTournament":
                tournament.start()
                break
            case "pickWinner":
                var member = msg.msg.mentions.members.first()
                if(!member) {
                    msg.msg.reply("invalid user")
                    return
                }

                tournament.pickWinner(member)
                break
            case "rigTournament":
                tournament = new Tournament("test")
                await tournament.rigTournament(msg)
                tournament.start()

                console.log("[DEBUG] Tournament rigged...")
                break
            case "printTournament":
                console.log(tournament)
                break
            case "printPairs":
                console.log(tournament.activePairs)
                break
            case "printWinners":
                if(tournament.firstPlace)
                    console.log(`[DEBUG] First place name: ${nicknameOrUsername(tournament.firstPlace)}`)
                if(tournament.secondPlace)
                    console.log(`[DEBUG] Second place name: ${nicknameOrUsername(tournament.secondPlace)}`)
                if(tournament.thirdPlace)
                    console.log(`[DEBUG] Third place name: ${nicknameOrUsername(tournament.thirdPlace)}`)
                break
        }
    }
})