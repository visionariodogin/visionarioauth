const { EmbedBuilder } = require("discord.js");
const { url_apiHost } = require("../../config.json");
const { dbP, users } = require("../../databases/index");
const axios = require("axios");
const discordOauth = require("discord-oauth2");
const oauth = new discordOauth();

module.exports = {
    name: "interactionCreate",
    run: async (interaction, client) => {
        const { customId } = interaction;
        if (!customId) return;

        const clientid = await dbP.get("autoSet.clientid");
        const secret = await dbP.get("manualSet.secretBot");

        if (customId === "modalX") {

            const all = await users.all().filter(a => a.data.username);

            const guild_id = interaction.fields.getTextInputValue("servidor") || interaction.guild.id;
            const guild = interaction.client.guilds.cache.get(guild_id);
            if (!guild) {
                return interaction.reply({ content: `\`🔴\` Servidor id \`${guild_id}\` não encontrado, tente novamente!`, ephemeral: true });
            };

            const quantidade = interaction.fields.getTextInputValue("quantidadeX");

            if (isNaN(quantidade) || !Number.isInteger(Number(quantidade)) || quantidade <= 0) {
                return interaction.reply({ content: `\`🔴\` Quantidade inválida, tente novamente!`, ephemeral: true });
            };
            
            if (quantidade > all.length) {
                return interaction.reply({ content: `\`🔴\` Quantidade máxima é de \`x${all.length}\`, tente novamente!`, ephemeral: true });
            };

            let yes = 0;
            let no = 0;

            await interaction.reply({
                content: `\`🔁\` Carregando...`,
                embeds: [],
                components: [],
                ephemeral: true
            });

            for (const user of all.slice(0, quantidade)) {

                const userToken = await renewUserToken(user.ID, user.data.refreshToken, user.data.code);
                await oauth.addMember({
                    accessToken: userToken?.access_token ?? user.data.acessToken,
                    botToken: client.token,
                    guildId: guild.id,
                    userId: user.ID,
                    nickname: user.data.username,
                    roles: [],
                    mute: false,
                    deaf: false,
                }).then(() => {
                    yes++;
                }).catch((err) => {
                    no++
                });

                await users.set(`${user.ID}.acessToken`, userToken?.access_token ?? user.data.acessToken);
                await users.set(`${user.ID}.refreshToken`, userToken?.refresh_token ?? user.data.refreshToken);

                await interaction.editReply({
                    content: `${interaction.user}`,
                    embeds: [
                        new EmbedBuilder()
                        .setColor("#00FFFF")
                        .setAuthor({ name: `${interaction.user.username} - Puxando Verificados`, iconURL: interaction.user.displayAvatarURL() })
                        .setDescription(`-# \`🔄\` Puxando membros verificados do OAuth2...`)
                        .addFields(
                            { name: `Sucessos`, value: `\`🟢 ${yes}/${quantidade}\``, inline: true },
                            { name: `Erros`, value: `\`🔴 ${no}/${quantidade}\``, inline: true }
                        )
                        .setFooter({ text: `${interaction.guild.name}`, iconURL: interaction.guild.iconURL() })
                        .setTimestamp()
                    ],
                    components: []
                });

            };

            await interaction.editReply({
                content: `${interaction.user}`,
                embeds: [
                    new EmbedBuilder()
                    .setColor("#00FF00")
                    .setAuthor({ name: `${interaction.user.username} - Migração Finalizada`, iconURL: interaction.user.displayAvatarURL() })
                    .setDescription(`-# \`✅\` Finalização de solicitação migrar membros verificados OAuth2.`)
                    .addFields(
                        { name: `Sucessos`, value: `\`🟢 ${yes}/${quantidade}\``, inline: true },
                        { name: `Erros`, value: `\`🔴 ${no}/${quantidade}\``, inline: true }
                    )
                    .setFooter({ text: `${interaction.guild.name}`, iconURL: interaction.guild.iconURL() })
                    .setTimestamp()
                ],
                components: []
            });

            async function renewUserToken(userId, refreshToken, code) {
                try {
                    const response = await axios.post(
                        'https://discord.com/api/oauth2/token',
                        `client_id=${clientid}&code=${code}&client_secret=${secret}&refresh_token=${refreshToken}&grant_type=refresh_token&redirect_uri=${url_apiHost}/callback&scope=identify`,
                        {
                            headers: {
                                'Content-Type': 'application/x-www-form-urlencoded',
                            },
                        }
                    );
                    if (response.data && response.data.access_token) {
                        const renewedToken = response.data.access_token;
                        const newRefreshToken = response.data.refresh_token;

                        return { access_token: renewedToken, refresh_token: newRefreshToken };
                    } else {
                        return { access_token: null, refresh_token: null };
                    };
                } catch (error) {
                    return { access_token: null, refresh_token: null };
                };
            };

        };

    }
}