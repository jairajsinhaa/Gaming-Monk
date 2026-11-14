// Set this to the deployed API origin before publishing.
const API_BASE = window.GAMING_MONK_API || (window.location.protocol === "file:" ? "http://localhost:4000" : window.location.origin);
let authMode = "login";
let authToken = null;
const authScreen = document.getElementById("authScreen");
const appShell = document.getElementById("appShell");
const authMessage = document.getElementById("authMessage");
document.querySelectorAll("[data-auth-tab]").forEach(tab => tab.addEventListener("click", () => {
  authMode = tab.dataset.authTab;
  document.querySelectorAll("[data-auth-tab]").forEach(x => x.classList.toggle("active", x === tab));
  document.getElementById("authSubmit").textContent = authMode === "login" ? "Login" : "Create account";
  document.getElementById("authPassword").autocomplete = authMode === "login" ? "current-password" : "new-password";
  authMessage.textContent = "";
}));
async function enterApp(user, token) {
  authToken = token;
  authScreen.hidden = true;
  appShell.hidden = false;
  document.getElementById("headerEmail").textContent = user.email;
  document.getElementById("headerRole").textContent = user.role + " ACCOUNT";
  await loadPlayerProfile();
}
document.getElementById("authForm").addEventListener("submit", async event => {
  event.preventDefault();
  const button = document.getElementById("authSubmit");
  button.disabled = true; authMessage.textContent = "Please wait…";
  try {
    const response = await fetch(API_BASE + "/api/auth/" + authMode, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: document.getElementById("authEmail").value, password: document.getElementById("authPassword").value })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Unable to sign in");
    await enterApp(data.user, data.token);
    document.getElementById("authPassword").value = "";
  } catch (error) {
    authMessage.textContent = error.message.includes("Failed to fetch")
      ? "API connection failed. Start the Gaming Monk server and check API address."
      : error.message;
  } finally { button.disabled = false; }
});
document.getElementById("logoutBtn").addEventListener("click", () => {
  authToken = null; appShell.hidden = true; authScreen.hidden = false;
  document.getElementById("authPassword").value = "";
  authMessage.textContent = "You have logged out.";
});
const tournaments=[{name:"BGMI Squad Showdown",mode:"SQUAD",fee:50,prize:5000,teams:100,map:"Erangel"},{name:"Solo Survival Cup",mode:"SOLO",fee:20,prize:1000,teams:50,map:"Miramar"},{name:"Duo Battle Arena",mode:"DUO",fee:30,prize:2000,teams:64,map:"Erangel"}];let balance=0;
const card=t=>`<article class="tour-card"><div class="tour-banner"><b>BGMI<br>CHAMPIONSHIP</b><span>${t.mode}</span></div><div class="tour-body"><h3>${t.name}</h3><div class="tour-meta"><div>PRIZE POOL<b>₹${t.prize.toLocaleString("en-IN")}</b></div><div>ENTRY FEE<b>₹${t.fee}</b></div><div>MAX TEAMS<b>${t.teams}</b></div><div>MAP<b>${t.map}</b></div></div><div class="tour-bottom"><small>Demo tournament</small><button class="join-btn" data-name="${t.name}">Join tournament</button></div></div></article>`;
document.getElementById("featured").innerHTML=tournaments.map(card).join("");document.getElementById("allTournaments").innerHTML=tournaments.map(card).join("");
const toast=m=>{const el=document.getElementById("toast");el.textContent=m;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),2400)};
function go(page){document.querySelectorAll(".page").forEach(p=>p.classList.toggle("active",p.id===page));document.querySelectorAll(".nav").forEach(n=>n.classList.toggle("active",n.dataset.page===page));const titles={home:"Dashboard",tournaments:"Tournaments",matches:"My Matches",wallet:"My Wallet",profile:"My Profile"};document.getElementById("pageTitle").textContent=titles[page]||"Dashboard";document.querySelector(".sidebar").classList.remove("open");window.scrollTo(0,0)}
document.addEventListener("click",e=>{const n=e.target.closest("[data-page]");if(n)go(n.dataset.page);const g=e.target.closest("[data-go]");if(g)go(g.dataset.go);const j=e.target.closest(".join-btn");if(j)toast("Demo only: tournament joining will be enabled after backend setup.");});
document.getElementById("menuBtn").onclick=()=>document.querySelector(".sidebar").classList.toggle("open");
document.getElementById("addDemo").onclick=()=>{balance+=100;document.getElementById("walletBalance").textContent="₹"+balance;document.getElementById("balanceStat").textContent="₹"+balance;toast("₹100 demo credit added.");};
async function loadPlayerProfile() {
  if (!authToken) return;
  try {
    const response = await fetch(API_BASE + "/api/player/me", { headers: { Authorization: "Bearer " + authToken } });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Could not load profile");
    const user = data.user;
    document.getElementById("bgmiName").value = user.bgmiName || "";
    document.getElementById("bgmiId").value = user.bgmiId || "";
    document.getElementById("profileName").textContent = user.bgmiName || user.email;
    document.getElementById("profileBgmiId").textContent = "BGMI ID: " + (user.bgmiId || "Not added");
    document.getElementById("profileMsg").textContent = "Profile loaded from Gaming Monk server.";
  } catch (error) {
    document.getElementById("profileMsg").textContent = error.message;
  }
}
document.getElementById("saveProfile").onclick = async () => {
  if (!authToken) return toast("Please log in first.");
  const button = document.getElementById("saveProfile");
  button.disabled = true;
  try {
    const response = await fetch(API_BASE + "/api/player/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + authToken },
      body: JSON.stringify({
        bgmiName: document.getElementById("bgmiName").value.trim() || null,
        bgmiId: document.getElementById("bgmiId").value.trim() || null
      })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Profile could not be saved");
    document.getElementById("profileName").textContent = data.user.bgmiName || data.user.email;
    document.getElementById("profileBgmiId").textContent = "BGMI ID: " + (data.user.bgmiId || "Not added");
    document.getElementById("profileMsg").textContent = "Profile saved to database.";
    toast("Profile saved.");
  } catch (error) {
    document.getElementById("profileMsg").textContent = error.message;
    toast("Profile save failed.");
  } finally { button.disabled = false; }
};
document.querySelectorAll(".filter").forEach(b=>b.onclick=()=>{document.querySelectorAll(".filter").forEach(x=>x.classList.remove("active"));b.classList.add("active");const mode=b.textContent.toUpperCase();document.getElementById("allTournaments").innerHTML=tournaments.filter(t=>mode==="ALL"||t.mode===mode).map(card).join("");});
