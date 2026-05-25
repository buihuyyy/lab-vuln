const form = document.getElementById("login-form");
const errEl = document.getElementById("err");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  errEl.textContent = "";
  const data = Object.fromEntries(new FormData(form));
  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });
    const body = await res.json();
    if (!res.ok) {
      errEl.textContent = body.error || "Login failed";
      return;
    }
    window.location.href = "/dashboard.html";
  } catch (err) {
    errEl.textContent = "Network error";
  }
});
