const { ApplicationCommandType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ModalBuilder, TextInputBuilder, StringSelectMenuBuilder, ChannelSelectMenuBuilder, ChannelType, RoleSelectMenuBuilder } = require("discord.js");
const { token, url_apiHost } = require("../../config.json");
const { dbC, dbP, users } = require("../../databases/index");
const mercadopago = require("mercadopago");
const discordOauth = require("discord-oauth2");
const oauth = new discordOauth();

module.exports = {
    name: `interactionCreate`,

    run: async (interaction, client) => {
        const { customId } = interaction;
        if (!customId) return;

        if (!dbP.get("autoSet.guildid")) {
            await dbP.set("autoSet.guildid", interaction.guild.id);
        };

        // --------------------------------------------- INTERAÇÕES DE OBRIGATÓRIOS/PRINCIPIOS --------------------------------------------- \\

        if (customId === "obrigations") {
            obrigations();
        };

        if (customId === "setGuildId") {

            await dbP.set("autoSet.guildid", interaction.guild.id);
            await obrigations();

            interaction.followUp({ content: `\`🟢\` O id do servidor foi automáticamente idêntificado e setado com êxito.`, ephemeral: true });

        };

        if (customId === "setClientSecret") {

            const modal = new ModalBuilder()
                .setCustomId(`modalClientSecret`)
                .setTitle(`Setar Client Secret`)

            const option1 = new TextInputBuilder()
                .setCustomId(`csecret`)
                .setLabel(`QUAL É O CLIENT SECRET?`)
                .setPlaceholder(`Preencha este campo com o client secret`)
                .setStyle("Short")

            const optionx1 = new ActionRowBuilder().addComponents(option1);

            modal.addComponents(optionx1);
            await interaction.showModal(modal);

        };

        if (customId === "modalClientSecret") {
            const csecret = interaction.fields.getTextInputValue("csecret");

            await dbP.set("manualSet.secretBot", csecret);
            await obrigations();

            interaction.followUp({ content: `\`🟢\` O client secret foi alterado com êxito.`, ephemeral: true });

        };

        if (customId === "setWebhook") {

            const modal = new ModalBuilder()
                .setCustomId(`modalWebhook`)
                .setTitle(`Setar Webhook`)

            const option1 = new TextInputBuilder()
                .setCustomId(`url`)
                .setLabel(`QUAL É A URL DO WEBHOOK?`)
                .setPlaceholder(`discord.com/api/webhooks/...`)
                .setStyle("Short")

            const optionx1 = new ActionRowBuilder().addComponents(option1);

            modal.addComponents(optionx1);
            await interaction.showModal(modal);

        };

        if (customId === "modalWebhook") {
            const url = interaction.fields.getTextInputValue("url");

            if (!verifyWebhook(url)) {
                return interaction.reply({ content: `\`🔴\` A URL do webhook fornecida é inválida ou não acessível.`, ephemeral: true });
            };

            await dbP.set("manualSet.webhook", url);
            await obrigations();

            interaction.followUp({ content: `\`🟢\` O webhook url foi alterado com êxito.`, ephemeral: true });

        };



        // --------------------------------------------- BOTÃO DE DESLIGAR E LIGAR SISTEMA --------------------------------------------- \\

        if (customId === "systemOnOff") {

            const sistema = await dbC.get("sistema");

            if (sistema) {
                await dbC.set("sistema", false);
            } else {
                await dbC.set("sistema", true);
            };

            initial();

        };



        // --------------------------------------------- BOTÃO DE PANELDESIGN --------------------------------------------- \\



        if (customId === "panelDesignConfig") {
            panelDesignConfig();
        };

        if (customId === "editCorpoE") {

            const title = await dbC.get("design.embed.title");
            const desc = await dbC.get("design.embed.desc");

            const modal = new ModalBuilder()
                .setCustomId(`modalCorpoE`)
                .setTitle(`Corpo Embed`)

            const option1 = new TextInputBuilder()
                .setCustomId(`title`)
                .setLabel(`QUAL SERÁ O TÍTULO DA EMBED?`)
                .setPlaceholder(`EX: Verificação`)
                .setValue(title || "Verificação")
                .setMaxLength(300)
                .setStyle("Short")

            const option2 = new TextInputBuilder()
                .setCustomId(`desc`)
                .setLabel(`QUAL SERÁ A DESCRIÇÃO DA EMBED?`)
                .setPlaceholder(`EX: \`✅\` Faça sua verificação logo abaixo.`)
                .setValue(desc || "\`✅\` Faça sua verificação logo abaixo.")
                .setStyle("Paragraph")

            const optionx1 = new ActionRowBuilder().addComponents(option1);
            const optionx2 = new ActionRowBuilder().addComponents(option2);

            modal.addComponents(optionx1, optionx2);
            await interaction.showModal(modal);

        };

        if (customId === "modalCorpoE") {
            const title = interaction.fields.getTextInputValue("title");
            const desc = interaction.fields.getTextInputValue("desc");

            await dbC.set("design.embed.title", title);
            await dbC.set("design.embed.desc", desc);
            await panelDesignConfig();

            interaction.followUp({ content: `\`🟢\` O corpo da embed foi alterado com êxito.`, ephemeral: true });

        };

        if (customId === "editColorE") {

            const color = await dbC.get("design.embed.color");

            const modal = new ModalBuilder()
                .setCustomId(`modalColorE`)
                .setTitle(`Color Embed`)

            const option1 = new TextInputBuilder()
                .setCustomId(`color`)
                .setLabel(`QUAL SERÁ A NOVA COR DA EMBED?`)
                .setPlaceholder(`EX: #00FFFF`)
                .setValue(color || "#00FFFF")
                .setMaxLength(50)
                .setStyle("Short")

            const optionx1 = new ActionRowBuilder().addComponents(option1);

            modal.addComponents(optionx1);
            await interaction.showModal(modal);

        };

        if (customId === "modalColorE") {
            const color = interaction.fields.getTextInputValue("color");

            if (!isValidHexColor(color)) {
                return interaction.reply({ content: `\`🔴\` Cor incorreta, veja códigos hexadecimais: **[Ver cores](<https://imagecolorpicker.com/color-code/00ffff>)**`, ephemeral: true });
            };

            await dbC.set("design.embed.color", color);
            await panelDesignConfig();

            interaction.followUp({ content: `\`🟢\` A cor da embed foi alterada com êxito.`, ephemeral: true });

        };

        if (customId === "editThumbE") {

            const modal = new ModalBuilder()
                .setCustomId(`modalThumbE`)
                .setTitle(`Thumbnail Embed`)

            const option1 = new TextInputBuilder()
                .setCustomId(`thumb`)
                .setLabel(`QUAL SERÁ A NOVA THUMB DA EMBED?`)
                .setPlaceholder(`https://... (use "remover" para remover)`)
                .setStyle("Short")

            const optionx1 = new ActionRowBuilder().addComponents(option1);

            modal.addComponents(optionx1);
            await interaction.showModal(modal);

        };

        if (customId === "modalThumbE") {
            const thumb = interaction.fields.getTextInputValue("thumb");

            if (thumb.toLowerCase() === "remover") {
                await dbC.delete("design.embed.thumb");
                await panelDesignConfig();

                interaction.followUp({ content: `\`🟢\` A thumbnail da embed foi **removida** com êxito.`, ephemeral: true });

                return;
            };

            if (!link(thumb)) {
                return interaction.reply({ content: `\`🔴\` Thumbnail incorreta, use uma imagem url válida!`, ephemeral: true });
            };

            await dbC.set("design.embed.thumb", thumb);
            await panelDesignConfig();

            interaction.followUp({ content: `\`🟢\` A thumbnail da embed foi alterada com êxito.`, ephemeral: true });

        };

        if (customId === "editBannerPanel") {

            const mode = await dbC.get("design.mode");

            const modal = new ModalBuilder()
                .setCustomId(`modalBannerPanel`)
                .setTitle(`Banner ${mode === "1" ? "Embed" : "Content"}`)

            const option1 = new TextInputBuilder()
                .setCustomId(`banner`)
                .setLabel(`QUAL SERÁ O BANNER DA ${mode === "1" ? "EMBED" : "CONTENT"}?`)
                .setPlaceholder(`https://... (use "remover" para remover)`)
                .setStyle("Short")

            const optionx1 = new ActionRowBuilder().addComponents(option1);

            modal.addComponents(optionx1);
            await interaction.showModal(modal);

        };

        if (customId === "modalBannerPanel") {
            const banner = interaction.fields.getTextInputValue("banner");

            const mode = await dbC.get("design.mode");

            if (banner.toLowerCase() === "remover") {
                await dbC.delete("design.banner");
                await panelDesignConfig();

                interaction.followUp({ content: `\`🟢\` O banner da embed foi **removido** com êxito.`, ephemeral: true });

                return;
            };

            if (!link(banner)) {
                return interaction.reply({ content: `\`🔴\` Banner incorreto, use uma imagem url válida!`, ephemeral: true });
            };

            await dbC.set("design.banner", banner);
            await panelDesignConfig();

            interaction.followUp({ content: `\`🟢\` O banner da ${mode === "1" ? "embed" : "content"} foi alterado com êxito.`, ephemeral: true });

        };

        if (customId === "selectModePanel") {

            const option = interaction.values[0];

            if (option === "altMode") {

                const mode = await dbC.get("design.mode");

                if (mode === "1") {
                    await dbC.set("design.mode", "2");
                } else {
                    await dbC.set("design.mode", "1");
                };

                panelDesignConfig();

            };

            if (option === "editButtonVerify") {
                editButtonVerify();
            };

            if (option === "enviePanelOAuth") {

                interaction.reply({
                    content: `Onde enviar o painel de verificação?`,
                    components: [
                        new ActionRowBuilder()
                            .addComponents(
                                new ChannelSelectMenuBuilder()
                                    .setCustomId(`channelPanelSend`)
                                    .setPlaceholder(`📫 | Selecionar Canal`)
                                    .setChannelTypes(ChannelType.GuildText)
                            )
                    ],
                    ephemeral: true
                });

            };

            if (option === "sincronizeMsgPanel") {

                const channelExist = await dbC.get("design.channelMsg");
                const channelMsg = await interaction.guild.channels.cache.get(dbC.get("design.channelMsg"));

                const mode = await dbC.get("design.mode");

                const content = await dbC.get("design.content");
                const banner = await dbC.get("design.banner");

                const color = await dbC.get("design.embed.color");
                const title = await dbC.get("design.embed.title");
                const desc = await dbC.get("design.embed.desc");
                const thumb = await dbC.get("design.embed.thumb");

                const label = await dbC.get("design.but.label");
                const emoji = await dbC.get("design.but.emoji");

                const embed = new EmbedBuilder()
                    .setColor(color || "#00FFFF")
                    .setTitle(title || "Verificação")
                    .setDescription(desc || "\`✅\` Faça sua verificação logo abaixo.")
                    .setFooter({ text: `${interaction.guild.name}`, iconURL: interaction.guild.iconURL() })
                    .setTimestamp()

                if (thumb) {
                    embed.setThumbnail(thumb);
                };

                if (banner) {
                    embed.setImage(banner);
                };

                const clientid = await dbP.get("autoSet.clientid");
                const secret = await dbP.get("manualSet.secretBot");

                const uri = oauth.generateAuthUrl({
                    clientId: clientid,
                    clientSecret: secret,
                    scope: ["identify", "guilds.join", "email"],
                    redirectUri: `${url_apiHost}/skyoauth2/callback`
                });

                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder().setURL(uri).setLabel(label || "Verificar-se").setStyle(5)
                    )

                if (emoji) {
                    row.components[0].setEmoji(emoji);
                };

                if (channelExist && channelMsg) {
                    await channelMsg.messages.fetch(dbC.get("design.panelMsgId")).then(async (msg) => {
                        if (mode === "1") {
                            await msg.edit({
                                content: ``,
                                embeds: [embed],
                                components: [row],
                                files: []
                            }).then(async (msg) => {
                                interaction.reply({ content: `\`✅\` O painel foi sincronizado com êxito.`, components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setURL(channelMsg.url).setLabel(`Ir até painel`).setStyle(5))], ephemeral: true });
                            }).catch(error => {
                                interaction.reply({ content: `\`🔴\` Ocorreu um erro ao tentar editar mensagem!`, ephemeral: true });
                            });
                        } else {
                            if (banner) {
                                await msg.edit({
                                    content: content || "\`✅\` Faça sua verificação logo abaixo.",
                                    embeds: [],
                                    components: [row],
                                    files: [banner]
                                }).then(async (msg) => {
                                    interaction.reply({ content: `\`✅\` O painel foi sincronizado com êxito.`, components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setURL(channelMsg.url).setLabel(`Ir até painel`).setStyle(5))], ephemeral: true });
                                }).catch(error => {
                                    interaction.reply({ content: `\`🔴\` Ocorreu um erro ao tentar editar mensagem!`, ephemeral: true });
                                });
                            } else {
                                await msg.edit({
                                    content: content || "\`✅\` Faça sua verificação logo abaixo.",
                                    embeds: [],
                                    components: [row],
                                    files: []
                                }).then(async (msg) => {
                                    interaction.reply({ content: `\`✅\` O painel foi sincronizado com êxito.`, components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setURL(channelMsg.url).setLabel(`Ir até painel`).setStyle(5))], ephemeral: true });
                                }).catch(error => {
                                    interaction.reply({ content: `\`🔴\` Ocorreu um erro ao tentar editar mensagem!`, ephemeral: true });
                                });
                            };
                        };
                    }).catch(error => {
                        interaction.reply({ content: `\`🔴\` Mensagem não encontrada!`, ephemeral: true });
                    });
                } else {
                    interaction.reply({ content: `\`🔴\` Canal da mensagem não foi encontrado!`, ephemeral: true });
                };

            };

        };

        if (customId === "channelPanelSend") {

            const channelSend = await interaction.guild.channels.cache.get(interaction.values[0]);

            const mode = await dbC.get("design.mode");

            const content = await dbC.get("design.content");
            const banner = await dbC.get("design.banner");

            const color = await dbC.get("design.embed.color");
            const title = await dbC.get("design.embed.title");
            const desc = await dbC.get("design.embed.desc");
            const thumb = await dbC.get("design.embed.thumb");

            const label = await dbC.get("design.but.label");
            const emoji = await dbC.get("design.but.emoji");

            const embed = new EmbedBuilder()
                .setColor(color || "#00FFFF")
                .setTitle(title || "Verificação")
                .setDescription(desc || "\`✅\` Faça sua verificação logo abaixo.")
                .setFooter({ text: `${interaction.guild.name}`, iconURL: interaction.guild.iconURL() })
                .setTimestamp()

            if (thumb) {
                embed.setThumbnail(thumb);
            };

            if (banner) {
                embed.setImage(banner);
            };

            const clientid = await dbP.get("autoSet.clientid");
            const secret = await dbP.get("manualSet.secretBot");

            const uri = oauth.generateAuthUrl({
                clientId: clientid,
                clientSecret: secret,
                scope: ["identify", "guilds.join", "email"],
                redirectUri: `${url_apiHost}/skyoauth2/callback`
            });

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder().setURL(uri).setLabel(label || "Verificar-se").setStyle(5)
                )

            if (emoji) {
                row.components[0].setEmoji(emoji);
            };

            if (mode === "1") {
                await channelSend.send({
                    content: ``,
                    embeds: [embed],
                    components: [row],
                    files: []
                }).then(async (msg) => {
                    await dbC.set("design.channelMsg", channelSend.id);
                    await dbC.set("design.panelMsgId", msg.id);
                }).catch(error => {
                    interaction.update({ content: `\`🔴\` Ocorreu um erro ao tentar enviar painel!` });
                });
            } else {
                if (banner) {
                    await channelSend.send({
                        content: content || "\`✅\` Faça sua verificação logo abaixo.",
                        embeds: [],
                        components: [row],
                        files: [banner]
                    }).then(async (msg) => {
                        await dbC.set("design.channelMsg", channelSend.id);
                        await dbC.set("design.panelMsgId", msg.id);
                    }).catch(error => {
                        interaction.update({ content: `\`🔴\` Ocorreu um erro ao tentar enviar painel!` });
                    });
                } else {
                    await channelSend.send({
                        content: content || "\`✅\` Faça sua verificação logo abaixo.",
                        embeds: [],
                        components: [row],
                        files: []
                    }).then(async (msg) => {
                        await dbC.set("design.channelMsg", channelSend.id);
                        await dbC.set("design.panelMsgId", msg.id);
                    }).catch(error => {
                        interaction.update({ content: `\`🔴\` Ocorreu um erro ao tentar enviar painel!` });
                    });
                };
            };

            interaction.update({ content: `\`✅\` O painel foi enviado com êxito.`, components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setURL(channelSend.url).setLabel(`Ir até painel`).setStyle(5))] });

        };

        if (customId === "editContet") {

            const content = await dbC.get("design.content");

            const modal = new ModalBuilder()
                .setCustomId(`modalContentEdit`)
                .setTitle(`Editar Mensagem`)

            const option1 = new TextInputBuilder()
                .setCustomId(`msg`)
                .setLabel(`QUAL SERÁ A NOVA MENSAGEM?`)
                .setPlaceholder(`EX: \`✅\` Faça sua verificação logo abaixo.`)
                .setValue(content || "\`✅\` Faça sua verificação logo abaixo.")
                .setStyle("Paragraph")

            const optionx1 = new ActionRowBuilder().addComponents(option1);

            modal.addComponents(optionx1);
            await interaction.showModal(modal);

        };

        if (customId === "modalContentEdit") {
            const msg = interaction.fields.getTextInputValue("msg");

            await dbC.set("design.content", msg);
            await panelDesignConfig();

            interaction.followUp({ content: `\`🟢\` A mensagem foi alterada com êxito.`, ephemeral: true });

        };

        if (customId === "editTextBut") {

            const label = await dbC.get("design.but.label");

            const modal = new ModalBuilder()
                .setCustomId(`modalTextButEdit`)
                .setTitle(`Editar Texto Botão`)

            const option1 = new TextInputBuilder()
                .setCustomId(`txt`)
                .setLabel(`QUAL SERÁ O NOVO TEXTO?`)
                .setPlaceholder(`EX: Verificar-se`)
                .setValue(label || "Verificar-se")
                .setMaxLength(100)
                .setStyle("Short")

            const optionx1 = new ActionRowBuilder().addComponents(option1);

            modal.addComponents(optionx1);
            await interaction.showModal(modal);

        };

        if (customId === "modalTextButEdit") {
            const txt = interaction.fields.getTextInputValue("txt");

            await dbC.set("design.but.label", txt);
            await editButtonVerify();

            interaction.followUp({ content: `\`🟢\` O texto do botão foi alterado com êxito.`, ephemeral: true });

        };

        if (customId === "editEmojiBut") {

            const modal = new ModalBuilder()
                .setCustomId(`modalEmojiButEdit`)
                .setTitle(`Editar Emoji Botão`)

            const option1 = new TextInputBuilder()
                .setCustomId(`emoji`)
                .setLabel(`QUAL SERÁ O NOVO EMOJI?`)
                .setPlaceholder(`EX: ✅ (use "remover" para remover)`)
                .setMaxLength(250)
                .setStyle("Short")

            const optionx1 = new ActionRowBuilder().addComponents(option1);

            modal.addComponents(optionx1);
            await interaction.showModal(modal);

        };

        if (customId === "modalEmojiButEdit") {
            const emoji = interaction.fields.getTextInputValue("emoji");

            if (emoji.toLowerCase() === "remover") {
                await dbC.delete("design.but.emoji");
                await editButtonVerify();

                interaction.followUp({ content: `\`🟢\` O emoji do botão foi **removido** com êxito.`, ephemeral: true });

                return;
            };

            if (!isValidEmoji(emoji)) {
                return interaction.reply({ content: `\`🔴\` Emoji incorreto, tente novamente!`, ephemeral: true });
            };

            await dbC.set("design.but.emoji", emoji);
            await editButtonVerify();

            interaction.followUp({ content: `\`🟢\` O emoji do botão foi alterado com êxito.`, ephemeral: true });

        };

        async function obrigations() {

            const guildid = await dbP.get("autoSet.guildid");
            const clientSecret = await dbP.get("manualSet.secretBot");
            const webhookLogs = await dbP.get("manualSet.webhook");

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder().setCustomId(`setGuildId`).setLabel(`Servidor Id`).setEmoji(`1246953254810816542`).setStyle(1),
                    new ButtonBuilder().setCustomId(`setClientSecret`).setLabel(`Client Secret Bot`).setEmoji(`1246953149009367173`).setStyle(1),
                    new ButtonBuilder().setCustomId(`setWebhook`).setLabel(`Webhook Url`).setEmoji(`1246954960218886146`).setStyle(1)
                );

            const row2 = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder().setCustomId(`back`).setLabel(`Tudo Pronto`).setEmoji(`1303149098135982212`).setStyle(3)
                );

            await interaction.update({
                content: `# 👋 | Obrigatórios/Princípios\n\n**Observação:** Estes campos são obrigatórios para que possamos prosseguir com a configuração geral do bot/sistema, por favor preencha abaixo algumas informações e se caso estiver com dúvida do que é cada coisa, procure no **[YouTube](<https://www.youtube.com/>)**.\n\n-# **Servidor Id:** \`${guildid || "🔴 Não configurado."}\`\n-# **Client Secret Bot:** \`${clientSecret || "🔴 Não configurado."}\`\n-# **Webhook canal url:** \`${webhookLogs || "🔴 Não configurado."}\`\n\n:warning: Qual quer informação errada irá bugar seu bot!\n:warning: O botão de **Servidor Id** vai setar o **id do servidor atual**!`,
                embeds: [],
                components: guildid && clientSecret && webhookLogs ? [row, row2] : [row]
            });

        };

        async function initial() {

            const sistema = await dbC.get("sistema");

            await interaction.update({
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

        };

        async function panelDesignConfig() {

            const mode = await dbC.get("design.mode");

            const content = await dbC.get("design.content");
            const banner = await dbC.get("design.banner");

            const color = await dbC.get("design.embed.color");
            const title = await dbC.get("design.embed.title");
            const desc = await dbC.get("design.embed.desc");
            const thumb = await dbC.get("design.embed.thumb");

            const label = await dbC.get("design.but.label");
            const emoji = await dbC.get("design.but.emoji");

            const embed = new EmbedBuilder()
                .setColor(color || "#00FFFF")
                .setTitle(title || "Verificação")
                .setDescription(desc || "\`✅\` Faça sua verificação logo abaixo.")
                .setFooter({ text: `${interaction.guild.name}`, iconURL: interaction.guild.iconURL() })
                .setTimestamp()

            if (thumb) {
                embed.setThumbnail(thumb);
            };

            if (banner) {
                embed.setImage(banner);
            };

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder().setURL(`https://example.com`).setLabel(label || "Verificar-se").setStyle(5).setDisabled(true)
                )

            if (emoji) {
                row.components[0].setEmoji(emoji);
            };

            const rowEmbed = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder().setCustomId(`editCorpoE`).setLabel(`Gerenciar Corpo`).setEmoji(`1246953149009367173`).setStyle(1),
                    new ButtonBuilder().setCustomId(`editColorE`).setLabel(`Color`).setEmoji(`1294425656796381219`).setStyle(1),
                    new ButtonBuilder().setCustomId(`editThumbE`).setLabel(`Thumbnail`).setEmoji(`1246953177002278972`).setStyle(1)
                )

            const rowEmbed2 = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder().setCustomId(`editBannerPanel`).setLabel(`Banner`).setEmoji(`1246953177002278972`).setStyle(1),
                    new ButtonBuilder().setCustomId(`back`).setEmoji(`1246953097033416805`).setStyle(2)
                )

            const rowContent = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder().setCustomId(`editContet`).setLabel(`Gerenciar Mensagem`).setEmoji(`1246953149009367173`).setStyle(1),
                    new ButtonBuilder().setCustomId(`editBannerPanel`).setLabel(`Banner`).setEmoji(`1246953177002278972`).setStyle(1),
                    new ButtonBuilder().setCustomId(`back`).setEmoji(`1246953097033416805`).setStyle(2)
                )

            const select = new ActionRowBuilder()
                .addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId(`selectModePanel`)
                        .setPlaceholder(`📋 | Menu Painel`)
                        .addOptions(
                            {
                                value: `altMode`,
                                label: mode === "1" ? "Usar Mode Content" : "Usar Mode Embed",
                                description: `Clique aqui para alterar mode.`,
                                emoji: `1302020493779402872`
                            },
                            {
                                value: `editButtonVerify`,
                                label: "Gerenciar Botão",
                                description: `Clique aqui para gerenciar o botão.`,
                                emoji: `1297641727359979701`
                            },
                            {
                                value: `enviePanelOAuth`,
                                label: "Enviar Painel",
                                description: `Clique aqui para enviar o painel de verify.`,
                                emoji: `1246952363143729265`
                            },
                            {
                                value: `sincronizeMsgPanel`,
                                label: "Sincronizar Mensagem",
                                description: `Clique aqui para sincronizar a mensagem.`,
                                emoji: `1302018423902965780`
                            }
                        )
                )

            if (mode === "1") {
                await interaction.update({
                    content: ``,
                    embeds: [embed],
                    components: [row, select, rowEmbed, rowEmbed2],
                    files: []
                });
            } else {
                if (banner) {
                    await interaction.update({
                        content: content || "\`✅\` Faça sua verificação logo abaixo.",
                        embeds: [],
                        components: [row, select, rowContent],
                        files: [banner]
                    });
                } else {
                    await interaction.update({
                        content: content || "\`✅\` Faça sua verificação logo abaixo.",
                        embeds: [],
                        components: [row, select, rowContent],
                        files: []
                    });
                };
            };

        };

        async function editButtonVerify() {

            const label = await dbC.get("design.but.label");
            const emoji = await dbC.get("design.but.emoji");

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder().setURL(`https://example.com`).setLabel(label || "Verificar-se").setStyle(5).setDisabled(true),
                    new ButtonBuilder().setCustomId(`editTextBut`).setLabel(`Edit Texto`).setEmoji(`1303147777982730291`).setStyle(1),
                    new ButtonBuilder().setCustomId(`editEmojiBut`).setLabel(`Edit Emoji`).setEmoji(`1247227296599904331`).setStyle(1),
                    new ButtonBuilder().setCustomId(`panelDesignConfig`).setEmoji(`1246953097033416805`).setStyle(2)
                )

            if (emoji) {
                row.components[0].setEmoji(emoji);
            };

            await interaction.update({
                content: ``,
                embeds: [
                    new EmbedBuilder()
                        .setColor("#00FFFF")
                        .setAuthor({ name: `${interaction.user.username} - Gerenciamento Botão Verificar`, iconURL: interaction.user.displayAvatarURL() })
                        .setDescription(`-# \`🔗\` Gerenciamento do botão de verificação.`)
                        .addFields(
                            { name: `Info Config`, value: `\`🟢 Veja o botão abaixo\``, inline: true },
                            { name: `Texto`, value: `\`${label || "Verificar-se"}\``, inline: true },
                            { name: `Emoji`, value: `\`${emoji || "🔴 Não configurado."}\``, inline: true }
                        )
                        .setFooter({ text: `${interaction.guild.name}`, iconURL: interaction.guild.iconURL() })
                        .setTimestamp()
                ],
                components: [row]
            });

        };



        // --------------------------------------------- COISAS GERAIS NECESSÁRIAS --------------------------------------------- \\

        if (customId === "cacheConfig") {
            cacheConfig();
        };

        if (customId === "migrarVerifieds") {

            const modal = new ModalBuilder()
                .setCustomId(`modalX`)
                .setTitle(`Migrar Verificados`)

            const option1 = new TextInputBuilder()
                .setCustomId(`quantidadeX`)
                .setLabel(`Quantos puxar? (OBRIGATÓRIO)`)
                .setPlaceholder(`EX: 1000`)
                .setMaxLength(5)
                .setStyle("Short")
                .setRequired(true)

            const option2 = new TextInputBuilder()
                .setCustomId(`servidor`)
                .setLabel(`Servidor que irá receber? (OPCIONAL)`)
                .setPlaceholder(`EX: 1234567891011121314`)
                .setMaxLength(100)
                .setStyle("Short")
                .setRequired(false)

            const optionx1 = new ActionRowBuilder().addComponents(option1);
            const optionx2 = new ActionRowBuilder().addComponents(option2);

            modal.addComponents(optionx1, optionx2);
            await interaction.showModal(modal);

        };

        async function cacheConfig() {

            const clientid = await dbP.get("autoSet.clientid");
            const secret = await dbP.get("manualSet.secretBot");

            const uri = oauth.generateAuthUrl({
                clientId: clientid,
                clientSecret: secret,
                scope: ["identify", "guilds.join", "email"],
                redirectUri: `${url_apiHost}/skyoauth2/callback`
            });

            const all = await users.all().filter(a => a.data.username);

            interaction.update({
                content: `${interaction.user}`,
                embeds: [
                    new EmbedBuilder()
                        .setColor("#00FFFF")
                        .setAuthor({ name: `${interaction.user.username} - Gerenciamento Cache OAuth2`, iconURL: interaction.user.displayAvatarURL() })
                        .setDescription(`-# \`☁\` Gerenciamento do cache do seu **OAuth2**.`)
                        .addFields(
                            { name: `Url OAuth2`, value: `\`\`\`yaml\n${uri}\`\`\`` },
                            { name: `Url CallBack`, value: `\`${url_apiHost}/skyoauth2/callback\``, inline: true },
                            { name: `Vericados`, value: `\`👤 x${all.length} Membro's\``, inline: true }
                        )
                        .setFooter({ text: `${interaction.guild.name}`, iconURL: interaction.guild.iconURL() })
                        .setTimestamp()
                ],
                components: [
                    new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder().setCustomId(`migrarVerifieds`).setLabel(`Migrar Verificados`).setEmoji(`1302017700926722048`).setStyle(1).setDisabled(all.length < 1),
                            new ButtonBuilder().setCustomId(`selersMembers`).setLabel(`Sales Members`).setEmoji(`1246953442283618334`).setStyle(3).setDisabled(all.length < 1),
                            new ButtonBuilder().setURL("https://example.com/").setLabel(`CallBack Tutorial`).setEmoji(`1302020475760934973`).setStyle(5).setDisabled(true) // Coloca url aqui do tutorial zé!
                        ),
                    new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder().setCustomId(`back`).setEmoji(`1246953097033416805`).setStyle(2)
                        )
                ]
            });

        };



        // --------------------------------------------- SALES MEMBERS --------------------------------------------- \\

        if (customId === "selersMembers") {
            selersMembers();
        };

        if (customId === "comerceSalesOnOff") {

            const status = dbC.get("sales.status");

            if (status) {
                await dbC.set("sales.status", false);
            } else {
                await dbC.set("sales.status", true);
            };

            selersMembers();

        };

        if (customId === "smQuantMembers") {

            const modal = new ModalBuilder()
            .setCustomId(`modalSmQuantMin`)
            .setTitle(`Mínima Compra Mebros`)

            const option1 = new TextInputBuilder()
            .setCustomId(`quantia`)
            .setLabel(`QUAL SERÁ O MÍNIMO DE COMPRA?`)
            .setPlaceholder(`EX: 100`)
            .setMaxLength(10)
            .setStyle("Short")

            const optionx1 = new ActionRowBuilder().addComponents(option1);

            modal.addComponents(optionx1);
            await interaction.showModal(modal);

        };

        if (customId === "modalSmQuantMin") {
            const quantia = parseInt(interaction.fields.getTextInputValue("quantia"));

            const all = await users.all().filter(a => a.data.username);

            if (isNaN(quantia)) {
                return interaction.reply({ content: `\`❌\` A quantia mínima de compra precisa ser um número!`, ephemeral: true });
            };

            if (quantia < 1) {
                return interaction.reply({ content: `\`❌\` A quantia mínima de compra não pode ser menor que \`x1\`!`, ephemeral: true });
            };

            if (quantia > all.length) {
                return interaction.reply({ content: `\`❌\` A quantia mínima de compra não pode ser maior que o máximo \`x${all.length}\`!`, ephemeral: true });
            };

            await dbC.set("sales.min", quantia);
            await selersMembers();

            interaction.followUp({ content: `\`🟢\` A quantia mínima de compra foi alterada com êxito.`, ephemeral: true });

        };

        if (customId === "unidSalerMembers") {

            const modal = new ModalBuilder()
            .setCustomId(`modalUnidSalersM`)
            .setTitle(`Alterar Valor Unidade`)

            const option1 = new TextInputBuilder()
            .setCustomId(`valor`)
            .setLabel(`QUAL SERÁ O VALOR DE UNIDADE?`)
            .setPlaceholder(`EX: 0.03`)
            .setStyle("Short")

            const optionx1 = new ActionRowBuilder().addComponents(option1);

            modal.addComponents(optionx1);
            await interaction.showModal(modal);

        };

        if (customId === "modalUnidSalersM") {
            const valor = parseFloat(interaction.fields.getTextInputValue("valor")).toFixed(2);

            if (isNaN(valor)) {
                return interaction.reply({ content: `\`❌\` Use apenas números para setar o valor de unidade!`, ephemeral: true });
            };

            if (valor < 0.01) {
                return interaction.reply({ content: `\`❌\` O valor de unidade não pode ser menor que \`R$ 0.01\`!`, ephemeral: true });
            };

            await dbC.set("sales.unidade", Number(valor));
            await selersMembers();

            interaction.followUp({ content: `\`🟢\` O valor de unidade foi alterado com êxito.`, ephemeral: true });

        };

        if (customId === "paymentsConfig") {
            paymentsConfig();
        };

        if (customId === "automaticConfig") {
            automaticConfig();
        };

        if (customId === "sistemaMpOnOff") {

            const statusMp = await dbC.get("sales.mp.status");

            if (statusMp) {
                await dbC.set("sales.mp.status", false);
            } else {
                await dbC.set("sales.mp.status", true);
            };

            automaticConfig();

        };

        if (customId === "setAccessToken") {

            const modal = new ModalBuilder()
                .setCustomId(`modalAccessToken`)
                .setTitle(`Alterar Access Token`)

            const option1 = new TextInputBuilder()
                .setCustomId(`access`)
                .setLabel(`QUAL O SEU ACCESS TOKEN?`)
                .setPlaceholder(`APP_USR-000000000000000-XX...`)
                .setStyle("Short")

            const optionx1 = new ActionRowBuilder().addComponents(option1);

            modal.addComponents(optionx1);
            await interaction.showModal(modal);

        };

        if (customId === "modalAccessToken") {
            const access = interaction.fields.getTextInputValue("access");

            try {
                const payment_data = {
                    transaction_amount: parseFloat('10'),
                    description: 'Testando se o token é válido',
                    payment_method_id: 'pix',
                    payer: {
                        email: 'gostfazrequisicaobb@gmail.com',
                        first_name: 'Adilson Lima',
                        last_name: 'de Souza',
                        identification: {
                            type: 'CPF',
                            number: '63186896215',
                        },
                        address: {
                            zip_code: '86063190',
                            street_name: 'Rua Jácomo Piccinin',
                            street_number: '871',
                            neighborhood: 'Pinheiros',
                            city: 'Londrina',
                            federal_unit: 'PR',
                        },
                    },
                };

                mercadopago.configurations.setAccessToken(access);
                await mercadopago.payment.create(payment_data);

            } catch (error) {

                const pc = "https://www.youtube.com/watch?v=w7kyGZUrkVY&t=162s";
                const mobile = "https://www.youtube.com/watch?v=ctwqHp1H0-0";

                await interaction.reply({
                    content: ``,
                    embeds: [
                        new EmbedBuilder()
                            .setAuthor({ name: `${interaction.user.username} - Erro Access Token`, iconURL: interaction.user.displayAvatarURL() })
                            .setDescription(`-# \`❌\` Erro na setagem do access token.`)
                            .addFields(
                                { name: `Erro`, value: `\`Access Token Inválido\``, inline: true },
                                { name: `Útil`, value: `\`Assista ao tutorial\``, inline: true }
                            )
                            .setColor(`#FF0000`)
                            .setFooter({ text: `${interaction.guild.name}`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                            .setTimestamp()
                    ],
                    components: [
                        new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder().setURL(pc).setLabel(`TUTORIAL ACCESS TOKEN (PC)`).setEmoji(`1302020475760934973`).setStyle(5),
                                new ButtonBuilder().setURL(mobile).setLabel(`TUTORIAL ACCESS TOKEN (MOBILE)`).setEmoji(`1302020475760934973`).setStyle(5)
                            )
                    ],
                    ephemeral: true,
                });

                return;

            };

            await dbC.set("sales.mp.access", access);
            automaticConfig();

        };

        if (customId === "editTempPay") {

            const modal = new ModalBuilder()
                .setCustomId(`modalTempPay`)
                .setTitle(`Alterar Tempo Pagamento`)

            const option1 = new TextInputBuilder()
                .setCustomId(`temp`)
                .setLabel(`QUAL O NOVO TEMPO PARA PAGAR? (MINUTOS)`)
                .setPlaceholder(`EX: 10`)
                .setMaxLength(3)
                .setStyle("Short")

            const optionx1 = new ActionRowBuilder().addComponents(option1);

            modal.addComponents(optionx1);
            await interaction.showModal(modal);

        };

        if (customId === "modalTempPay") {
            const temp = parseInt(interaction.fields.getTextInputValue("temp"));

            if (isNaN(temp)) {
                return interaction.reply({ content: `\`❌\` O tempo para pagamento está inválido, use apenas números.`, ephemeral: true });
            };

            if (temp < 3) {
                return interaction.reply({ content: `\`❌\` O tempo para pagamento não pode ser menos que **3** Minutos`, ephemeral: true });
            };

            if (temp > 120) {
                return interaction.reply({ content: `\`❌\` O tempo para pagamento não pode ser mais que **120** Minutos`, ephemeral: true });
            };

            await dbC.set("sales.mp.tempPay", temp);
            automaticConfig();

        };

        if (customId === "antFraudSet") {

            interaction.update({
                content: ``,
                embeds: [],
                components: [
                    new ActionRowBuilder()
                        .addComponents(
                            new StringSelectMenuBuilder()
                                .setCustomId(`selectAntiFraudBanks`)
                                .setPlaceholder(`🏦 Bloquear Banco`)
                                .addOptions(
                                    {
                                        value: `Inter`,
                                        label: `Banco: Inter`,
                                        emoji: `1217525001171763331`
                                    },
                                    {
                                        value: `Picpay`,
                                        label: `Banco: PicPay`,
                                        emoji: `1217525250464550973`
                                    },
                                    {
                                        value: `Nu Pagamento`,
                                        label: `Banco: NuBank`,
                                        emoji: `1217524985766215691`
                                    },
                                    {
                                        value: `99Pay`,
                                        label: `Banco: 99Pay`,
                                        emoji: `1217586613480198254`
                                    },
                                    {
                                        value: `Pagseguro`,
                                        label: `Banco: PagBank`,
                                        emoji: `1217524953860280370`
                                    }
                                )
                                .setMaxValues(5)
                        ),
                    new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder().setCustomId(`liberarTudo`).setLabel(`Liberar Tudo`).setEmoji(`1246953338541441036`).setStyle(4),
                            new ButtonBuilder().setCustomId(`automaticConfig`).setEmoji(`1246953097033416805`).setStyle(2)
                        )
                ]
            });

        };

        if (customId === "selectAntiFraudBanks") {

            const options = interaction.values;

            await dbC.set("sales.mp.banksOff", options);
            automaticConfig();

        };

        if (customId === "liberarTudo") {

            await dbC.set("sales.mp.banksOff", []);
            automaticConfig();

        };

        if (customId === "semiAutoConfig") {
            semiAutoConfig();
        };

        if (customId === "sistemaSemiOnOff") {

            const statusSemi = await dbC.get("sales.semi.status");

            if (statusSemi) {
                await dbC.set("sales.semi.status", false);
            } else {
                await dbC.set("sales.semi.status", true);
            };

            semiAutoConfig();

        };

        if (customId === "setAgenceSemi") {
            setAgenceSemi();
        };

        if (customId === "setConfigSemi") {

            const modal = new ModalBuilder()
                .setCustomId(`modalAgenceSemi`)
                .setTitle(`Agencia Semi Auto`)

            const option1 = new TextInputBuilder()
                .setCustomId(`chave`)
                .setLabel(`QUAL É A SUA CHAVE PIX?`)
                .setPlaceholder(`EX: profissional@gmail.com`)
                .setMaxLength(500)
                .setStyle("Short")

            const option2 = new TextInputBuilder()
                .setCustomId(`tipo`)
                .setLabel(`QUAL O TIPO DA SUA CHAVE PIX?`)
                .setPlaceholder(`EX: Email / Telefone / CPF`)
                .setMaxLength(100)
                .setStyle("Short")

            const optionx1 = new ActionRowBuilder().addComponents(option1);
            const optionx2 = new ActionRowBuilder().addComponents(option2);

            modal.addComponents(optionx1, optionx2);
            await interaction.showModal(modal);

        };

        if (customId === "modalAgenceSemi") {
            const tipo = interaction.fields.getTextInputValue("tipo");
            const chave = interaction.fields.getTextInputValue("chave");

            await dbC.set("sales.semi.tipo", tipo);
            await dbC.set("sales.semi.chave", chave);
            semiAutoConfig();

        };

        if (customId === "aprovedRoleSemi") {

            interaction.update({
                content: ``,
                embeds: [],
                components: [
                    new ActionRowBuilder()
                        .addComponents(
                            new RoleSelectMenuBuilder()
                                .setCustomId(`selectRoleAprovedSemi`)
                                .setPlaceholder(`✨ Selecionar Cargo`)
                        ),
                    new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder().setCustomId(`setAgenceSemi`).setEmoji(`1246953097033416805`).setStyle(2)
                        )
                ]
            });

        };

        if (customId === "selectRoleAprovedSemi") {

            const role = interaction.values[0];

            await dbC.set("sales.semi.roleAprove", role);
            setAgenceSemi();

        };

        if (customId === "editTempPay2") {

            const modal = new ModalBuilder()
                .setCustomId(`modalTempPay2`)
                .setTitle(`Alterar Tempo Pagamento`)

            const option1 = new TextInputBuilder()
                .setCustomId(`temp`)
                .setLabel(`QUAL O NOVO TEMPO PARA PAGAR? (MINUTOS)`)
                .setPlaceholder(`EX: 10`)
                .setMaxLength(3)
                .setStyle("Short")

            const optionx1 = new ActionRowBuilder().addComponents(option1);

            modal.addComponents(optionx1);
            await interaction.showModal(modal);

        };

        if (customId === "modalTempPay2") {
            const temp = parseInt(interaction.fields.getTextInputValue("temp"));

            if (isNaN(temp)) {
                return interaction.reply({ content: `\`❌\` O tempo para pagamento está inválido, use apenas números.`, ephemeral: true });
            };

            if (temp < 3) {
                return interaction.reply({ content: `\`❌\` O tempo para pagamento não pode ser menos que **3** Minutos`, ephemeral: true });
            };

            if (temp > 120) {
                return interaction.reply({ content: `\`❌\` O tempo para pagamento não pode ser mais que **120** Minutos`, ephemeral: true });
            };

            await dbC.set("sales.semi.tempPay", temp);
            semiAutoConfig();

        };

        async function selersMembers() {

            const status = dbC.get("sales.status");
            const minima = dbC.get("sales.min") || 1;

            const all = await users.all().filter(a => a.data.username);

            await interaction.update({
                content: ``,
                embeds: [
                    new EmbedBuilder()
                    .setColor("#00FFFF")
                    .setAuthor({ name: `${interaction.user.username} - Gerenciamento Sales Members`, iconURL: interaction.user.displayAvatarURL() })
                    .setDescription(`-# \`💸\` Gerenciamento da venda dos seus membros reais.`)
                    .addFields(
                        { name: `Comércio`, value: `\`${status ? "🟢 Aberto" : "🔴 Fechado"}\``, inline: true },
                        { name: `Quantia Mínima`, value: `\`${minima}/${all.length}\``, inline: true },
                        { name: `Valor Unidade`, value: `\`R$ ${parseFloat(dbC.get("sales.unidade") || 0.03).toFixed(2)}\``, inline: true },
                        { name: `Útil`, value: `\`/comercializar\``, inline: false }
                    )
                    .setFooter({ text: `${interaction.guild.name}`, iconURL: interaction.guild.iconURL() })
                    .setTimestamp()
                ],
                components: [
                    new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder().setCustomId(`comerceSalesOnOff`).setLabel(status ? "Aberto" : "Fechado").setEmoji(status ? "1236021048470933575" : "1236021106662707251").setStyle(status ? 3 : 4),
                        new ButtonBuilder().setCustomId(`smQuantMembers`).setLabel(`Ajustar Mínima`).setEmoji(`1246953254810816542`).setStyle(1),
                        new ButtonBuilder().setCustomId(`unidSalerMembers`).setLabel(`Valor Unidade`).setEmoji(`1246953442283618334`).setStyle(3)
                    ),
                    new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder().setCustomId(`paymentsConfig`).setLabel(`ChaveRecibo`).setEmoji(`1302019361623769281`).setStyle(1),
                        new ButtonBuilder().setCustomId(`cacheConfig`).setEmoji(`1246953097033416805`).setStyle(2)
                    )
                ]
            });

        };

        async function paymentsConfig() {

            const statusMp = await dbC.get("sales.mp.status");
            const access = await dbC.get("sales.mp.access");

            const statusSemi = await dbC.get("sales.semi.status");
            const chave = await dbC.get("sales.semi.chave");

            await interaction.update({
                content: ``,
                embeds: [
                    new EmbedBuilder()
                        .setAuthor({ name: `${interaction.user.username} - Gerenciando ChaveRecibo`, iconURL: interaction.user.displayAvatarURL() })
                        .setDescription(`-# \`👤\` Gerenciamento do sistema **ChaveRecibo**.`)
                        .addFields(
                            { name: `⚡ Automático`, value: `${statusMp ? "\`(✅ | ON)\` **Sistema**" : "\`(🔴 | OFF)\` **Sistema**"}\n${!access ? "\`(🔎 | NOT FOUND)\` **API**" : "\`(📡 | RUNNING)\` **API**"}`, inline: true },
                            { name: `📋 Semi Auto`, value: `${statusSemi ? "\`(✅ | ON)\` **Sistema**" : "\`(🔴 | OFF)\` **Sistema**"}\n${!chave ? "\`(🔎 | NOT FOUND)\` **Chave**" : "\`(📫 | SETADA)\` **Chave**"}`, inline: true },
                            { name: `💳 Cartão Stripe`, value: `\`(🔴 | OFF)\` **Sistema**\n\`(🔎 | NOT FOUND)\` **Stripe**`, inline: true },
                            { name: `💱 Bit Coin`, value: `\`(🔴 | OFF)\` **Sistema**\n\`(🔎 | NOT FOUND)\` **Configuração**`, inline: true }
                        )
                        .setColor(`#00FFFF`)
                        .setFooter({ text: `${interaction.guild.name}`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                        .setTimestamp()
                ],
                components: [
                    new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder().setCustomId(`automaticConfig`).setLabel(`Gerenciar Automático`).setEmoji(`1302019699176902717`).setStyle(1),
                            new ButtonBuilder().setCustomId(`semiAutoConfig`).setLabel(`Sistema de Semi Auto`).setEmoji(`1302018395851722763`).setStyle(1)
                        ),
                    new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder().setCustomId(`stripeConfig`).setLabel(`Setar Cartão Stripe`).setEmoji(`1295039474891489301`).setStyle(1).setDisabled(true),
                            new ButtonBuilder().setCustomId(`bitCoinConfig`).setLabel(`Configurar Bit Coin`).setEmoji(`1295039423582441546`).setStyle(1).setDisabled(true)
                        ),
                    new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder().setCustomId(`selersMembers`).setEmoji(`1246953097033416805`).setStyle(2)
                        )
                ]
            });

        };

        async function automaticConfig() {

            const statusMp = await dbC.get("sales.mp.status");
            const access = await dbC.get("sales.mp.access");
            const tempoPay = await dbC.get("sales.mp.tempPay");
            const banksOffArray = await dbC.get("sales.mp.banksOff") || [];

            const banksOff = banksOffArray.map(bank => `${bank} `).join('\n');

            await interaction.update({
                content: ``,
                embeds: [
                    new EmbedBuilder()
                        .setAuthor({ name: `${interaction.user.username} - Gerenciando Automático`, iconURL: interaction.user.displayAvatarURL() })
                        .setDescription(`-# \`⚡\` Gerenciamento do sistema **Automático**.\n\n-# **Observação:** Na área de automação de pagamento, você vai agilizar o seu processo sem ter que aprovar manualmente um carrinho criado. Use as funções abaixo para setar sua **Creandencia do Access Token** & **Bloquear bancos** que tem índices de fraudes.`)
                        .addFields(
                            { name: `Sistema`, value: `${statusMp ? "\`🟢 Online\`" : "\`🔴 Offline\`"}` },
                            { name: `Tempo Pagar`, value: `\`${tempoPay} Minuto(s)\`` },
                            { name: `Crendencias Access Token`, value: `${!access ? "\`\`\`APP_USR-000000000000000-XXXXXXX-XXXXXXXXX\`\`\`" : `\`\`\`${access.slice(0, -33) + '***************************'}\`\`\``}` },
                            { name: `Bancos Bloqueados`, value: `${banksOffArray.length <= 0 ? `Nenhum` : `\`\`\`${banksOff}\`\`\``}` }
                        )
                        .setColor(`#00FFFF`)
                        .setFooter({ text: `${interaction.guild.name}`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                        .setTimestamp()
                ],
                components: [
                    new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder().setCustomId(`sistemaMpOnOff`).setLabel(statusMp ? "Online" : "Offline").setEmoji(statusMp ? "1236021048470933575" : "1236021106662707251").setStyle(statusMp ? 3 : 4),
                            new ButtonBuilder().setCustomId(`setAccessToken`).setLabel(`Access Token`).setEmoji(`1249371859925864572`).setStyle(1),
                            new ButtonBuilder().setCustomId(`editTempPay`).setLabel(`Tempo Pagar`).setEmoji(`1302020565552599040`).setStyle(1),
                            new ButtonBuilder().setCustomId(`antFraudSet`).setLabel(`Anti Fraude`).setEmoji(`1302021690045497424`).setStyle(2)
                        ),
                    new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder().setCustomId(`paymentsConfig`).setEmoji(`1246953097033416805`).setStyle(2)
                        )
                ]
            });

        };

        async function semiAutoConfig() {

            const statusSemi = await dbC.get("sales.semi.status");
            const tempoPay = await dbC.get("sales.semi.tempPay");

            await interaction.update({
                content: ``,
                embeds: [
                    new EmbedBuilder()
                        .setAuthor({ name: `${interaction.user.username} - Gerenciando Semi Auto`, iconURL: interaction.user.displayAvatarURL() })
                        .setDescription(`-# \`📋\` Gerenciamento do sistema **Semi Auto**.\n\n-# **Observação:** A área de Semi Auto é um sistema útil para quem não tem o mercado pago, esse sistema é preciso aprovar manualmente o pagamento da pessoa que está adquirindo os alugueis da loja/apps. Configire **Tipo/Chave** & **Cargo Aprovador** logo abaixo.`)
                        .addFields(
                            { name: `Sistema`, value: `${statusSemi ? "\`🟢 Online\`" : "\`🔴 Offline\`"}` },
                            { name: `Tempo Pagar`, value: `\`${tempoPay} Minuto(s)\`` }
                        )
                        .setColor(`#00FFFF`)
                        .setFooter({ text: `${interaction.guild.name}`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                        .setTimestamp()
                ],
                components: [
                    new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder().setCustomId(`sistemaSemiOnOff`).setLabel(statusSemi ? "Online" : "Offline").setEmoji(statusSemi ? "1236021048470933575" : "1236021106662707251").setStyle(statusSemi ? 3 : 4),
                            new ButtonBuilder().setCustomId(`setAgenceSemi`).setLabel(`Setar Agências`).setEmoji(`1302020457276375050`).setStyle(1),
                            new ButtonBuilder().setCustomId(`editTempPay2`).setLabel(`Tempo Pagar`).setEmoji(`1302020565552599040`).setStyle(1)
                        ),
                    new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder().setCustomId(`paymentsConfig`).setEmoji(`1246953097033416805`).setStyle(2)
                        )
                ]
            });

        };

        async function setAgenceSemi() {

            const tipo = await dbC.get("sales.semi.tipo");
            const chave = await dbC.get("sales.semi.chave");
            const roleAprove = await dbC.get("sales.semi.roleAprove");

            const roleMention = await interaction.guild.roles.cache.get(roleAprove);

            interaction.update({
                content: ``,
                embeds: [
                    new EmbedBuilder()
                        .setAuthor({ name: `${interaction.user.username} - Gerenciando Agências`, iconURL: interaction.user.displayAvatarURL() })
                        .setDescription(`-# \`🧪\` Gerenciamento do sistema **Agências**.`)
                        .addFields(
                            { name: `Configuração`, value: `${tipo && chave ? `\`${chave} | ${tipo}\`` : `\`🔴 Não configurado.\``}`, inline: true },
                            { name: `Cargo Aprovador`, value: `${!roleAprove ? `\`🔴 Não configurado.\`` : `${roleMention}`}`, inline: true }
                        )
                        .setColor(`#00FFFF`)
                        .setFooter({ text: `${interaction.guild.name}`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                        .setTimestamp()
                ],
                components: [
                    new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder().setCustomId(`setConfigSemi`).setLabel(`Setar Configuração`).setEmoji(`1302019361623769281`).setStyle(1),
                            new ButtonBuilder().setCustomId(`aprovedRoleSemi`).setLabel(`Cargo Aprovador`).setEmoji(`1302018377279078581`).setStyle(1),
                        ),
                    new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder().setCustomId(`semiAutoConfig`).setEmoji(`1246953097033416805`).setStyle(2)
                        )
                ]
            });

        };



        // --------------------------------------------- BOTÃO DE RASTREAMENTO --------------------------------------------- \\

        if (customId === "rastrearConfig") {
            rastrearConfig();
        };

        if (customId === "selectRastreioConfig") {

            const option = interaction.values[0];

            if (option === "altOnOff") {

                const alt = await dbC.get("rastrear.ALT");

                if (alt) {
                    await dbC.set("rastrear.ALT", false);
                } else {
                    await dbC.set("rastrear.ALT", true);
                };

                rastrearConfig();

            };

            if (option === "emailOnOff") {

                const email = await dbC.get("rastrear.EMAIL");

                if (email) {
                    await dbC.set("rastrear.EMAIL", false);
                } else {
                    await dbC.set("rastrear.EMAIL", true);
                };

                rastrearConfig();

            };

            if (option === "ipUserOnOff") {

                const ipuser = await dbC.get("rastrear.IPUSER");

                if (ipuser) {
                    await dbC.set("rastrear.IPUSER", false);
                } else {
                    await dbC.set("rastrear.IPUSER", true);
                };

                rastrearConfig();

            };

        };

        async function rastrearConfig() {

            const alt = await dbC.get("rastrear.ALT");
            const email = await dbC.get("rastrear.EMAIL");
            const ipuser = await dbC.get("rastrear.IPUSER");

            interaction.update({
                content: ``,
                embeds: [
                    new EmbedBuilder()
                        .setColor("#00FFFF")
                        .setAuthor({ name: `${interaction.user.username} - Gerenciamento Rastreamento`, iconURL: interaction.user.displayAvatarURL() })
                        .setDescription(`-# \`📡\` Gerenciamento dos rastreamentos.\n\n-# **Observação:** Se caso o rastreamento do **ALT** estiver ativo, ele vai banir automáticamente a conta alt de alguém.`)
                        .addFields(
                            { name: `ALT`, value: `\`${alt ? "🟢 Habilitado" : "🔴 Desabilitado"}\``, inline: true },
                            { name: `EMAIL`, value: `\`${email ? "🟢 Habilitado" : "🔴 Desabilitado"}\``, inline: true },
                            { name: `IP USER`, value: `\`${ipuser ? "🟢 Habilitado" : "🔴 Desabilitado"}\``, inline: true }
                        )
                        .setFooter({ text: `${interaction.guild.name}`, iconURL: interaction.guild.iconURL() })
                        .setTimestamp()
                ],
                components: [
                    new ActionRowBuilder()
                        .addComponents(
                            new StringSelectMenuBuilder()
                                .setCustomId(`selectRastreioConfig`)
                                .setPlaceholder(`📡 | Gerenciar Rastreamento`)
                                .addOptions(
                                    {
                                        value: `back`,
                                        label: `Voltar para o início`,
                                        emoji: `1246953097033416805`
                                    },
                                    {
                                        value: `altOnOff`,
                                        label: `Rastreamento Alt`,
                                        description: `${alt ? "🟢 Realizar Rastreamento" : "🔴 Não Rastrear"}`,
                                        emoji: `1302019361623769281`
                                    },
                                    {
                                        value: `emailOnOff`,
                                        label: `Rastreamento Email`,
                                        description: `${email ? "🟢 Realizar Rastreamento" : "🔴 Não Rastrear"}`,
                                        emoji: `1303148134964138014`
                                    },
                                    {
                                        value: `ipUserOnOff`,
                                        label: `Rastreamento Ip User`,
                                        description: `${ipuser ? "🟢 Realizar Rastreamento" : "🔴 Não Rastrear"}`,
                                        emoji: `1303147777982730291`
                                    }
                                )
                        )
                ]
            });

        };



        // --------------------------------------------- BOTÃO DE CONFIGURAÇÃO/DEFINIÇÕES --------------------------------------------- \\

        if (customId === "definitions") {
            definitions();
        };

        if (customId === "channelsConfig") {
            channelsConfig();
        };

        if (customId === "editChannelLogsPriv") {

            interaction.update({
                content: `# O que você acha melhor?\n\n**Formatação Manual:** Você configura o canal que vai setar.\n**Formatação Auto Build:** Auto criar um canal e setar ele.`,
                embeds: [],
                components: [
                    new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder().setCustomId(`manualConfigLogsPriv`).setLabel(`Manualmente`).setEmoji(`1303147802397900900`).setStyle(1),
                            new ButtonBuilder().setCustomId(`autoBuildLogsPriv`).setLabel(`Auto Build`).setEmoji(`1302018423902965780`).setStyle(1),
                            new ButtonBuilder().setCustomId(`channelsConfig`).setEmoji(`1246953097033416805`).setStyle(2)
                        )
                ],
                ephemeral: true
            });

        };

        if (customId === "manualConfigLogsPriv") {

            interaction.update({
                content: ``,
                embeds: [],
                components: [
                    new ActionRowBuilder()
                        .addComponents(
                            new ChannelSelectMenuBuilder()
                                .setCustomId(`selectLogsPriv`)
                                .setPlaceholder(`📫 | Selecionar Canal`)
                                .setChannelTypes(ChannelType.GuildText)
                        ),
                    new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder().setCustomId(`editChannelLogsPriv`).setEmoji(`1246953097033416805`).setStyle(2)
                        )
                ]
            });

        };

        if (customId === "selectLogsPriv") {

            const channel = interaction.values[0];

            await dbC.set("channels.logsPriv", channel);
            await channelsConfig();

            interaction.followUp({ content: `\`🟢\` O canal de logs privadas foi alterado com êxito.`, ephemeral: true });

        };

        if (customId === "autoBuildLogsPriv") {

            try {
                const category = await interaction.guild.channels.create({
                    name: `@ADMINISTRAÇÃO LOGS`,
                    type: ChannelType.GuildCategory
                });

                const channelCreateLogs = await interaction.guild.channels.create({
                    name: `🔒・logs-privadas`,
                    type: ChannelType.GuildText,
                    parent: category.id,
                    permissionOverwrites: [
                        {
                            id: interaction.guild.roles.everyone,
                            deny: ['ViewChannel']
                        }
                    ]
                });

                await dbC.set("channels.logsPriv", channelCreateLogs.id);
                await channelsConfig();

                interaction.followUp({ content: `\`🟢\` O canal de logs privadas foi automáticamente criado e alterado com êxito.`, ephemeral: true });
            } catch (err) {
                interaction.followUp({ content: `\`🔴\` Ocorreu um erro ao tentar criar o canal de logs privadas, tente novamente mais tarde!`, ephemeral: true });
            };

        };

        if (customId === "delChannelLogsPriv") {

            await dbC.delete("channels.logsPriv");
            await channelsConfig();

            interaction.followUp({ content: `\`🟢\` O canal de logs privadas foi **removido** com êxito.`, ephemeral: true });

        };

        if (customId === "rolesConfig") {
            rolesConfig();
        };

        if (customId === "roleVerifyConfig") {

            interaction.update({
                content: ``,
                embeds: [],
                components: [
                    new ActionRowBuilder()
                        .addComponents(
                            new RoleSelectMenuBuilder()
                                .setCustomId(`selectRoleVerify`)
                                .setPlaceholder(`⚡ | Selecionar Cargo`)
                        ),
                    new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder().setCustomId(`rolesConfig`).setEmoji(`1246953097033416805`).setStyle(2)
                        )
                ]
            });

        };

        if (customId === "selectRoleVerify") {

            const role = interaction.values[0];

            await dbC.set("roles.verify", role);
            await rolesConfig();

            interaction.followUp({ content: `\`🟢\` O cargo de verificado foi alterado com êxito.`, ephemeral: true });

        };

        if (customId === "webSiteConfig") {
            webSiteConfig();
        };

        if (customId === "iconUrlSiteEdit") {

            const modal = new ModalBuilder()
                .setCustomId(`modalIconSiteEdit`)
                .setTitle(`Alterar Ícone Site`)

            const option1 = new TextInputBuilder()
                .setCustomId(`url`)
                .setLabel(`QUAL A URL PARA O ÍCONE?`)
                .setPlaceholder(`https://...`)
                .setStyle("Short")

            const optionx1 = new ActionRowBuilder().addComponents(option1);

            modal.addComponents(optionx1);
            await interaction.showModal(modal);

        };

        if (customId === "modalIconSiteEdit") {
            const url = interaction.fields.getTextInputValue("url");

            if (!link(url)) {
                return interaction.reply({ content: `\`🔴\` Url incorreta, use uma url válida!`, ephemeral: true });
            };

            await dbC.set("webSite.iconUrl", url);
            await webSiteConfig();

            interaction.followUp({ content: `\`🟢\` O ícone do site foi alterado com êxito.`, ephemeral: true });

        };

        if (customId === "bannerUrlSiteEdit") {

            const modal = new ModalBuilder()
                .setCustomId(`modalBannerSiteEdit`)
                .setTitle(`Alterar Banner Site`)

            const option1 = new TextInputBuilder()
                .setCustomId(`url`)
                .setLabel(`QUAL A URL PARA O BANNER?`)
                .setPlaceholder(`https://...`)
                .setStyle("Short")

            const optionx1 = new ActionRowBuilder().addComponents(option1);

            modal.addComponents(optionx1);
            await interaction.showModal(modal);

        };

        if (customId === "modalBannerSiteEdit") {
            const url = interaction.fields.getTextInputValue("url");

            if (!link(url)) {
                return interaction.reply({ content: `\`🔴\` Url incorreta, use uma url válida!`, ephemeral: true });
            };

            await dbC.set("webSite.bannerUrl", url);
            await webSiteConfig();

            interaction.followUp({ content: `\`🟢\` O banner do site foi alterado com êxito.`, ephemeral: true });

        };

        if (customId === "txtButSiteEdit") {

            const modal = new ModalBuilder()
                .setCustomId(`modalTextButSiteEdit`)
                .setTitle(`Alterar Texto Botão`)

            const option1 = new TextInputBuilder()
                .setCustomId(`txt`)
                .setLabel(`QUAL O TEXTO PARA O BOTÃO?`)
                .setPlaceholder(`EX: Voltar para o servidor`)
                .setMaxLength(50)
                .setStyle("Short")

            const optionx1 = new ActionRowBuilder().addComponents(option1);

            modal.addComponents(optionx1);
            await interaction.showModal(modal);

        };

        if (customId === "modalTextButSiteEdit") {
            const txt = interaction.fields.getTextInputValue("txt");

            await dbC.set("webSite.butName", txt);
            await webSiteConfig();

            interaction.followUp({ content: `\`🟢\` O texto do botão do site foi alterado com êxito.`, ephemeral: true });

        };

        if (customId === "urlButSiteEdit") {

            const modal = new ModalBuilder()
                .setCustomId(`modalUrlButSiteEdit`)
                .setTitle(`Alterar Url Botão`)

            const option1 = new TextInputBuilder()
                .setCustomId(`url`)
                .setLabel(`QUAL A URL PARA O BOTÃO?`)
                .setPlaceholder(`https://...`)
                .setStyle("Short")

            const optionx1 = new ActionRowBuilder().addComponents(option1);

            modal.addComponents(optionx1);
            await interaction.showModal(modal);

        };

        if (customId === "modalUrlButSiteEdit") {
            const url = interaction.fields.getTextInputValue("url");

            if (!link(url)) {
                return interaction.reply({ content: `\`🔴\` Url incorreta, use uma url válida!`, ephemeral: true });
            };

            await dbC.set("webSite.urlButton", url);
            await webSiteConfig();

            interaction.followUp({ content: `\`🟢\` O url do botão do site foi alterado com êxito.`, ephemeral: true });

        };

        if (customId === "secondsSiteEdit") {

            const modal = new ModalBuilder()
                .setCustomId(`modalSecondsSiteEdit`)
                .setTitle(`Alterar Segundos De Retorno`)

            const option1 = new TextInputBuilder()
                .setCustomId(`seconds`)
                .setLabel(`QUANTOS SEGUNDOS PARA RETORNAR A URL?`)
                .setPlaceholder(`EX: 10`)
                .setMaxLength(3)
                .setStyle("Short")

            const optionx1 = new ActionRowBuilder().addComponents(option1);

            modal.addComponents(optionx1);
            await interaction.showModal(modal);

        };

        if (customId === "modalSecondsSiteEdit") {
            const seconds = interaction.fields.getTextInputValue("seconds");

            if (isNaN(seconds)) {
                return interaction.reply({ content: `\`🔴\` Isso é um número inválido, tente novamente!`, ephemeral: true });
            };

            if (seconds < 3) {
                return interaction.reply({ content: `\`🔴\` Não pode ser menos que **3 segundos**, tente novamente!`, ephemeral: true });
            };

            await dbC.set("webSite.seconds", seconds);
            await webSiteConfig();

            interaction.followUp({ content: `\`🟢\` Os segundos de retorno do site foi alterado com êxito.`, ephemeral: true });

        };

        async function definitions() {

            await interaction.update({
                content: ``,
                embeds: [
                    new EmbedBuilder()
                        .setColor("#00FFFF")
                        .setAuthor({ name: `${interaction.user.username} - Gerenciamento Configurações Gerais`, iconURL: interaction.user.displayAvatarURL() })
                        .setDescription(`-# \`🔧\` Gerenciamento das configurações gerais do sistema.\n\n-# **Observação:** Nesta parte terá configurações diversas para você gerenciar em seu sistema, aqui também fica configurações icônicas como gerenciar **canais, cargos e etc**!`)
                        .setFooter({ text: `${interaction.guild.name}`, iconURL: interaction.guild.iconURL() })
                        .setTimestamp()
                ],
                components: [
                    new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder().setCustomId(`channelsConfig`).setLabel(`Canais`).setEmoji(`1302019349296713769`).setStyle(2),
                            new ButtonBuilder().setCustomId(`rolesConfig`).setLabel(`Cargos`).setEmoji(`1246955106944028774`).setStyle(2),
                            new ButtonBuilder().setCustomId(`boasVindasEdit`).setLabel(`Boas Vindas`).setEmoji(`1302020863339663370`).setStyle(2).setDisabled(true),
                            new ButtonBuilder().setCustomId(`webSiteConfig`).setLabel(`Meu WebSite Design`).setEmoji(`1297641546077835314`).setStyle(1)
                        ),
                    new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder().setCustomId(`back`).setEmoji(`1246953097033416805`).setStyle(2)
                        )
                ]
            });

        };

        async function channelsConfig() {

            const logsPriv = await dbC.get("channels.logsPriv");

            await interaction.update({
                content: ``,
                embeds: [
                    new EmbedBuilder()
                        .setColor("#00FFFF")
                        .setAuthor({ name: `${interaction.user.username} - Gerenciamento Canais Sistema`, iconURL: interaction.user.displayAvatarURL() })
                        .setDescription(`-# \`📫\` Gerenciamento dos canais do sistema.`)
                        .addFields(
                            { name: `Canal logs privadas`, value: `${logsPriv ? interaction.guild.channels.cache.get(logsPriv) : "\`🔴 Não configurado.\`"}` }
                        )
                        .setFooter({ text: `${interaction.guild.name}`, iconURL: interaction.guild.iconURL() })
                        .setTimestamp()
                ],
                components: [
                    new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder().setCustomId(!logsPriv ? "editChannelLogsPriv" : "delChannelLogsPriv").setLabel(!logsPriv ? "Canal logs privadas" : "Remover logs privadas").setEmoji(!logsPriv ? "1247226518808301750" : "1246953338541441036").setStyle(!logsPriv ? 1 : 4),
                            new ButtonBuilder().setCustomId(`definitions`).setEmoji(`1246953097033416805`).setStyle(2)
                        )
                ]
            });

        };

        async function rolesConfig() {

            const roleVerify = await dbC.get("roles.verify");

            await interaction.update({
                content: ``,
                embeds: [
                    new EmbedBuilder()
                        .setColor("#00FFFF")
                        .setAuthor({ name: `${interaction.user.username} - Gerenciamento Cargos Sistema`, iconURL: interaction.user.displayAvatarURL() })
                        .setDescription(`-# \`⚡\` Gerenciamento dos cargos do sistema.`)
                        .addFields(
                            { name: `Cargo verificado`, value: `${roleVerify ? interaction.guild.roles.cache.get(roleVerify) : "\`🔴 Não configurado.\`"}`, inline: true },
                            { name: `Canal membro`, value: "\`🔴 Não configurado.\`", inline: true }
                        )
                        .setFooter({ text: `${interaction.guild.name}`, iconURL: interaction.guild.iconURL() })
                        .setTimestamp()
                ],
                components: [
                    new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder().setCustomId(`roleVerifyConfig`).setLabel(`Cargo verificado`).setEmoji(`1302018377279078581`).setStyle(1),
                            new ButtonBuilder().setCustomId(`roleMemberConfig`).setLabel(`Cargo membro`).setEmoji(`1246955057879187508`).setStyle(1).setDisabled(true),
                            new ButtonBuilder().setCustomId(`definitions`).setEmoji(`1246953097033416805`).setStyle(2)
                        )
                ]
            });

        };

        async function webSiteConfig() {

            const iconUrl = await dbC.get("webSite.iconUrl");
            const bannerUrl = await dbC.get("webSite.bannerUrl");

            const buttonName = await dbC.get("webSite.butName");
            const buttonUrl = await dbC.get("webSite.urlButton");

            const seconds = await dbC.get("webSite.seconds") || 10;

            await interaction.update({
                content: ``,
                embeds: [
                    new EmbedBuilder()
                        .setColor("#00FFFF")
                        .setAuthor({ name: `${interaction.user.username} - Gerenciamento Web Site Design`, iconURL: interaction.user.displayAvatarURL() })
                        .setDescription(`-# \`📋\` Gerenciamento do **web site design oauth2**.`)
                        .setThumbnail(`${iconUrl || interaction.guild.iconURL()}`)
                        .setImage(bannerUrl || 'https://i.ibb.co/VjWH1kV/9f58ba77d85faa95ec9da272efafc35d.webp')
                        .addFields(
                            { name: `Texto Botão`, value: `\`${buttonName || 'Voltar para o servidor'}\``, inline: true },
                            { name: `Segundos Retorno`, value: `\`⏰ ${Number(seconds)}s\``, inline: true }
                        )
                        .setFooter({ text: `${interaction.guild.name}`, iconURL: interaction.guild.iconURL() })
                        .setTimestamp()
                ],
                components: [
                    new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder().setCustomId(`iconUrlSiteEdit`).setLabel(`Ícone Site`).setEmoji(`1246953177002278972`).setStyle(1),
                            new ButtonBuilder().setCustomId(`bannerUrlSiteEdit`).setLabel(`Banner Site`).setEmoji(`1246953177002278972`).setStyle(1),
                            new ButtonBuilder().setCustomId(`txtButSiteEdit`).setLabel(`Botão Txt`).setEmoji(`1303151059757436989`).setStyle(1)
                        ),
                    new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder().setCustomId(`urlButSiteEdit`).setLabel(`Botão Url`).setEmoji(`1302020475760934973`).setStyle(1),
                            new ButtonBuilder().setURL(buttonUrl || "https://discord.com/").setLabel(`Url Butão`).setEmoji(`1303149881233506304`).setStyle(5),
                            new ButtonBuilder().setCustomId(`secondsSiteEdit`).setLabel(`Set Seconds`).setEmoji(`1303150651961905253`).setStyle(2)
                        ),
                    new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder().setCustomId(`definitions`).setEmoji(`1246953097033416805`).setStyle(2)
                        )
                ]
            });

        };



        // --------------------------------------------- COISAS GERAIS NECESSÁRIAS --------------------------------------------- \\

        if (customId === "back") {
            initial();
        };

        if (customId === "selectRastreioConfig") {

            const option = interaction.values[0];

            if (option === "back") {
                initial();
            };

        };

        async function verifyWebhook(url) {
            try {
                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                return response.ok;
            } catch (error) {
                return false;
            };
        };

        function link(n) {
            const urlRegex = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/;
            return urlRegex.test(n);
        };

        function isValidHexColor(hexColor) {
            return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hexColor);
        };

        function isValidEmoji(e) {
            const emojiRegex = /<a?:[a-zA-Z0-9_]+:\d+>|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\u2600-\u27BF]/;
            return emojiRegex.test(e);
        };

    }
}