const mongoose = require("mongoose");

const GrupoSchema = new mongoose.Schema({
    guildId: String,  // ID del servidor de Discord
    id: Number,       // ID del grupo de WhatsApp
    link: String      // Enlace del grupo de WhatsApp
});

module.exports = mongoose.model("Grupo", GrupoSchema);
