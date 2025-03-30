require('dotenv').config();
const mongoose = require("mongoose");
const { Client, GatewayIntentBits, Partials, EmbedBuilder, PermissionsBitField } = require('discord.js');
const Grupo = require("./models/Grupos"); 


mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent
    ],
    partials: [Partials.Channel]
});

// 📌 Comando para mostrar los grupos guardados en MongoDB
client.on('messageCreate', async (message) => {
    if (message.content.toLowerCase().startsWith("!wpp")) {
        const args = message.content.split(" ");
        const groupId = args[1]; // ID opcional del grupo

        // Buscar grupos en la base de datos
        const grupos = await Grupo.find({ guildId: message.guild.id });

        if (grupos.length === 0) {
            return message.channel.send("⚠️ No hay grupos registrados.");
        }

        const embed = new EmbedBuilder()
            .setTitle("Grupos de WhatsApp JAP 2025")
            .setDescription("Haz clic en los enlaces para unirte a los grupos de WhatsApp.")
            .setColor(0x25D366);

        // Si el usuario especificó un ID, mostrar solo ese grupo
        if (groupId) {
            const grupo = grupos.find(g => g.id == groupId);
            if (grupo) {
                embed.addFields({ name: `[Grupo - ${grupo.id}]`, value: `[Únete aquí](${grupo.link})`, inline: false });
                embed.setFooter({ text: "Elige el grupo al que deseas unirte" });
                return message.channel.send({ embeds: [embed] });
            } else {
                embed.setDescription(`⚠️ No se encontró un grupo con el ID ${groupId}. Aquí están todos los grupos disponibles:`);
            }
        }

        // Mostrar todos los grupos
        grupos.forEach((grupo) => {
            embed.addFields({ name: `[Grupo - ${grupo.id}]`, value: `[Únete aquí](${grupo.link})`, inline: false });
        });

        embed.setFooter({ text: "Elige el grupo al que deseas unirte" });

        message.channel.send({ embeds: [embed] });
    }
});

// 📌 Comando para agregar un grupo
client.on('messageCreate', async (message) => {
    if (!message.content.startsWith("!agregarGrupo ")) return;
    
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        return message.reply("❌ No tienes permisos para agregar grupos.");
    }

    const args = message.content.split(" ");
    const groupId = parseInt(args[1]);
    const link = args[2];

    if (!groupId || isNaN(groupId) || !link || !link.startsWith("https://chat.whatsapp.com/")) {
        return message.reply("⚠️ Debes ingresar un número de grupo válido y un enlace de WhatsApp.");
    }

    // Verificar si el grupo ya existe en MongoDB
    const grupoExistente = await Grupo.findOne({ guildId: message.guild.id, id: groupId });

    if (grupoExistente) {
        return message.reply("⚠️ Este grupo ya está registrado.");
    }

    // Guardar en la base de datos
    await Grupo.create({ guildId: message.guild.id, id: groupId, link });

    message.reply(`✅ Grupo ${groupId} agregado correctamente.`);
});

// 📌 Comando para eliminar un grupo
client.on('messageCreate', async (message) => {
    if (!message.content.startsWith("!eliminarGrupo ")) return;

    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        return message.reply("❌ No tienes permisos para eliminar grupos.");
    }

    const args = message.content.split(" ");
    const groupId = parseInt(args[1]);

    if (!groupId || isNaN(groupId)) {
        return message.reply("⚠️ Debes ingresar un número de grupo válido.");
    }

    // Eliminar el grupo de la base de datos
    const resultado = await Grupo.findOneAndDelete({ guildId: message.guild.id, id: groupId });

    if (!resultado) {
        return message.reply(`⚠️ No se encontró un grupo con el ID ${groupId}.`);
    }

    message.reply(`✅ Grupo ${groupId} eliminado correctamente.`);
});

// 📌 Comando para editar el link de un grupo
client.on('messageCreate', async (message) => {
    if (!message.content.startsWith("!editarGrupo ")) return;

    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        return message.reply("❌ No tienes permisos para editar grupos.");
    }

    const args = message.content.split(" ");
    const groupId = parseInt(args[1]);
    const newLink = args[2];

    if (!groupId || isNaN(groupId) || !newLink || !newLink.startsWith("https://chat.whatsapp.com/")) {
        return message.reply("⚠️ Debes ingresar un número de grupo válido y un nuevo enlace de WhatsApp.");
    }

    // Buscar y actualizar el grupo en la base de datos
    const grupoActualizado = await Grupo.findOneAndUpdate(
        { guildId: message.guild.id, id: groupId },
        { link: newLink },
        { new: true }
    );

    if (!grupoActualizado) {
        return message.reply(`⚠️ No se encontró un grupo con el ID ${groupId}.`);
    }

    message.reply(`✅ Grupo ${groupId} actualizado correctamente.`);
});

// Iniciar el bot con el token del archivo .env
client.login(process.env.TOKEN);