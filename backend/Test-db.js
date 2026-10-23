
const pool = require("./db");

async function testerConnexion() {
    try {
        const result = await pool.query(
            "SELECT current_database() AS database"
        );

        console.log("Connexion réussie !");
        console.log("Base :", result.rows[0].database);
    } catch (error) {
        console.error("Erreur complète :", error);
        console.error("Code :", error.code);
        console.error("Message :", error.message);
    } finally {
        await pool.end();
    }
}

testerConnexion();
