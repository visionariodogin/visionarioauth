const { EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require("discord.js");
const { url_apiHost } = require("../../config.json");
const { dbP, users, carts } = require("../../databases/index");
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

        if (customId.endsWith("_modalEnvM")) {

            const all = await users.all().filter(a => a.data.username);

            const guild_id = interaction.fields.getTextInputValue("servidor") || interaction.guild.id;
            const guild = interaction.client.guilds.cache.get(guild_id);
            if (!guild) {
                return interaction.reply({ content: `\`🔴\` Servidor id \`${guild_id}\` não encontrado, tente novamente!`, ephemeral: true });
            };

            const quantidade = interaction.customId.split("_")[0];

            if (quantidade > all.length) {
                return interaction.reply({ content: `\`🔴\` Quantidade máxima é de \`x${all.length}\`, tente novamente!`, ephemeral: true });
            };

            let yes = 0;
            let no = 0;

            interaction.update({
                components: [
                    new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder().setCustomId(`enviarMembros`).setLabel(`Enviar Membros`).setEmoji(`1302021940893978625`).setStyle(3).setDisabled(true),
                        new ButtonBuilder().setURL(`https://discord.com/oauth2/authorize?client_id=${client.user.id}&scope=bot%20applications.commands&permissions=8`).setLabel(`Adicionar Bot`).setEmoji(`1302020207753302166`).setStyle(5)
                    )
                ]
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

                await interaction.followUp({
                    content: `\`✅\` Já estamos processando seus membros, aguarde gradualmente uma resposta breve do sistema.\n\`❓\` Este carrinho será encerrado em alguns instantes...`,
                    ephemeral: true
                });

                setTimeout(async () => {
                    try {
                        await carts.delete(interaction.channel.id);
                        interaction.channel.delete();
                    } catch (err) { };
                }, 5000);

            };

            await interaction.user.send({
                content: `${interaction.user}`,
                embeds: [
                    new EmbedBuilder()
                        .setColor("#00FF00")
                        .setAuthor({ name: `${interaction.user.username} - Solicitação Finalizada`, iconURL: interaction.user.displayAvatarURL() })
                        .setDescription(`-# \`✅\` Finalização de solicitação enviar membros reais.`)
                        .addFields(
                            { name: `Sucessos`, value: `\`🟢 ${yes}/${quantidade}\``, inline: true },
                            { name: `Erros`, value: `\`🔴 ${no}/${quantidade}\``, inline: true }
                        )
                        .setFooter({ text: `${interaction.guild.name}`, iconURL: interaction.guild.iconURL() })
                        .setTimestamp()
                ],
                components: [
                    new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder().setCustomId(`botN`).setLabel(`Notificação do Sistema`).setStyle(2).setDisabled(true)
                        )
                ]
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