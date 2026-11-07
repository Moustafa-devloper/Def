/* ================== البيانات ================== */
const DATA_KEY = "profile_data_v1";
const PASS_KEY = "profile_admin_pass_v1";
const SESSION_KEY = "profile_admin_session";

const DEFAULT_DATA = {
  name: "اسمك هنا",
  title: "المسمى الوظيفي",
  location: "المدينة، الدولة",
  bio: "اكتب نبذة قصيرة عن نفسك من لوحة التحكم.",
  skills: ["مهارة ١", "مهارة ٢", "مهارة ٣"],
  email: "",
  phone: "",
  github: "",
  linkedin: "",
  twitter: "",
  photo: ""
};

function loadData() {
  try {
    const raw = localStorage.getItem(DATA_KEY);
    return raw ? { ...DEFAULT_DATA, ...JSON.parse(raw) } : { ...DEFAULT_DATA };
  } catch (e) {
    return { ...DEFAULT_DATA };
  }
}

function saveData(data) {
  try {
    localStorage.setItem(DATA_KEY, JSON.stringify(data));
    return true;
  } catch (e) {
    return false; // غالبا الصورة كبيرة جدا
  }
}

const $ = (id) => document.getElementById(id);

function setAvatar(el, data) {
  if (data.photo) {
    el.style.backgroundImage = `url("${data.photo}")`;
    el.textContent = "";
  } else {
    el.style.backgroundImage = "";
    el.textContent = (data.name || "؟").trim().charAt(0);
  }
}

/* ================== الصفحة العامة ================== */
function renderPublic() {
  const d = loadData();
  document.title = d.name;
  $("name").textContent = d.name;
  $("title").textContent = d.title;
  $("location").textContent = d.location;
  $("bio").textContent = d.bio;
  setAvatar($("avatar"), d);

  const skills = $("skills");
  skills.innerHTML = "";
  d.skills.forEach((s) => {
    const li = document.createElement("li");
    li.textContent = s;
    skills.appendChild(li);
  });
  $("skillsBlock").hidden = d.skills.length === 0;

  const contacts = $("contacts");
  contacts.innerHTML = "";
  const items = [
    ["البريد", d.email, d.email && "mailto:" + d.email],
    ["الهاتف", d.phone, d.phone && "tel:" + d.phone.replace(/\s/g, "")],
    ["GitHub", d.github, d.github],
    ["LinkedIn", d.linkedin, d.linkedin],
    ["X / Twitter", d.twitter, d.twitter]
  ];
  items.forEach(([label, value, href]) => {
    if (!value) return;
    const li = document.createElement("li");
    const k = document.createElement("span");
    k.className = "k";
    k.textContent = label;
    li.appendChild(k);
    if (href && /^(https?:|mailto:|tel:)/i.test(href)) {
      const a = document.createElement("a");
      a.href = href;
      a.textContent = value;
      if (/^https?:/i.test(href)) { a.target = "_blank"; a.rel = "noopener noreferrer"; }
      li.appendChild(a);
    } else {
      const v = document.createElement("span");
      v.className = "v";
      v.textContent = value;
      li.appendChild(v);
    }
    contacts.appendChild(li);
  });
  if (!contacts.children.length) {
    const li = document.createElement("li");
    li.textContent = "لم تتم إضافة وسائل تواصل بعد.";
    contacts.appendChild(li);
  }
}

/* ================== لوحة التحكم ================== */
async function sha256(text) {
  try {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch (e) {
    return "plain:" + text; // احتياطي إذا لم يتوفر crypto.subtle
  }
}

async function getPassHash() {
  return localStorage.getItem(PASS_KEY) || (await sha256("admin123"));
}

function initAdmin() {
  let photo = "";

  const showAdmin = () => {
    $("loginView").hidden = true;
    $("adminView").hidden = false;
    fillForm();
  };

  if (sessionStorage.getItem(SESSION_KEY) === "1") showAdmin();

  $("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const ok = (await sha256($("pass").value)) === (await getPassHash());
    if (ok) {
      sessionStorage.setItem(SESSION_KEY, "1");
      $("loginError").textContent = "";
      $("pass").value = "";
      showAdmin();
    } else {
      $("loginError").textContent = "كلمة المرور غير صحيحة.";
    }
  });

  $("logout").addEventListener("click", () => {
    sessionStorage.removeItem(SESSION_KEY);
    $("adminView").hidden = true;
    $("loginView").hidden = false;
  });

  function fillForm() {
    const d = loadData();
    photo = d.photo;
    $("f_name").value = d.name;
    $("f_title").value = d.title;
    $("f_location").value = d.location;
    $("f_bio").value = d.bio;
    $("f_skills").value = d.skills.join("، ");
    $("f_email").value = d.email;
    $("f_phone").value = d.phone;
    $("f_github").value = d.github;
    $("f_linkedin").value = d.linkedin;
    $("f_twitter").value = d.twitter;
    setAvatar($("photoPreview"), d);
  }

  function flash(el, text) {
    el.textContent = text;
    setTimeout(() => (el.textContent = ""), 2500);
  }

  // تصغير الصورة قبل الحفظ حتى لا تمتلئ مساحة المتصفح
  $("f_photo").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const size = 400;
        const scale = Math.min(1, size / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * scale);
        c.height = Math.round(img.height * scale);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        photo = c.toDataURL("image/jpeg", 0.85);
        setAvatar($("photoPreview"), { photo, name: $("f_name").value });
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });

  $("removePhoto").addEventListener("click", () => {
    photo = "";
    $("f_photo").value = "";
    setAvatar($("photoPreview"), { photo, name: $("f_name").value });
  });

  $("profileForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const data = {
      name: $("f_name").value.trim(),
      title: $("f_title").value.trim(),
      location: $("f_location").value.trim(),
      bio: $("f_bio").value.trim(),
      skills: $("f_skills").value.split(/[,،]/).map((s) => s.trim()).filter(Boolean),
      email: $("f_email").value.trim(),
      phone: $("f_phone").value.trim(),
      github: $("f_github").value.trim(),
      linkedin: $("f_linkedin").value.trim(),
      twitter: $("f_twitter").value.trim(),
      photo
    };
    flash($("savedMsg"), saveData(data) ? "تم الحفظ." : "تعذر الحفظ. جرّب صورة أصغر.");
  });

  $("exportBtn").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(loadData(), null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "profile-data.json";
    a.click();
    URL.revokeObjectURL(a.href);
  });

  $("importFile").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (typeof parsed !== "object" || parsed === null) throw new Error();
        const merged = { ...DEFAULT_DATA, ...parsed };
        if (!Array.isArray(merged.skills)) merged.skills = [];
        saveData(merged);
        fillForm();
        flash($("savedMsg"), "تم الاستيراد.");
      } catch (err) {
        alert("الملف غير صالح.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  });

  $("resetBtn").addEventListener("click", () => {
    if (confirm("سيتم حذف كل البيانات والعودة للقيم الافتراضية. هل أنت متأكد؟")) {
      localStorage.removeItem(DATA_KEY);
      fillForm();
      flash($("savedMsg"), "تمت إعادة الضبط.");
    }
  });

  $("passForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const p = $("newPass").value;
    if (p.length < 6) return;
    localStorage.setItem(PASS_KEY, await sha256(p));
    $("newPass").value = "";
    flash($("passMsg"), "تم تغيير كلمة المرور.");
  });
}

/* ================== التشغيل ================== */
document.addEventListener("DOMContentLoaded", () => {
  const page = document.body.dataset.page;
  if (page === "public") renderPublic();
  if (page === "admin") initAdmin();
});
