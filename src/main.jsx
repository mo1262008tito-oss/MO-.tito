import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./Global.css"; // تأكد من أن الملف موجود مباشرة في مجلد src

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);