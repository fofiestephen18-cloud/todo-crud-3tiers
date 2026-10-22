
const express = require("express");
const path = require("path");

const app = express();
const PORT = 3000;

// Autoriser le serveur à lire les données JSON
app.use(express.json());

// Servir les fichiers du frontend
app.use(express.static(path.join(__dirname, "frontend")));

// Stockage temporaire des tâches
let todos = [];
let nextId = 1;

// GET : récupérer toutes les tâches
app.get("/api/todos", (req, res) => {
    res.json(todos);
});

// POST : ajouter une tâche
app.post("/api/todos", (req, res) => {
    const { title } = req.body;

    if (!title || !title.trim()) {
        return res.status(400).json({
            error: "Le titre de la tâche est obligatoire."
        });
    }

    const todo = {
        id: nextId++,
        title: title.trim(),
        completed: false
    };

    todos.push(todo);

    res.status(201).json(todo);
});

// PUT : modifier une tâche
app.put("/api/todos/:id", (req, res) => {
    const id = Number(req.params.id);
    const todo = todos.find((item) => item.id === id);

    if (!todo) {
        return res.status(404).json({
            error: "Tâche introuvable."
        });
    }

    const { title, completed } = req.body;

    if (title !== undefined) {
        if (typeof title !== "string" || !title.trim()) {
            return res.status(400).json({
                error: "Le titre ne peut pas être vide."
            });
        }

        todo.title = title.trim();
    }

    if (completed !== undefined) {
        if (typeof completed !== "boolean") {
            return res.status(400).json({
                error: "completed doit être un booléen."
            });
        }

        todo.completed = completed;
    }

    res.json(todo);
});

// DELETE : supprimer une tâche
app.delete("/api/todos/:id", (req, res) => {
    const id = Number(req.params.id);
    const index = todos.findIndex((item) => item.id === id);

    if (index === -1) {
        return res.status(404).json({
            error: "Tâche introuvable."
        });
    }

    todos.splice(index, 1);

    res.json({
        message: "Tâche supprimée avec succès."
    });
});

// Démarrer le serveur
app.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
});
