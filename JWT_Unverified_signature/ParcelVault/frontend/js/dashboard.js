async function init() {
  try {
    const meRes = await fetch("/api/me", { credentials: "include" });
    if (!meRes.ok) {
      window.location.href = "/login.html";
      return;
    }
    const me = await meRes.json();
    document.getElementById("who").textContent = `${me.username} (${me.role})`;

    const shRes = await fetch("/api/shipments", { credentials: "include" });
    const shBody = await shRes.json();
    const tbody = document.querySelector("#shipments tbody");
    (shBody.shipments || []).forEach((s) => {
      const tr = document.createElement("tr");
      ["tracking", "origin", "destination", "status", "updated_at"].forEach((k) => {
        const td = document.createElement("td");
        td.textContent = s[k];
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });

    if (location.pathname === "/staff/archive") {
      loadArchive();
    }
  } catch (e) {
    window.location.href = "/login.html";
  }
}

async function loadArchive() {
  const msg = document.getElementById("archive-msg");
  const out = document.getElementById("archive-data");
  msg.textContent = "Requesting archive...";
  const r = await fetch("/api/staff/archive", { credentials: "include" });
  if (r.status === 403) {
    msg.textContent = "Staff clearance required.";
    return;
  }
  if (!r.ok) {
    msg.textContent = "Could not load archive.";
    return;
  }
  const data = await r.json();
  msg.textContent = "";
  out.textContent = JSON.stringify(data, null, 2);
}

document.getElementById("logout").addEventListener("click", async (e) => {
  e.preventDefault();
  await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
  window.location.href = "/";
});

init();
