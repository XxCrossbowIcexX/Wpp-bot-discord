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
    if (message.content.toLowerCase().startsWith("!wpp")) {
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
            const grupo = grupos[message.guild.id].find(g => g.id == groupId);
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

function guardarGrupos() {
    fs.writeFileSync(gruposFile, JSON.stringify(grupos, null, 2));
}

// Comando para agregar un grupo (ordenado por ID) solo admins
client.on('messageCreate', async (message) => {
    if (!message.content.startsWith("!agregarGrupo ")) return;
    
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        return message.reply("❌ No tienes permisos para agregar grupos.");
    }

    const args = message.content.split(" ");
    const groupId = parseInt(args[1]);
    const link = args[2];

    if (!groupId || isNaN(groupId) || !link) {
        return message.reply("⚠️ Debes ingresar un número de grupo y un enlace de WhatsApp.");
    }

    if (!link.startsWith("https://chat.whatsapp.com/")) {
        return message.reply("⚠️ Debes ingresar un enlace válido de WhatsApp.");
    }

    if (!grupos[message.guild.id]) {
        grupos[message.guild.id] = [];
    }

    // Verificar si el grupo ya existe
    if (grupos[message.guild.id].some(g => g.id === groupId)) {
        return message.reply("⚠️ Este grupo ya está registrado.");
    }

    // Agregar el grupo y ordenar la lista
    grupos[message.guild.id].push({ id: groupId, link });
    grupos[message.guild.id].sort((a, b) => a.id - b.id); // Ordenar por ID

    guardarGrupos(); // Guardar cambios

    message.reply(`✅ Grupo ${groupId} agregado correctamente.`);
});

// Comando para eliminar un grupo
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

    if (!grupos[message.guild.id] || grupos[message.guild.id].length === 0) {
        return message.reply("⚠️ No hay grupos registrados.");
    }

    // Filtrar y eliminar el grupo
    const grupoEliminado = grupos[message.guild.id].some(g => g.id === groupId);
    grupos[message.guild.id] = grupos[message.guild.id].filter(g => g.id !== groupId);

    if (!grupoEliminado) {
        return message.reply(`⚠️ No se encontró un grupo con el ID ${groupId}.`);
    }

    guardarGrupos(); // Guardar cambios

    message.reply(`✅ Grupo ${groupId} eliminado correctamente.`);
});

// Comando para editar el link de un grupo
client.on('messageCreate', async (message) => {
    if (!message.content.startsWith("!editarGrupo ")) return;

    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        return message.reply("❌ No tienes permisos para editar grupos.");
    }

    const args = message.content.split(" ");
    const groupId = parseInt(args[1]);
    const newLink = args[2];

    if (!groupId || isNaN(groupId) || !newLink) {
        return message.reply("⚠️ Debes ingresar un número de grupo y un nuevo enlace de WhatsApp.");
    }

    if (!newLink.startsWith("https://chat.whatsapp.com/")) {
        return message.reply("⚠️ Debes ingresar un enlace válido de WhatsApp.");
    }

    if (!grupos[message.guild.id] || grupos[message.guild.id].length === 0) {
        return message.reply("⚠️ No hay grupos registrados.");
    }

    const grupo = grupos[message.guild.id].find(g => g.id === groupId);
    if (!grupo) {
        return message.reply(`⚠️ No se encontró un grupo con el ID ${groupId}.`);
    }

    // Editar el enlace del grupo
    grupo.link = newLink;
    guardarGrupos(); // Guardar cambios

    message.reply(`✅ Grupo ${groupId} actualizado correctamente.`);
});

// Iniciar el bot con el token del archivo .env
client.login(process.env.TOKEN);
