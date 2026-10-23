
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");
const pool = require("./db");

const app = express();

app.use(cors());
app.use(express.json());

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
    apis: [require("path").join(__dirname, "app.js")]
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get("/", (req, res) => {
    res.json({ message: "Bienvenue sur l'API Todo CRUD !" });
});

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
        res.json(result.rows);
    } catch (error) {
        console.error("Erreur GET todos :", error.message);
        res.status(500).json({ error: "Impossible de récupérer les tâches." });
    }
});

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
        return res.status(400).json({
            error: "Le titre de la tâche est obligatoire."
        });
    }

    try {
        const result = await pool.query(
            "INSERT INTO todos (title) VALUES ($1) RETURNING id, title, completed",
            [title.trim()]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error("Erreur POST todos :", error.message);
        res.status(500).json({ error: "Impossible de créer la tâche." });
    }
});

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
        return res.status(400).json({ error: "Identifiant invalide." });
    }

    if (title === undefined && completed === undefined) {
        return res.status(400).json({
            error: "Fournis un titre ou un état à modifier."
        });
    }

    if (title !== undefined &&
        (typeof title !== "string" || !title.trim())) {
        return res.status(400).json({
            error: "Le titre ne peut pas être vide."
        });
    }

    if (completed !== undefined && typeof completed !== "boolean") {
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
            return res.status(404).json({ error: "Tâche introuvable." });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error("Erreur PUT todos :", error.message);
        res.status(500).json({ error: "Impossible de modifier la tâche." });
    }
});

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
        return res.status(400).json({ error: "Identifiant invalide." });
    }

    try {
        const result = await pool.query(
            "DELETE FROM todos WHERE id = $1 RETURNING id",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Tâche introuvable." });
        }

        res.json({ message: "Tâche supprimée avec succès." });
    } catch (error) {
        console.error("Erreur DELETE todos :", error.message);
        res.status(500).json({ error: "Impossible de supprimer la tâche." });
    }
});

module.exports = app;
