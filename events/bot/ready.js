const { ActivityType } = require("discord.js");
const { token } = require("../../config.json");
const colors = require("colors");
const axios = require("axios");

module.exports = {
    name: "ready",
    run: async (client) => {

        console.clear();
        
        console.log(`${colors.green(`[+Positive] - Estou online em ${client.user.displayName} | ${client.user.id}!`)}`);
        console.log(`${colors.green(`[+Positive] - Servindo ${client.users.cache.size} users.`)}`);
        console.log(`${colors.green(`[+Positive] - Estou em ${client.guilds.cache.size} servidores!`)}`);
        console.log(``)
        console.log(`${colors.blue(`[$Codder] - Exclusive OAuth2, developed by @gostbanido.`)}`)

        client.user.setPresence({
            activities: [{
                name: `Sky Apps`,
                type: ActivityType.Streaming,
                url: "https://twitch.tv/discord"
            }]
        });
        client.user.setStatus("idle");

        setDesc();

        function setDesc() {
            axios.patch('https://discord.com/api/v10/applications/@me', {
                description: `**Tecnologia Sky Apps**\nhttps://discord.gg/skyapps`
            },
                {
                    headers: {
                        Authorization: `Bot ${token}`,
                        'Content-Type': `application/json`
                    }
                }).catch(error => { });
        };
        
    }
};
