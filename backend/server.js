
const app = require("./app");

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Backend démarré sur http://localhost:${PORT}`);
    console.log(`Documentation Swagger : http://localhost:${PORT}/api-docs`);
});
