const API_URL = import.meta.env.VITE_API_URL;

const form = document.getElementById("todo-form");
const input = document.getElementById("todo-input");
const todoList = document.getElementById("todo-list");
const message = document.getElementById("message");

// Récupérer et afficher les tâches
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

            // Case à cocher pour terminer une tâche
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.checked = todo.completed;
            checkbox.setAttribute("aria-label", "Marquer la tâche comme terminée");

            checkbox.addEventListener("change", async function () {
                try {
                    const response = await fetch(`${API_URL}/${todo.id}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            completed: checkbox.checked
                        })
                    });

                    if (!response.ok) {
                        throw new Error("Échec de la modification.");
                    }

                    message.textContent = "État de la tâche modifié.";
                    await afficherTaches();
                } catch (error) {
                    message.textContent = "Erreur lors de la modification.";
                    await afficherTaches();
                }
            });

            // Titre de la tâche
            const titre = document.createElement("span");
            titre.textContent = todo.title;
            titre.className = "task-title";

            if (todo.completed) {
                titre.style.textDecoration = "line-through";
                titre.style.color = "gray";
            }

            // Bouton Modifier
            const editButton = document.createElement("button");
            editButton.textContent = "Modifier";
            editButton.type = "button";
            editButton.className = "edit-button";

            editButton.addEventListener("click", function () {
                // Éviter de créer plusieurs champs de modification
                if (taskContent.querySelector(".edit-input")) {
                    return;
                }

                const editInput = document.createElement("input");
                editInput.type = "text";
                editInput.value = todo.title;
                editInput.className = "edit-input";
                editInput.maxLength = 255;
                editInput.setAttribute("aria-label", "Nouveau titre de la tâche");

                const saveButton = document.createElement("button");
                saveButton.textContent = "Enregistrer";
                saveButton.type = "button";
                saveButton.className = "save-button";

                const cancelButton = document.createElement("button");
                cancelButton.textContent = "Annuler";
                cancelButton.type = "button";
                cancelButton.className = "cancel-button";

                // Remplacer temporairement le titre par le champ de saisie
                titre.hidden = true;
                taskContent.appendChild(editInput);
                taskActions.replaceChildren(saveButton, cancelButton);

                editInput.focus();
                editInput.select();

                // Enregistrer le nouveau titre dans le backend
                async function enregistrerModification() {
                    const nouveauTitre = editInput.value.trim();

                    if (!nouveauTitre) {
                        message.textContent = "Le titre ne peut pas être vide.";
                        editInput.focus();
                        return;
                    }

                    if (nouveauTitre === todo.title) {
                        message.textContent = "Aucune modification effectuée.";
                        await afficherTaches();
                        return;
                    }

                    saveButton.disabled = true;
                    cancelButton.disabled = true;
                    message.textContent = "Enregistrement en cours...";

                    try {
                        const response = await fetch(`${API_URL}/${todo.id}`, {
                            method: "PUT",
                            headers: {
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({
                                title: nouveauTitre
                            })
                        });

                        const data = await response.json();

                        if (!response.ok) {
                            throw new Error(
                                data.error || "Impossible de modifier la tâche."
                            );
                        }

                        message.textContent = "Titre modifié avec succès !";
                        await afficherTaches();
                    } catch (error) {
                        message.textContent =
                            error.message || "Erreur lors de la modification.";
                        saveButton.disabled = false;
                        cancelButton.disabled = false;
                    }
                }

                saveButton.addEventListener(
                    "click",
                    enregistrerModification
                );

                // Entrée pour enregistrer, Échap pour annuler
                editInput.addEventListener("keydown", function (event) {
                    if (event.key === "Enter") {
                        enregistrerModification();
                    }

                    if (event.key === "Escape") {
                        afficherTaches();
                    }
                });

                cancelButton.addEventListener("click", function () {
                    afficherTaches();
                });
            });

            // Bouton Supprimer
            const deleteButton = document.createElement("button");
            deleteButton.textContent = "Supprimer";
            deleteButton.type = "button";
            deleteButton.className = "delete-button";

            deleteButton.addEventListener("click", async function () {
                try {
                    const response = await fetch(`${API_URL}/${todo.id}`, {
                        method: "DELETE"
                    });

                    if (!response.ok) {
                        throw new Error("Échec de la suppression.");
                    }

                    message.textContent = "Tâche supprimée.";
                    await afficherTaches();
                } catch (error) {
                    message.textContent = error.message ||
                        "Erreur lors de la suppression.";
                }
            });

            // Assembler les éléments
            taskContent.appendChild(checkbox);
            taskContent.appendChild(titre);

            taskActions.appendChild(editButton);
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

// Ajouter une tâche
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
