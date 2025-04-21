const { ApplicationCommandType } = require("discord.js")
const { carts } = require("../../databases/index");
const { owner } = require("../../config.json");

module.exports = {
    name: "aprovar",
    description: "✅ Aprove alguma compra de aluguel.",
    type: ApplicationCommandType.ChatInput,
    run: async (client, interaction) => {

        if (owner !== interaction.user.id) {
            return interaction.reply({ content: `\`❌\` Faltam permissões.`, ephemeral: true });
        };

        const asd = await carts.get(`${interaction.channel.id}`);
        if (!asd) {
            return interaction.reply({ content: "\`❌\` Não achei este carrinho!", ephemeral: true });
        };

        await carts.set(`${interaction.channel.id}.status`, "aprovado");

        interaction.reply({
            content: "\`✅\` Carrinho aprovado com êxito.",
            ephemeral: true
        });

    }
}