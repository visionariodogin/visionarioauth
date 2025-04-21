const { Client, GatewayIntentBits, Collection, Partials } = require("discord.js");
const { port } = require("./config.json");
const { dbP } = require("./databases/index");
const express = require("express");
const app = express();

const client = new Client({
  intents: Object.keys(GatewayIntentBits),
  partials: Object.keys(Partials)
});

module.exports = client;
client.slashCommands = new Collection();
const { token } = require("./config.json");
client.login(token);

client.on('ready', async (client) => {
  try {
    await dbP.set("autoSet.clientid", client.user.id);
  } catch (err) {
    console.log(`Erro ao atualizar sua database (dbP | dbPrincipios.json) - "autoSet.clientid"\n\n${err}`)
  };

  setInterval(async () => {
    await dbP.set("autoSet.clientid", client.user.id);
  }, 60 * 60 * 1000);
});

const evento = require("./handler/Events");
evento.run(client);
require("./handler/index")(client);

process.on('unhandRejection', (reason, promise) => {
  console.log(`🚫 Erro Detectado:\n\n` + reason, promise);
});

process.on('uncaughtException', (error, origin) => {
  console.log(`🚫 Erro Detectado:\n\n` + error, origin);
});

const login = require("./routes/login");
app.use("/", login);

const callback = require("./routes/callback");
app.use("/", callback);

try {
  app.listen({
    host: "0.0.0.0",
    port: process.env.PORT ? Number(process.env.PORT) : 8080
  });
} finally { };