const { ApplicationCommandType, EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require("discord.js");
const { dbC, dbP } = require("../../databases/index");
const { owner } = require("../../config.json");

module.exports = {
    name: "botconfig",
    description: "[👷] Comece a configurar o sistema/bot.",
    type: ApplicationCommandType.ChatInput,
    run: async (client, interaction) => {

        if (owner !== interaction.user.id) {
            return interaction.reply({ content: `\`❌\` Faltam permissões.`, ephemeral: true });
        };

        const guildid = await dbP.get("autoSet.guildid");
        const clientSecret = await dbP.get("manualSet.secretBot");
        const webhookLogs = await dbP.get("manualSet.webhook");

        if (!guildid) {
            await dbP.set("autoSet.guildid", interaction.guild.id);
        };

        if (!guildid || !clientSecret || !webhookLogs) {

            return interaction.reply({
                content: `# 👋 | Obrigatórios/Princípios\n\n**Observação:** Estes campos são obrigatórios para que possamos prosseguir com a configuração geral do bot/sistema, por favor preencha abaixo algumas informações e se caso estiver com dúvida do que é cada coisa, procure no **[YouTube](<https://www.youtube.com/>)**.\n\n-# **Servidor Id:** \`${guildid || "🔴 Não configurado."}\`\n-# **Client Secret Bot:** \`${clientSecret || "🔴 Não configurado."}\`\n-# **Webhook canal url:** \`${webhookLogs || "🔴 Não configurado."}\`\n\n:warning: Qual quer informação errada irá bugar seu bot!\n:warning: O botão de **Servidor Id** vai setar o **id do servidor atual**!`,
                components: [
                    new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder().setCustomId(`setGuildId`).setLabel(`Servidor Id`).setEmoji(`1246953254810816542`).setStyle(1),
                            new ButtonBuilder().setCustomId(`setClientSecret`).setLabel(`Client Secret Bot`).setEmoji(`1246953149009367173`).setStyle(1),
                            new ButtonBuilder().setCustomId(`setWebhook`).setLabel(`Webhook Url`).setEmoji(`1246954960218886146`).setStyle(1)
                        )
                ],
                ephemeral: true
            });

        };

        const sistema = await dbC.get("sistema");

        interaction.reply({
            content: ``,
            embeds: [
                new EmbedBuilder()
                    .setColor("#00FFFF")
                    .setAuthor({ name: `${interaction.user.username} - Gerenciamento Inicial`, iconURL: interaction.user.displayAvatarURL() })
                    .setDescription(`-# \`👷\` Gerenciamento inicial do sistema/bot.`)
                    .addFields(
                        { name: `Sistema`, value: sistema ? "\`🟢 Online\`" : "\`🔴 Offline\`", inline: true },
                        { name: `Versão`, value: `\`BETA\``, inline: true },
                        { name: `Ping`, value: `\`${client.ws.ping} ms\``, inline: true }
                    )
                    .setFooter({ text: `${interaction.guild.name}`, iconURL: interaction.guild.iconURL() })
                    .setTimestamp()
            ],
            components: [
                new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder().setCustomId(`systemOnOff`).setLabel(sistema ? "Online" : "Offline").setEmoji(sistema ? "1236021048470933575" : "1236021106662707251").setStyle(sistema ? 3 : 4),
                        new ButtonBuilder().setCustomId(`panelDesignConfig`).setLabel(`PanelDesign`).setEmoji(`1303150938088935531`).setStyle(1),
                        new ButtonBuilder().setCustomId(`blackListConfig`).setLabel(`BlackList`).setEmoji(`1302017772229890109`).setStyle(1).setDisabled(true),
                        new ButtonBuilder().setCustomId(`functionAutoConfig`).setLabel(`Funções Automática`).setEmoji(`1302018423902965780`).setStyle(2).setDisabled(true)
                    ),
                new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder().setCustomId(`cacheConfig`).setLabel(`Cache OAuth2`).setEmoji(`1302018409701052501`).setStyle(1),
                        new ButtonBuilder().setCustomId(`rastrearConfig`).setLabel(`Rastreadores`).setEmoji(`1303148589786337343`).setStyle(3),
                        new ButtonBuilder().setCustomId(`definitions`).setLabel(`Configurações`).setEmoji(`1302021637448798369`).setStyle(2)
                    ),
                new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder().setCustomId(`obrigations`).setLabel(`Casinha`).setEmoji(`1246953187529855037`).setStyle(2)
                    )
            ],
            ephemeral: true
        });

    }
}