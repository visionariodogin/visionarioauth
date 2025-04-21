const { ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ChannelType, EmbedBuilder, ModalBuilder, TextInputBuilder, AttachmentBuilder } = require("discord.js");
const { dbC, users, carts } = require("../../databases/index");
const mercadopago = require("mercadopago");
const axios = require("axios");
let mp = dbC.get("sales.mp.access");

module.exports = {
    name: `interactionCreate`,

    run: async (interaction, client) => {
        const { customId } = interaction;
        if (!customId) return;

        if (customId === "copyCode") {

            const codigo = await carts.get(`${interaction.channel.id}.copyCola`);

            interaction.reply({
                content: codigo,
                ephemeral: true
            });

        };

        if (customId.endsWith("_reembolCart")) {

            const axios = require('axios');
            await axios.post(`https://api.mercadopago.com/v1/payments/${interaction.customId.split("_")[0]}/refunds`, {}, {
                headers: {
                    'Authorization': `Bearer ${mp}`
                }
            }).catch(error => { });

            interaction.update({
                components: [
                    new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder().setCustomId(`reembolsado`).setLabel(`Reembolsado`).setEmoji(`1246952363143729265`).setStyle(3).setDisabled(true)
                        )
                ]
            });

        };

        if (customId === "automaticPay") {

            const carrin = await carts.get(`${interaction.channel.id}`);
            const all = await users.all().filter(a => a.data.username);

            const valor = parseFloat((dbC.get("sales.unidade") || 0.03) * parseInt(carrin.quantia)).toFixed(2);

            if (!dbC.get("sales.mp.access")) {
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
            }, dbC.get("sales.mp.tempPay") * 60 * 1000);

            const payment_data = {
                transaction_amount: Number(valor),
                description: `Cobrança - ${interaction.user.username}`,
                payment_method_id: "pix",
                payer: {
                    email: `${interaction.user?.id}@gmail.com`,
                }
            };

            mercadopago.configurations.setAccessToken(mp);
            await mercadopago.payment.create(payment_data)
                .then(async (paymentResponse) => {

                    const data = paymentResponse.body;
                    const qrCode = data.point_of_interaction.transaction_data.qr_code;
                    const { qrGenerator } = require('../../Lib/QRCodeLib')
                    const qr = new qrGenerator({ imagePath: './Lib/aaaaa.png' })
                    const qrcode = await qr.generate(qrCode)

                    const buffer = Buffer.from(qrcode.response, "base64");
                    const attachment = new AttachmentBuilder(buffer, { name: "payment.png" });

                    let agora = new Date();
                    agora.setMinutes(agora.getMinutes() + Number(dbC.get("sales.mp.tempPay")));
                    const time = Math.floor(agora.getTime() / 1000);

                    const embed = new EmbedBuilder()
                        .setColor(`#00FFFF`)
                        .setAuthor({ name: `${interaction.user.username} - Pendência Carrinho Realizada`, iconURL: interaction.user.displayAvatarURL() })
                        .setDescription(`-# \`✅\` Pendência para realizar pagamento de carrinho realizada.\n-# \`❓\` Entrega automática após pagamento.\n\n**Código copia e cola:**\n\`\`\`${qrCode}\`\`\``)
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
                                    new ButtonBuilder().setCustomId(`copyCode`).setLabel(`MobileService`).setEmoji(`1218967168960434187`).setStyle(1),
                                    new ButtonBuilder().setURL(data.point_of_interaction.transaction_data.ticket_url).setLabel(`Pagar por site`).setEmoji(`1302020475760934973`).setStyle(5),
                                    new ButtonBuilder().setCustomId(`cancelCart`).setEmoji(`1302020774709952572`).setStyle(2)
                                )
                        ],
                        files: [attachment]
                    }).then(async (msg) => {

                        await carts.set(`${interaction.channel.id}.copyCola`, qrCode);

                        const checkPaymentStatus = setInterval(() => {
                            axios.get(`https://api.mercadopago.com/v1/payments/${data?.id}`, {
                                headers: {
                                    'Authorization': `Bearer ${mp}`
                                }
                            }).then(async (doc) => {

                                if (!interaction.channel) {
                                    clearInterval(checkPaymentStatus);
                                    clearTimeout(timer);
                                    return;
                                };

                                if (doc?.data.status === "approved") {

                                    const blockedBanks = dbC.get("sales.mp.banksOff");
                                    const longName = doc.data.point_of_interaction.transaction_data.bank_info.payer.long_name.toLowerCase();
                                    const encontrado = blockedBanks.some(banco => longName.includes(banco));

                                    if (encontrado) {
                                        clearInterval(checkPaymentStatus);

                                        await msg.edit({
                                            content: `${interaction.user} **Fechando carrinho por Anti Fraude...**`,
                                            embeds: [
                                                new EmbedBuilder()
                                                    .setAuthor({ name: `${interaction.user.username} - Anti Fraude Detectada`, iconURL: interaction.user.displayAvatarURL() })
                                                    .setDescription(`-# \`🔎\` Por questão de segurança a sua transferência com o banco \`${doc.data.point_of_interaction.transaction_data.bank_info.payer.long_name}\` foi cancelada.\n-# \`❓\` Está em dúvida ou precisa de ajuda com algo? Contate o suporte!`)
                                                    .addFields(
                                                        { name: `Carrinho`, value: `\`x${parseInt(carrin.quantia)} | Membros Reais\``, inline: true },
                                                        { name: `Valor Total`, value: `\`R$ ${parseFloat((dbC.get("sales.unidade") || 0.03) * parseInt(carrin.quantia)).toFixed(2)}\``, inline: true },
                                                        { name: `User/Banco`, value: `<@${carts.get(`${interaction.channel.id}.userid`)}>/\`${doc.data.point_of_interaction.transaction_data.bank_info.payer.long_name || "\`🔴 Não encontrado.\`"}\`` }
                                                    )
                                                    .setColor(`#FF0000`)
                                                    .setFooter({ text: `${interaction.user.displayName}`, iconURL: interaction.user.displayAvatarURL() })
                                                    .setTimestamp()
                                            ],
                                            components: [],
                                            files: []
                                        }).catch(error => { });

                                        if (dbC.get("channels.logsPriv")) {
                                            const channel = interaction.guild.channels.cache.get(dbC.get("channels.logsPriv"));

                                            channel.send({
                                                content: ``,
                                                embeds: [
                                                    new EmbedBuilder()
                                                        .setAuthor({ name: `${interaction.user.username} - Anti Fraude Detectada`, iconURL: interaction.user.displayAvatarURL() })
                                                        .setDescription(`-# \`❌\` Pendência cancelada por **Anti Fraude Detectada**.`)
                                                        .addFields(
                                                            { name: `Carrinho`, value: `\`x${parseInt(carrin.quantia)} | Membros Reais\``, inline: true },
                                                            { name: `Valor Total`, value: `\`R$ ${parseFloat((dbC.get("sales.unidade") || 0.03) * parseInt(carrin.quantia)).toFixed(2)}\``, inline: true },
                                                            { name: `User/Banco`, value: `<@${carts.get(`${interaction.channel.id}.userid`)}>/\`${doc.data.point_of_interaction.transaction_data.bank_info.payer.long_name || "\`🔴 Não encontrado.\`"}\`` }
                                                        )
                                                        .setColor(`#FF0000`)
                                                        .setFooter({ text: `${interaction.user.displayName}`, iconURL: interaction.user.displayAvatarURL() })
                                                        .setTimestamp()
                                                ],
                                                components: [
                                                    new ActionRowBuilder()
                                                        .addComponents(
                                                            new ButtonBuilder().setCustomId(`botN`).setLabel(`Notificação do Anti Fraude`).setStyle(2).setDisabled(true)
                                                        )
                                                ]
                                            }).catch(error => { });

                                        };

                                        const axios = require('axios');
                                        await axios.post(`https://api.mercadopago.com/v1/payments/${data?.id}/refunds`, {}, {
                                            headers: {
                                                'Authorization': `Bearer ${mp}`
                                            }
                                        }).catch(error => { });

                                        setTimeout(async () => {
                                            try {
                                                await carts.delete(interaction.channel.id);
                                                interaction.channel.delete();
                                            } catch { };
                                        }, 15000);

                                        return;

                                    };

                                    await carts.set(`${interaction.channel.id}.status`, "aprovado");

                                } else { };

                                const carrin = await carts.get(`${interaction.channel.id}`);

                                if (carrin.status === "aprovado") {
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
                                                    { name: `Banco`, value: `\`${doc.data.point_of_interaction.transaction_data.bank_info.payer.long_name || "\`🔴 Não encontrado.\`"}\`` }
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
                                                        { name: `Banco`, value: `\`${doc.data.point_of_interaction.transaction_data.bank_info.payer.long_name || "\`🔴 Não encontrado.\`"}\`` }
                                                    )
                                                    .setColor(`#00FF00`)
                                                    .setFooter({ text: `${interaction.user.displayName}`, iconURL: interaction.user.displayAvatarURL() })
                                                    .setTimestamp()
                                            ],
                                            components: [
                                                new ActionRowBuilder()
                                                    .addComponents(
                                                        new ButtonBuilder().setCustomId(`${doc.data.id}_reembolCart`).setLabel(`Realizar Reembolso`).setEmoji(`1246953228655132772`).setStyle(2).setDisabled(doc?.data.status !== "approved")
                                                    )
                                            ]
                                        }).catch(error => { });

                                    };

                                    clearTimeout(timer);

                                } else { };

                            }).catch(err => {});
                        }, 2000);

                    });

                });

        };

    }
}