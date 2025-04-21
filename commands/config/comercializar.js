const { ApplicationCommandType, ApplicationCommandOptionType, EmbedBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder } = require("discord.js");
const { owner } = require("../../config.json");

module.exports = {
    name: "comercializar",
    description: "[💸] Envie mensagem de comercialização de membros.",
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: "mensagem",
            description: "Content do comércio",
            type: ApplicationCommandOptionType.String,
            required: false
        },
        {
            name: "titulo",
            description: "Título do comércio",
            type: ApplicationCommandOptionType.String,
            required: false
        },
        {
            name: "descrição",
            description: "Descrição do comércio",
            type: ApplicationCommandOptionType.String,
            required: false
        },
        {
            name: "color",
            description: "Cor para o comércio (hexadecimal)",
            type: ApplicationCommandOptionType.String,
            required: false
        },
        {
            name: "imagem",
            description: "Imagem para o comércio (URL)",
            type: ApplicationCommandOptionType.String,
            required: false
        },
        {
            name: "rodape",
            description: "Rodapé do comércio",
            type: ApplicationCommandOptionType.String,
            required: false
        }
    ],
    run: async (client, interaction) => {

        if (owner !== interaction.user.id) {
            return interaction.reply({ content: `\`❌\` Faltam permissões.`, ephemeral: true });
        };

        const msg = interaction.options.getString("mensagem");
        const title = interaction.options.getString("titulo");
        const description = interaction.options.getString("descrição");
        const color = interaction.options.getString("color");
        const image = interaction.options.getString("imagem");
        const footer = interaction.options.getString("footer");

        if (image && !link(image)) {
            return interaction.reply({ content: "\`❌\` URL de imagem está inválida!", ephemeral: true });
        };

        if (color && !isValidHexColor(color)) {
            return interaction.reply({ content: "\`❌\` Isso não é uma cor hexadecimal válida!", ephemeral: true });
        };

        const embed = new EmbedBuilder();

        if (title) {
            embed.setTitle(title);
        };

        if (description) {
            embed.setDescription(description);
        };

        if (color) {
            embed.setColor(color);
        };

        if (image) {
            embed.setImage(image);
        };

        if (footer) {
            embed.setFooter({ text: footer });
        };

        interaction.channel.send({
            content: msg || "",
            embeds: [embed],
            components: [
                new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder().setCustomId(`buyMembers`).setLabel(`Comprar`).setEmoji(`1302021432259117076`).setStyle(3)
                    )
            ]
        }).then(msg => {
            interaction.reply({ content: `\`🟢\` Comercialização enviada com êxito.`, ephemeral: true });
        }).catch(err => {
            interaction.channel.send({
                content: msg || "",
                components: [
                    new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder().setCustomId(`buyMembers`).setLabel(`Comprar`).setEmoji(`1302021432259117076`).setStyle(3)
                        )
                ]
            }).then(msg => {
                interaction.reply({ content: `\`🟢\` Comercialização enviada com êxito.`, ephemeral: true });
            }).catch(err => {
                interaction.reply({ content: `\`❌\` Ocorreu um erro ao tentar enviar comercialização.`, ephemeral: true });
            });
        });

        function link(n) {
            const urlRegex = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/;
            return urlRegex.test(n);
        };

        function isValidHexColor(color) {
            return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
        };

    }
}