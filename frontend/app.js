
const API_URL = "http://localhost:3000/api/todos";

const form = document.getElementById("todo-form");
const input = document.getElementById("todo-input");
const todoList = document.getElementById("todo-list");
const message = document.getElementById("message");

// Récupérer les tâches depuis le backend
async function afficherTaches() {
    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error("Impossible de récupérer les tâches.");
        }

        const todos = await response.json();
        todoList.innerHTML = "";

        todos.forEach(function (todo) {
            const li = document.createElement("li");

            const taskContent = document.createElement("div");
            taskContent.className = "task-content";

            const taskActions = document.createElement("div");
            taskActions.className = "task-actions";

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.checked = todo.completed;

            checkbox.addEventListener("change", async function () {
                try {
                    const response = await fetch(`${API_URL}/${todo.id}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ completed: checkbox.checked })
                    });

                    if (!response.ok) {
                        throw new Error();
                    }

                    message.textContent = "État de la tâche modifié.";
                    await afficherTaches();
                } catch {
                    message.textContent = "Erreur lors de la modification.";
                    await afficherTaches();
                }
            });

            const titre = document.createElement("span");
            titre.textContent = todo.title;

            if (todo.completed) {
                titre.style.textDecoration = "line-through";
                titre.style.color = "gray";
            }

            const deleteButton = document.createElement("button");
            deleteButton.textContent = "Supprimer";

            deleteButton.addEventListener("click", async function () {
                try {
                    const response = await fetch(`${API_URL}/${todo.id}`, {
                        method: "DELETE"
                    });

                    if (!response.ok) {
                        throw new Error();
                    }

                    message.textContent = "Tâche supprimée.";
                    await afficherTaches();
                } catch {
                    message.textContent = "Erreur lors de la suppression.";
                }
            });

            taskContent.appendChild(checkbox);
            taskContent.appendChild(titre);
            taskActions.appendChild(deleteButton);

            li.appendChild(taskContent);
            li.appendChild(taskActions);
            todoList.appendChild(li);
        });
    } catch (error) {
        message.textContent =
            "Impossible de contacter le backend. Vérifie qu'il est lancé.";
    }
}

// Ajouter une tâche via l'API
form.addEventListener("submit", async function (event) {
    event.preventDefault();

    const title = input.value.trim();

    if (!title) {
        message.textContent = "Saisis le titre d'une tâche.";
        return;
    }

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Erreur lors de l'ajout.");
        }

        input.value = "";
        message.textContent = "Tâche ajoutée avec succès !";
        await afficherTaches();
    } catch (error) {
        message.textContent = error.message ||
            "Impossible de contacter le backend.";
    }
});

// Charger les tâches au démarrage
afficherTaches();
