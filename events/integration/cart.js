const { ChannelType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ModalBuilder, TextInputBuilder } = require("discord.js");
const { dbC, users, carts } = require("../../databases/index");

module.exports = {
    name: `interactionCreate`,

    run: async (interaction, client) => {
        const { customId } = interaction;
        if (!customId) return;

        if (customId === "buyMembers") {

            if (!dbC.get("sales.status")) {
                return interaction.reply({ content: `\`❌\` O comércio de membros está atualmente sem desativado.`, ephemeral: true });
            };

            if (!dbC.get("sales.mp.status") && !dbC.get("sales.semi.status")) {
                return interaction.reply({ content: `\`❌\` Todos os metodos de pagamento estão desativados.`, ephemeral: true });
            };

            if (!dbC.get("sales.mp.access") && !dbC.get("sales.semi.chave")) {
                return interaction.reply({ content: `\`❌\` Todos os metodos de pagamento estão mal configurados.`, ephemeral: true });
            };

            const exist = interaction.channel.threads.cache.find(thread => thread.name === `🛒・${interaction.user.username}`);

            if (exist) {
                return interaction.reply({ content: `\`⚠️\` Você já tem um canal aberto em ${exist.url}`, ephemeral: true });
            };

            if (!interaction.message.channel.permissionsFor(client.user).has("CreatePrivateThreads")) {
                return interaction.reply({ content: `\`⚠️\` Eu não consigo abrir um tópico!`, ephemeral: true });
            };

            const permission = [
                {
                    id: interaction.guild.roles.cache.find(role => role.id === dbC.get("sales.semi.roleAprove")),
                    allow: ['VIEW_CHANNEL']
                }
            ];

            await interaction.channel.threads.create({
                name: `🛒・${interaction.user.username}`,
                type: ChannelType.PrivateThread,
                reason: 'Needed a separate thread for moderation',
                autoArchiveDuration: 60,
                permissionOverwrites: dbC.get("sales.semi.roleAprove") ? permission : []
            }).then(async (thread) => {

                interaction.reply({
                    content: `\`✅\` Carrinho criado com êxito.`,
                    components: [
                        new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder().setURL(thread.url).setLabel(`Procurar carrinho`).setEmoji(`1302020493779402872`).setStyle(5)
                            )
                    ],
                    ephemeral: true
                });

                const all = await users.all().filter(a => a.data.username);

                thread.send({
                    content: `${interaction.user}${dbC.get("sales.semi.roleAprove") ? ` | ${interaction.guild.roles.cache.get(dbC.get("sales.semi.roleAprove"))}` : ""}`,
                    embeds: [
                        new EmbedBuilder()
                            .setColor(`#00FFFF`)
                            .setAuthor({ name: `${interaction.user.username} - Carrinho Membros`, iconURL: interaction.user.displayAvatarURL() })
                            .setDescription(`-# \`🛒\` Menu inicial do carrinho de membros reais.`)
                            .addFields(
                                { name: `Valor Total`, value: `\`R$ ${parseFloat((dbC.get("sales.unidade") || 0.03) * parseInt(dbC.get("sales.min") || 1)).toFixed(2)}\``, inline: true },
                                { name: `Disponíveis`, value: `\`x${all.length}\``, inline: true },
                                { name: `Carrinho`, value: `\`x${parseInt(dbC.get("sales.min") || 1)} | Membros Reais\``, inline: false }
                            )
                            .setFooter({ text: `${interaction.user.displayName}`, iconURL: interaction.user.displayAvatarURL() })
                            .setTimestamp()
                    ],
                    components: [
                        new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder().setCustomId(`prosseguir`).setLabel(`Prosseguir Compra`).setEmoji(`1246953283826745476`).setStyle(3),
                                new ButtonBuilder().setCustomId(`editStock`).setLabel(`Editar Quantia`).setEmoji(`1246954883182100490`).setStyle(1),
                                new ButtonBuilder().setCustomId(`cancelCart`).setEmoji(`1302020774709952572`).setStyle(2)
                            )
                    ]
                }).then(send => {
                    carts.set(thread.id, {
                        quantia: parseInt(dbC.get("sales.min") || 1),
                        userid: interaction.user.id,
                        status: "proccess",
                        msg: {
                            id: send.id,
                            channel: interaction.channel.id,
                            guild: interaction.guild.id
                        }
                    });

                    if (dbC.get("channels.logsPriv")) {
                        const channel = interaction.guild.channels.cache.get(dbC.get("channels.logsPriv"));

                        channel.send({
                            content: ``,
                            embeds: [
                                new EmbedBuilder()
                                    .setAuthor({ name: `${interaction.user.username} - Pendência Criada`, iconURL: interaction.user.displayAvatarURL() })
                                    .setDescription(`-# \`📋\` Pendência criada com êxito.`)
                                    .addFields(
                                        { name: `Valor Total`, value: `\`R$ ${parseFloat((dbC.get("sales.unidade") || 0.03) * parseInt(dbC.get("sales.min") || 1)).toFixed(2)}\``, inline: true },
                                        { name: `Disponíveis`, value: `\`x${all.length}\``, inline: true },
                                        { name: `Carrinho`, value: `\`x${parseInt(dbC.get("sales.min") || 1)} | Membros Reais\``, inline: false }
                                    )
                                    .setColor(`#00FF00`)
                                    .setFooter({ text: `${interaction.user.displayName}`, iconURL: interaction.user.displayAvatarURL() })
                                    .setTimestamp()
                            ],
                            components: [
                                new ActionRowBuilder()
                                    .addComponents(
                                        new ButtonBuilder().setCustomId(`botN`).setLabel(`Mensagem do Sistema`).setStyle(2).setDisabled(true)
                                    )
                            ]
                        }).catch(error => { });

                    };
                }).catch(error => { });

            });

        };

        if (customId === "prosseguir") {

            interaction.update({
                content: `Qual será a forma de pagamento?`,
                embeds: [],
                components: [
                    new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder().setCustomId(`automaticPay`).setLabel(`Automático`).setEmoji(`1256808767325081683`).setStyle(1).setDisabled(!dbC.get("sales.mp.status")),
                            new ButtonBuilder().setCustomId(`semiAutoPay`).setLabel(`Semi Auto`).setEmoji(`1302020615192187031`).setStyle(1).setDisabled(!dbC.get("sales.semi.status")),
                            new ButtonBuilder().setCustomId(`cancelCart`).setEmoji(`1302020774709952572`).setStyle(2)
                        )
                ]
            });

        };

        if (customId === "editStock") {

            const modal = new ModalBuilder()
                .setCustomId(`modalMultiplique`)
                .setTitle(`Editar Estoque`)

            const option1 = new TextInputBuilder()
                .setCustomId(`stock`)
                .setLabel(`QUANTOS MEMBROS REAIS DESEJA LEVAR?`)
                .setPlaceholder(`EX: 100`)
                .setMaxLength(10)
                .setStyle("Short")

            const optionx1 = new ActionRowBuilder().addComponents(option1);

            modal.addComponents(optionx1);
            await interaction.showModal(modal);

        };

        if (customId === "modalMultiplique") {
            const stock = parseInt(interaction.fields.getTextInputValue("stock"));

            if (isNaN(stock)) {
                return interaction.reply({ content: `\`❌\` Por favor, use apenas números para a quantidade!`, ephemeral: true });
            };

            const all = await users.all().filter(a => a.data.username);

            if (stock > all.length) {
                return interaction.reply({ content: `\`❌\` A quantidade máxima é de \`x${all.length}\`!`, ephemeral: true });
            };

            if (stock < parseInt(dbC.get("sales.min") || 1)) {
                return interaction.reply({ content: `\`❌\` A quantidade mínima é de \`x${parseInt(dbC.get("sales.min") || 1)}\`!`, ephemeral: true });
            };

            await carts.set(`${interaction.channel.id}.quantia`, parseInt(stock));
            interaction.update({
                content: `${interaction.user}${dbC.get("sales.semi.roleAprove") ? ` | ${interaction.guild.roles.cache.get(dbC.get("sales.semi.roleAprove"))}` : ""}`,
                embeds: [
                    new EmbedBuilder()
                        .setColor(`#00FFFF`)
                        .setAuthor({ name: `${interaction.user.username} - Carrinho Membros`, iconURL: interaction.user.displayAvatarURL() })
                        .setDescription(`-# \`🛒\` Menu inicial do carrinho de membros reais.`)
                        .addFields(
                            { name: `Valor Total`, value: `\`R$ ${parseFloat((dbC.get("sales.unidade") || 0.03) * parseInt(carts.get(`${interaction.channel.id}.quantia`))).toFixed(2)}\``, inline: true },
                            { name: `Disponíveis`, value: `\`x${all.length}\``, inline: true },
                            { name: `Carrinho`, value: `\`x${parseInt(carts.get(`${interaction.channel.id}.quantia`))} | Membros Reais\``, inline: false }
                        )
                        .setFooter({ text: `${interaction.user.displayName}`, iconURL: interaction.user.displayAvatarURL() })
                        .setTimestamp()
                ]
            });

        };

        if (customId === "cancelCart") {

            interaction.reply({ content: `\`✅\` O carrinho foi finalizado por ${interaction.user} e irá fechar em alguns segundos...` });

            if (dbC.get("channels.logsPriv")) {
                const channel = interaction.guild.channels.cache.get(dbC.get("channels.logsPriv"));
                const carrin = await carts.get(`${interaction.channel.id}`);

                channel.send({
                    content: ``,
                    embeds: [
                        new EmbedBuilder()
                            .setColor(`#FF0000`)
                            .setAuthor({ name: `${interaction.user.username} - Pendência Encerrada`, iconURL: interaction.user.displayAvatarURL() })
                            .setDescription(`-# \`❌\` Pendência cancelada com êxito.`)
                            .addFields(
                                { name: `Carrinho`, value: `\`x${parseInt(carrin.quantia)} | Membros Reais\``, inline: true },
                                { name: `Valor Total`, value: `\`R$ ${parseFloat((dbC.get("sales.unidade") || 0.03) * parseInt(carrin.quantia)).toFixed(2)}\``, inline: true },
                                { name: `User`, value: `${interaction.user}` }
                            )
                            .setFooter({ text: `${interaction.user.displayName}`, iconURL: interaction.user.displayAvatarURL() })
                            .setTimestamp()
                    ],
                    components: [
                        new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder().setCustomId(`botN`).setLabel(`Mensagem do Sistema`).setStyle(2).setDisabled(true)
                            )
                    ]
                }).catch(error => { });

            };

            setTimeout(async () => {
                try {
                    await carts.delete(interaction.channel.id);
                    interaction.channel.delete();
                } catch (err) { };
            }, 5000);

        };

        if (customId.endsWith("_enviarMembros")) {

            const quantidade = interaction.customId.split("_")[0];

            const modal = new ModalBuilder()
                .setCustomId(`${quantidade}_modalEnvM`)
                .setTitle(`Enviar Membros`)

            const option1 = new TextInputBuilder()
                .setCustomId(`servidor`)
                .setLabel(`Servidor que irá receber?`)
                .setPlaceholder(`EX: 1234567891011121314`)
                .setMaxLength(100)
                .setStyle("Short")

            const optionx1 = new ActionRowBuilder().addComponents(option1);

            modal.addComponents(optionx1);
            await interaction.showModal(modal);

        };

    }
}