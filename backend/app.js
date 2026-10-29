
require("dotenv").config();
// new commentaire
const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");
const path = require("path");
const pool = require("./db");

const app = express();

// ========================================
// 1. FONCTIONS DE JOURNALISATION
// ========================================

function log(message) {
    console.log(`[INFO] [${new Date().toISOString()}] ${message}`);
}

function logError(message, error) {
    console.error(`[ERROR] [${new Date().toISOString()}] ${message}`);

    if (error) {
        console.error(error.stack || error);
    }
}

// ========================================
// 2. MIDDLEWARES
// ========================================

// Journaliser toutes les requêtes HTTP
app.use((req, res, next) => {
    const debut = Date.now();

    log(`--> ${req.method} ${req.originalUrl}`);

    res.on("finish", () => {
        const duree = Date.now() - debut;

        log(
            `<-- ${req.method} ${req.originalUrl} | ` +
            `Statut: ${res.statusCode} | ${duree} ms`
        );
    });

    next();
});

app.use(cors());
app.use(express.json());

// ========================================
// 3. CONFIGURATION SWAGGER
// ========================================

const swaggerOptions = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Todo CRUD API",
            version: "1.0.0",
            description: "API de gestion des tâches avec PostgreSQL"
        },
        servers: [
            { url: "http://localhost:3000" }
        ]
    },
    apis: [path.join(__dirname, "app.js")]
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec)
);

// ========================================
// 4. ROUTE D'ACCUEIL
// ========================================

app.get("/", (req, res) => {
    res.json({
        message: "Bienvenue sur l'API Todo CRUD !"
    });
});

// ========================================
// 5. GET : RÉCUPÉRER LES TÂCHES
// ========================================

/**
 * @swagger
 * /api/todos:
 *   get:
 *     summary: Récupérer toutes les tâches
 *     tags: [Todos]
 *     responses:
 *       200:
 *         description: Liste des tâches
 */
app.get("/api/todos", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT id, title, completed FROM todos ORDER BY id ASC"
        );

        log(`PostgreSQL : ${result.rowCount} tâche(s) récupérée(s)`);

        res.json(result.rows);
    } catch (error) {
        logError("Erreur GET /api/todos", error);

        res.status(500).json({
            error: "Impossible de récupérer les tâches."
        });
    }
});

// ========================================
// 6. POST : CRÉER UNE TÂCHE
// ========================================

/**
 * @swagger
 * /api/todos:
 *   post:
 *     summary: Créer une tâche
 *     tags: [Todos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title:
 *                 type: string
 *                 example: Apprendre Express
 *     responses:
 *       201:
 *         description: Tâche créée
 *       400:
 *         description: Titre invalide
 */
app.post("/api/todos", async (req, res) => {
    const { title } = req.body;

    if (typeof title !== "string" || !title.trim()) {
        log("POST /api/todos : titre invalide");

        return res.status(400).json({
            error: "Le titre de la tâche est obligatoire."
        });
    }

    try {
        const result = await pool.query(
            `INSERT INTO todos (title)
             VALUES ($1)
             RETURNING id, title, completed`,
            [title.trim()]
        );

        log(`Tâche créée : id=${result.rows[0].id}`);

        res.status(201).json(result.rows[0]);
    } catch (error) {
        logError("Erreur POST /api/todos", error);

        res.status(500).json({
            error: "Impossible de créer la tâche."
        });
    }
});

// ========================================
// 7. PUT : MODIFIER UNE TÂCHE
// ========================================

/**
 * @swagger
 * /api/todos/{id}:
 *   put:
 *     summary: Modifier le titre ou l'état d'une tâche
 *     tags: [Todos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               completed:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Tâche modifiée
 *       400:
 *         description: Données invalides
 *       404:
 *         description: Tâche introuvable
 */
app.put("/api/todos/:id", async (req, res) => {
    const id = Number(req.params.id);
    const { title, completed } = req.body;

    if (!Number.isInteger(id) || id <= 0) {
        log(`PUT /api/todos/${req.params.id} : identifiant invalide`);

        return res.status(400).json({
            error: "Identifiant invalide."
        });
    }

    if (title === undefined && completed === undefined) {
        log(`PUT /api/todos/${id} : aucune donnée à modifier`);

        return res.status(400).json({
            error: "Fournis un titre ou un état à modifier."
        });
    }

    if (
        title !== undefined &&
        (typeof title !== "string" || !title.trim())
    ) {
        log(`PUT /api/todos/${id} : titre invalide`);

        return res.status(400).json({
            error: "Le titre ne peut pas être vide."
        });
    }

    if (completed !== undefined && typeof completed !== "boolean") {
        log(`PUT /api/todos/${id} : état completed invalide`);

        return res.status(400).json({
            error: "completed doit être un booléen."
        });
    }

    try {
        const result = await pool.query(
            `UPDATE todos
             SET title = COALESCE($1, title),
                 completed = COALESCE($2, completed)
             WHERE id = $3
             RETURNING id, title, completed`,
            [
                title === undefined ? null : title.trim(),
                completed === undefined ? null : completed,
                id
            ]
        );

        if (result.rows.length === 0) {
            log(`PUT /api/todos/${id} : tâche introuvable`);

            return res.status(404).json({
                error: "Tâche introuvable."
            });
        }

        log(`Tâche modifiée : id=${id}`);

        res.json(result.rows[0]);
    } catch (error) {
        logError(`Erreur PUT /api/todos/${id}`, error);

        res.status(500).json({
            error: "Impossible de modifier la tâche."
        });
    }
});

// ========================================
// 8. DELETE : SUPPRIMER UNE TÂCHE
// ========================================

/**
 * @swagger
 * /api/todos/{id}:
 *   delete:
 *     summary: Supprimer une tâche
 *     tags: [Todos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Tâche supprimée
 *       404:
 *         description: Tâche introuvable
 */
app.delete("/api/todos/:id", async (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        log(`DELETE /api/todos/${req.params.id} : identifiant invalide`);

        return res.status(400).json({
            error: "Identifiant invalide."
        });
    }

    try {
        const result = await pool.query(
            "DELETE FROM todos WHERE id = $1 RETURNING id",
            [id]
        );

        if (result.rows.length === 0) {
            log(`DELETE /api/todos/${id} : tâche introuvable`);

            return res.status(404).json({
                error: "Tâche introuvable."
            });
        }

        log(`Tâche supprimée : id=${id}`);

        res.json({
            message: "Tâche supprimée avec succès."
        });
    } catch (error) {
        logError(`Erreur DELETE /api/todos/${id}`, error);

        res.status(500).json({
            error: "Impossible de supprimer la tâche."
        });
    }
});

// ========================================
// 9. ROUTE INCONNUE
// ========================================

app.use((req, res) => {
    log(`Route introuvable : ${req.method} ${req.originalUrl}`);

    res.status(404).json({
        error: "Route introuvable."
    });
});

// ========================================
// 10. EXPORTER L'APPLICATION
// ========================================

module.exports = app;
