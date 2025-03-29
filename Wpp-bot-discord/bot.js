require('dotenv').config();
const fs = require('fs');
const { Client, GatewayIntentBits, Partials, EmbedBuilder, PermissionsBitField } = require('discord.js');

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent
    ],
    partials: [Partials.Channel]
});

const gruposFile = 'grupos.json';

// Cargar grupos desde el archivo JSON o crear uno vacío
let grupos = {};
if (fs.existsSync(gruposFile)) {
    grupos = JSON.parse(fs.readFileSync(gruposFile, 'utf-8'));
}

// Evento cuando el bot está listo
client.once('ready', () => {
    console.log(`✅ Bot conectado como ${client.user.tag}`);
});

// Comando para mostrar los grupos guardados
client.on('messageCreate', async (message) => {
    if (message.content.startsWith("!wpp")) {
        const args = message.content.split(" ");
        const groupId = args[1]; // El groupId se pasa como segundo parámetro

        // Verificar si hay grupos registrados
        if (!grupos[message.guild.id] || grupos[message.guild.id].length === 0) {
            return message.channel.send("⚠️ No hay grupos registrados.");
        }

        const embed = new EmbedBuilder()
            .setTitle("Grupos de WhatsApp JAP 2025")
            .setDescription("Haz clic en los enlaces para unirte a los grupos de WhatsApp.")
            .setColor(0x25D366);

        // Si se pasa un groupId, buscar ese grupo específico
        if (groupId) {
            const grupo = grupos[message.guild.id].find(g => g.id === groupId);
            if (grupo) {
                // Mostrar solo el grupo encontrado
                embed.addFields({ name: `[Grupo - ${grupo.id}]`, value: `[Únete aquí](${grupo.link})`, inline: false });
                embed.setFooter({ text: "Elige el grupo al que deseas unirte" });
                return message.channel.send({ embeds: [embed] });
            } else {
                // Si no se encuentra el grupo, mostrar todos los grupos
                embed.setDescription(`⚠️ No se encontró un grupo con el ID ${groupId}. Aquí están todos los grupos disponibles:`);
            }
        }

        // Mostrar todos los grupos
        grupos[message.guild.id].forEach((grupo) => {
            embed.addFields({ name: `[Grupo - ${grupo.id}]`, value: `[Únete aquí](${grupo.link})`, inline: false });
        });

        embed.setFooter({ text: "Elige el grupo al que deseas unirte" });

        message.channel.send({ embeds: [embed] });
    }
});



// Comando para agregar un grupo (solo admins)
client.on('messageCreate', async (message) => {
    if (!message.content.startsWith("!addgrupo ")) return;

    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        return message.reply("❌ No tienes permisos para agregar grupos.");
    }

    const args = message.content.split(" ");
    const groupId = args[1];
    const link = args[2];

    if (!groupId || !link) {
        return message.reply("⚠️ Debes ingresar un identificador de grupo y un enlace de WhatsApp.");
    }

    if (!link.startsWith("https://chat.whatsapp.com/")) {
        return message.reply("⚠️ Debes ingresar un enlace válido de WhatsApp.");
    }

    if (!grupos[message.guild.id]) {
        grupos[message.guild.id] = [];
    }

    // Guardar el grupo con el formato "Grupo - <ID>"
    grupos[message.guild.id].push({ id: groupId, link });

    // Guardar los grupos en el archivo JSON
    fs.writeFileSync(gruposFile, JSON.stringify(grupos, null, 2));

    message.reply(`✅ Grupo ${groupId} agregado correctamente.`);
});

// Iniciar el bot con el token del archivo .env
client.login(process.env.TOKEN);
