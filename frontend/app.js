
console.log("Le fichier app.js est chargé !");

const form = document.getElementById("todo-form");
const input = document.getElementById("todo-input");
const todoList = document.getElementById("todo-list");
const message = document.getElementById("message");

const todos = [];

// Ajouter une tâche
form.addEventListener("submit", function (event) {
    event.preventDefault();

    const title = input.value.trim();

    if (title === "") {
        message.textContent = "Saisis le titre d'une tâche.";
        return;
    }

    const todo = {
        id: Date.now(),
        title: title,
        completed: false
    };

    todos.push(todo);
    afficherTaches();

    input.value = "";
    message.textContent = "Tâche ajoutée avec succès !";
});

// Afficher toutes les tâches
function afficherTaches() {
    todoList.innerHTML = "";

    todos.forEach(function (todo) {
        const li = document.createElement("li");

        // Case à cocher
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = todo.completed;

        checkbox.addEventListener("change", function () {
            todo.completed = checkbox.checked;
            afficherTaches();
        });

        // Titre de la tâche
        const titre = document.createElement("span");
        titre.textContent = todo.title;

        if (todo.completed) {
            titre.style.textDecoration = "line-through";
            titre.style.color = "gray";
        }

        // Bouton supprimer
        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Supprimer";

        deleteButton.addEventListener("click", function () {
            const index = todos.findIndex(function (item) {
                return item.id === todo.id;
            });

            if (index !== -1) {
                todos.splice(index, 1);
            }

            afficherTaches();
            message.textContent = "Tâche supprimée.";
        });

       const taskContent = document.createElement("div");
taskContent.className = "task-content";

const taskActions = document.createElement("div");
taskActions.className = "task-actions";

taskContent.appendChild(checkbox);
taskContent.appendChild(titre);
taskActions.appendChild(deleteButton);

li.appendChild(taskContent);
li.appendChild(taskActions);

todoList.appendChild(li);
    });
}
