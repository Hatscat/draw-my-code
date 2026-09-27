const app = document.querySelector("#app");
if (app) {
  const title = document.createElement("h1");
  title.textContent = "Draw my code";
  app.replaceChildren(title);
}
