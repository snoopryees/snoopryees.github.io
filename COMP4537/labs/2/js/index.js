// Build the landing page dynamically
document.addEventListener("DOMContentLoaded", () => {
  const app = document.getElementById("app");

  const title = document.createElement("h1");
  title.textContent = MESSAGES.PAGE_TITLE;
  app.appendChild(title);

  const studentName = document.createElement("p");
  studentName.textContent = MESSAGES.STUDENT_NAME;
  app.appendChild(studentName);

  const navDiv = document.createElement("div");
  navDiv.className = "nav-links";

  const writerLink = document.createElement("a");
  writerLink.href = "writer.html";
  writerLink.textContent = MESSAGES.GO_TO_WRITER;
  navDiv.appendChild(writerLink);

  const readerLink = document.createElement("a");
  readerLink.href = "reader.html";
  readerLink.textContent = MESSAGES.GO_TO_READER;
  navDiv.appendChild(readerLink);

  app.appendChild(navDiv);
});
