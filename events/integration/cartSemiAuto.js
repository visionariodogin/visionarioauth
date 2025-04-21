const { ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ChannelType, EmbedBuilder, ModalBuilder, TextInputBuilder, AttachmentBuilder } = require("discord.js");
const { dbC, users, carts } = require("../../databases/index");

module.exports = {
    name: `interactionCreate`,

    run: async (interaction, client) => {
        const { customId } = interaction;
        if (!customId) return;

        if (customId === "copyPix") {

            const chave = await dbC.get("sales.semi.chave");

            interaction.reply({
                content: chave,
                ephemeral: true
            });

        };

        if (customId === "aproveCarrin") {

            if (!dbC.get("sales.semi.roleAprove")) {
                return interaction.reply({ content: `\`🔎\` Cargo de aprovador não setado!`, ephemeral: true });
            };

            if (!interaction.member.roles.cache.has(dbC.get("sales.semi.roleAprove"))) {
                return interaction.reply({ content: `\`❌\` Você não tem permissão para fazer isso!`, ephemeral: true });
            };

            const currentStatus = await dbC.get(`${interaction.channel.id}.status`);
            if (currentStatus === "aprovado") {
                return interaction.reply({ content: `\`⚠️\` O aluguel já foi aprovado.`, ephemeral: true });
            };

            await carts.set(`${interaction.channel.id}.status`, "aprovado");
            interaction.reply({ content: `\`✅\` Carrinho aprovado com êxito.`, ephemeral: true });
            
        };

        if (customId === "semiAutoPay") {

            const carrin = await carts.get(`${interaction.channel.id}`);
            const all = await users.all().filter(a => a.data.username);

            const valor = parseFloat((dbC.get("sales.unidade") || 0.03) * parseInt(carrin.quantia)).toFixed(2);

            if (!dbC.get("sales.semi.tipo") && !dbC.get("sales.semi.chave")) {
                return interaction.reply({ content: `\`❌\` A forma de pagamento não foi configurada ainda!`, ephemeral: true });
            };

            const timer = setTimeout(async () => {
                interaction.reply({ content: `\`⏰\` Olá ${interaction.user}, o tempo para realizar o pagamento se esgotou, tente novamente abrindo outro carrinho.` }).catch(error => { });

                if (dbC.get("channels.logsPriv")) {
                    const channel = interaction.guild.channels.cache.get(dbC.get("channels.logsPriv"));

                    channel.send({
                        content: ``,
                        embeds: [
                            new EmbedBuilder()
                                .setColor(`#FF0000`)
                                .setAuthor({ name: `${interaction.user.username} - Pendência Encerrada`, iconURL: interaction.user.displayAvatarURL() })
                                .setDescription(`-# \`⏰\` Pendência cancelada por inatividade.`)
                                .addFields(
                                    { name: `Carrinho`, value: `\`x${parseInt(carrin.quantia)} | Membros Reais\``, inline: true },
                                    { name: `Valor Total`, value: `\`R$ ${parseFloat((dbC.get("sales.unidade") || 0.03) * parseInt(carrin.quantia)).toFixed(2)}\``, inline: true }
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
                    } catch { };
                }, 15000);
            }, dbC.get("sales.semi.tempPay") * 60 * 1000);

            const { qrGenerator } = require('../../Lib/QRCodeLib.js')
            const qr = new qrGenerator({ imagePath: './Lib/aaaaa.png' })

            const { QrCodePix } = require('qrcode-pix')

            const valor2 = Number(valor);
            const qrCodePix = QrCodePix({
                version: '01',
                key: await dbC.get("sales.semi.chave"),
                name: await dbC.get("sales.semi.chave"),
                city: 'BRASILIA',
                cep: '28360000',
                value: valor2
            });

            const chavealeatorio = qrCodePix.payload()

            const qrcode = await qr.generate(chavealeatorio)

            const buffer = Buffer.from(qrcode.response, "base64");
            const attachment = new AttachmentBuilder(buffer, { name: "payment.png" });

            let agora = new Date();
            agora.setMinutes(agora.getMinutes() + Number(dbC.get("sales.semi.tempPay")));
            const time = Math.floor(agora.getTime() / 1000);

            const embed = new EmbedBuilder()
                .setColor(`#00FFFF`)
                .setAuthor({ name: `${interaction.user.username} - Pendência Carrinho Realizada`, iconURL: interaction.user.displayAvatarURL() })
                .setDescription(`-# \`✅\` Pendência para realizar pagamento de carrinho realizada.\n-# \`❓\` Entrega semi automática após pagamento, envie um comprovante de pagamento para algum administrador aprovar sua pendência.\n\n**Chave | Tipo de chave:**\n\`\`\`${await dbC.get("sales.semi.chave")} | ${await dbC.get("sales.semi.tipo")}\`\`\``)
                .addFields(
                    { name: `Carrinho`, value: `\`x${parseInt(carrin.quantia)} | Membros Reais\``, inline: true },
                    { name: `Valor Total`, value: `\`R$ ${parseFloat((dbC.get("sales.unidade") || 0.03) * parseInt(carrin.quantia)).toFixed(2)}\``, inline: true },
                    { name: `Tempo Encerrar`, value: `<t:${time}:R>`, inline: true }
                )
                .setFooter({ text: `${interaction.guild.name}`, iconURL: interaction.guild.iconURL() })
                .setTimestamp()

            embed.setImage(`attachment://payment.png`)

            interaction.update({
                content: `<@${carrin.userid}>`,
                embeds: [embed],
                components: [
                    new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder().setCustomId(`copyPix`).setLabel(`MobileService`).setEmoji(`1218967168960434187`).setStyle(1),
                            new ButtonBuilder().setCustomId(`aproveCarrin`).setLabel(`Aprovar Carrinho`).setEmoji(`1246952363143729265`).setStyle(3),
                            new ButtonBuilder().setCustomId(`cancelCart`).setEmoji(`1302020774709952572`).setStyle(2)
                        )
                ],
                files: [attachment]
            }).then(async (msg) => {

                const checkPaymentStatus = setInterval(async () => {

                    if (!interaction.channel) {
                        clearInterval(checkPaymentStatus);
                        clearTimeout(timer);
                        return;
                    };

                    const carrin = await carts.get(`${interaction.channel.id}`);

                    if (carrin?.status === "aprovado") {
                        clearInterval(checkPaymentStatus);

                        await msg.edit({
                            content: `${interaction.user}`,
                            embeds: [
                                new EmbedBuilder()
                                    .setAuthor({ name: `${interaction.user.username} - Carrinho Pago`, iconURL: interaction.user.displayAvatarURL() })
                                    .setDescription(`-# \`✅\` Carrinho pago com êxito!\n-# \`🔎\` Veja algumas informações abaixo:`)
                                    .addFields(
                                        { name: `Carrinho`, value: `\`x${parseInt(carrin.quantia)} | Membros Reais\``, inline: true },
                                        { name: `Valor Total`, value: `\`R$ ${parseFloat((dbC.get("sales.unidade") || 0.03) * parseInt(carrin.quantia)).toFixed(2)}\``, inline: true },
                                        { name: `Banco`, value: `\`⚡ Aprovado Manualmente\`` }
                                    )
                                    .setColor(`#00FF00`)
                                    .setFooter({ text: `${interaction.user.displayName}`, iconURL: interaction.user.displayAvatarURL() })
                                    .setTimestamp()
                            ],
                            components: [
                                new ActionRowBuilder()
                                    .addComponents(
                                        new ButtonBuilder().setCustomId(`${parseInt(carrin.quantia)}_enviarMembros`).setLabel(`Enviar Membros`).setEmoji(`1302021940893978625`).setStyle(3),
                                        new ButtonBuilder().setURL(`https://discord.com/oauth2/authorize?client_id=${client.user.id}&scope=bot%20applications.commands&permissions=8`).setLabel(`Adicionar Bot`).setEmoji(`1302020207753302166`).setStyle(5)
                                    )
                            ],
                            files: []
                        });

                        if (dbC.get("channels.logsPriv")) {
                            const channel = interaction.guild.channels.cache.get(dbC.get("channels.logsPriv"));

                            channel.send({
                                content: ``,
                                embeds: [
                                    new EmbedBuilder()
                                        .setAuthor({ name: `${interaction.user.username} - Carrinho Pago`, iconURL: interaction.user.displayAvatarURL() })
                                        .setDescription(`-# \`✅\` Carrinho pago com êxito!\n-# \`🔎\` Veja algumas informações abaixo:`)
                                        .addFields(
                                            { name: `Carrinho`, value: `\`x${parseInt(carrin.quantia)} | Membros Reais\``, inline: true },
                                            { name: `Valor Total`, value: `\`R$ ${parseFloat((dbC.get("sales.unidade") || 0.03) * parseInt(carrin.quantia)).toFixed(2)}\``, inline: true },
                                            { name: `Banco`, value: `\`⚡ Aprovado Manualmente\`` }
                                        )
                                        .setColor(`#00FF00`)
                                        .setFooter({ text: `${interaction.user.displayName}`, iconURL: interaction.user.displayAvatarURL() })
                                        .setTimestamp()
                                ],
                                components: [
                                    new ActionRowBuilder()
                                        .addComponents(
                                            new ButtonBuilder().setCustomId(`reembolCartOff`).setLabel(`Realizar Reembolso`).setEmoji(`1246953228655132772`).setStyle(2).setDisabled(true)
                                        )
                                ]
                            }).catch(error => { });

                        };

                        clearTimeout(timer);

                    } else { };

                }, 2000);

            });

        };

    }
}