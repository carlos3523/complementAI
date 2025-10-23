import React, { useMemo, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../style.css";
import { chat } from "../services/chat";
import UserMenu from "../components/UserMenu"; // Asegúrate de que la ruta sea correcta
import { translations } from "../translations"; // Asegúrate de tener este archivo con las claves

// --- KB mínimo de metodologías ---
const KB = {
  pmbok: {
    label: "PMBOK®",
    phases: [
      "Inicio",
      "Planificación",
      "Ejecución",
      "Monitoreo y Control",
      "Cierre",
    ],
    artifacts: {
      Inicio: [
        "Acta de Constitución",
        "Identificación de Stakeholders",
        "Caso de Negocio",
      ],
      Planificación: [
        "WBS/EDT",
        "Cronograma (Gantt)",
        "Presupuesto",
        "Plan de Riesgos",
        "Plan de Calidad",
        "Comunicaciones",
      ],
      Ejecución: ["Gestión de Cambios", "Reportes de Avance"],
      "Monitoreo y Control": [
        "EVM (PV, EV, AC)",
        "Seguimiento de Riesgos",
        "Control de Calidad",
      ],
      Cierre: ["Informe Final", "Lecciones Aprendidas"],
    },
    checks: {
      Inicio: [
        "Sponsor definido",
        "Objetivos SMART",
        "Stakeholders priorizados",
      ],
      Planificación: [
        "Línea base alcance-tiempo-costo",
        "Riesgos con respuesta",
        "Matriz RACI",
      ],
    },
  },
  iso21502: {
    label: "ISO 21502",
    phases: [
      "Inicio",
      "Planificación",
      "Ejecución",
      "Monitoreo y Control",
      "Cierre",
    ],
    artifacts: {
      Inicio: ["Mandato del Proyecto"],
      Planificación: [
        "Plan de Dirección",
        "Gestión de Beneficios",
        "Gestión de Interesados",
      ],
      Ejecución: ["Gestión de Recursos", "Adquisiciones"],
      "Monitoreo y Control": ["Revisión de Beneficios", "Aseguramiento"],
      Cierre: ["Transferencia Operacional"],
    },
    checks: {
      Planificación: [
        "Beneficios vinculados a estrategia",
        "Controles de calidad definidos",
      ],
    },
  },
  scrum: {
    label: "Scrum / Ágil",
    phases: ["Descubrimiento", "Ejecución Iterativa", "Cierre"],
    artifacts: {
      Descubrimiento: ["Visión de Producto", "Product Backlog"],
      "Ejecución Iterativa": ["Sprint Backlog", "Increment", "DoD/DoR"],
      Cierre: ["Release Notes", "Retro final"],
    },
    checks: {
      "Ejecución Iterativa": [
        "Ceremonias activas",
        "Backlog priorizado",
        "DoD aplicado",
      ],
    },
  },
};

const STATIC_SUGGESTIONS = [
  "Genera el Acta de Constitución",
  "Crea la WBS/EDT",
  "Propón cronograma inicial",
  "Arma el registro de riesgos",
  "Diseña la matriz RACI",
];

export default function AssistantPage() {
  // Contexto del Proyecto
  const [standard, setStandard] = useState("pmbok");
  const [phase, setPhase] = useState(KB.pmbok.phases[1]); // Planificación
  const [industry, setIndustry] = useState(""); // 🎯 ESTADOS PARA PREFERENCIAS DEL ASISTENTE (DE USERMENU)

  const [assistantStyle, setAssistantStyle] = useState("detallado");
  const [showEmojis, setShowEmojis] = useState(true);
  const [showTimestamps, setShowTimestamps] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);
  const [language, setLanguage] = useState("es"); // 💡 NUEVO ESTADO: Tamaño de la letra
  const [fontSize, setFontSize] = useState("medium"); // 🎯 FUNCIÓN T QUE TRADUCE (usa el estado 'language')
  const T = (key, fallback = key) => {
    // Si la clave es un texto duro (como los nombres de las metodologías o artefactos), simplemente devuélvelo
    if (!translations[language] || !translations[language][key])
      return fallback;
    return translations[language][key];
  }; // 🎯 ESTADO PARA FORZAR RECARGA DE CONFIGURACIÓN

  const [configKey, setConfigKey] = useState(0); // Chat estado

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    // Usamos T() para el mensaje inicial
    {
      id: 1,
      role: "assistant",
      text: T("READY_MSG", "Asistente listo ✅ — Assistant Lite"),
      ts: Date.now(),
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState(""); // Historial (múltiples hilos)

  const [threads, setThreads] = useState([]); // [{id,title,createdAt,messages:[]}]
  const [currentThreadId, setCurrentThreadId] = useState(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  const kb = KB[standard];
  const artifacts = kb.artifacts[phase] || [];
  const checks = (kb.checks && kb.checks[phase]) || [];

  const navigate = useNavigate();
  const boxRef = useRef(null);

  function openWizard() {
    const qs = new URLSearchParams({
      standard,
      phase,
      domain: industry || "",
    }).toString();
    navigate(`/wizard?${qs}`);
  } // FUNCIÓN PARA RECARGAR LA CONFIGURACIÓN (se pasa a UserMenu)

  const refreshConfig = () => {
    // Incrementa la clave para forzar la relectura del useEffect de abajo
    setConfigKey((prev) => prev + 1);
  }; // Autoscroll - CONTROLADO POR LA PREFERENCIA

  useEffect(() => {
    if (autoScroll && boxRef.current) {
      boxRef.current.scrollTop = boxRef.current.scrollHeight;
    }
  }, [messages, loading, autoScroll]); // Cargar sesión + historial + CONFIGURACIÓN

  useEffect(() => {
    // 1. Cargar preferencias del asistente (depende de configKey)
    const savedPrefs = JSON.parse(
      localStorage.getItem("assistant_prefs") || "{}"
    );
    setAssistantStyle(savedPrefs.style || "detallado");
    setShowEmojis(savedPrefs.emojis ?? true);
    setShowTimestamps(savedPrefs.timestamps ?? true);
    setAutoScroll(savedPrefs.autoscroll ?? true); // 🎯 Cargar Idioma
    setLanguage(savedPrefs.language || "es"); // 💡 Cargar Tamaño de Fuente
    setFontSize(savedPrefs.fontSize || "medium"); // 2. Cargar sesión
    const saved = JSON.parse(
      localStorage.getItem("assistant_session") || "null"
    );
    if (saved) {
      setStandard(saved.standard ?? "pmbok");
      setPhase(saved.phase ?? KB.pmbok.phases[1]);
      setIndustry(saved.industry ?? "");
    } // 3. Cargar Historial
    const storedThreads = JSON.parse(
      localStorage.getItem("assistant_threads") || "[]"
    );
    const storedCurrent = localStorage.getItem("assistant_current_thread");

    if (storedThreads.length) {
      setThreads(storedThreads);
      const t =
        storedThreads.find((x) => x.id === storedCurrent) || storedThreads[0];
      setCurrentThreadId(t.id);
      setMessages(t.messages);
    } else {
      const init = {
        id: String(Date.now()), // 🎯 Usamos T()
        title: T("NEW_CHAT_TITLE", "Nueva conversación"),
        createdAt: Date.now(), // 🎯 Usamos T()
        messages: [
          {
            id: 1,
            role: "assistant",
            text: T("READY_MSG", "Asistente listo ✅ — Assistant Lite"),
            ts: Date.now(),
          },
        ],
      };
      setThreads([init]);
      setCurrentThreadId(init.id);
      setMessages(init.messages);
      localStorage.setItem("assistant_threads", JSON.stringify([init]));
      localStorage.setItem("assistant_current_thread", init.id);
    }
  }, [configKey]); // 👈 ¡Dependencia de configKey! // Guardar contexto ligero

  useEffect(() => {
    localStorage.setItem(
      "assistant_session",
      JSON.stringify({ standard, phase, industry, messages })
    );
  }, [standard, phase, industry]); // Persistir mensajes dentro del hilo actual

  useEffect(() => {
    if (!currentThreadId) return;
    setThreads((prev) => {
      const copy = prev.map((t) =>
        t.id === currentThreadId ? { ...t, messages } : t
      );
      localStorage.setItem("assistant_threads", JSON.stringify(copy));
      return copy;
    });
  }, [messages, currentThreadId]);

  const dynamicSuggestions = useMemo(() => {
    const setx = new Set(STATIC_SUGGESTIONS);
    artifacts
      .slice(0, 3)
      .forEach((a) =>
        setx.add(T("GENERATE_TEMPLATE_FOR", "Genera plantilla: ") + a)
      );
    return Array.from(setx).slice(0, 8);
  }, [artifacts]); // === Historial: utilidades ===

  function newThread() {
    const t = {
      id: String(Date.now()), // 🎯 Usamos T()
      title: T("NEW_CHAT_TITLE", "Nueva conversación"),
      createdAt: Date.now(), // 🎯 Usamos T()
      messages: [
        {
          id: Date.now(),
          role: "assistant",
          text: T("NEW_CHAT_INIT", "¡Nuevo chat! ¿En qué te ayudo?"),
          ts: Date.now(),
        },
      ],
    };
    setThreads((prev) => {
      const next = [t, ...prev];
      localStorage.setItem("assistant_threads", JSON.stringify(next));
      return next;
    });
    setCurrentThreadId(t.id);
    setMessages(t.messages);
    localStorage.setItem("assistant_current_thread", t.id);
    setHistoryOpen(false);
  }

  function selectThread(id) {
    const t = threads.find((x) => x.id === id);
    if (!t) return;
    setCurrentThreadId(id);
    setMessages(t.messages);
    localStorage.setItem("assistant_current_thread", id);
    setHistoryOpen(false);
  }

  function deleteThread(id) {
    const next = threads.filter((t) => t.id !== id);
    setThreads(next);
    localStorage.setItem("assistant_threads", JSON.stringify(next));
    if (next.length) {
      setCurrentThreadId(next[0].id);
      setMessages(next[0].messages);
      localStorage.setItem("assistant_current_thread", next[0].id);
    } else {
      newThread();
    }
  } // Mini Markdown (bold, italic, code, lists y párrafos básicos)
  function renderMarkdown(md = "") {
    // Escapar HTML
    const escape = (s) =>
      s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); // Bloques de código ```...```

    md = md.replace(/```([\s\S]*?)```/g, (_, code) => {
      return `<pre class="md-code"><code>${escape(code)}</code></pre>`;
    });

    let html = escape(md); // Negrita **texto**

    html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>"); // Cursiva *texto*
    html = html.replace(/\*(.+?)\*/g, "<em>$1</em>"); // Código inline `x`
    html = html.replace(/`([^`]+?)`/g, "<code>$1</code>"); // Listas ordenadas (1. …)

    html = html.replace(/(^|\n)(\d+\.\s.*(?:\n(?!\n|\d+\.\s).+)*)/g, (m) => {
      const items = m
        .trim()
        .split("\n")
        .map((l) => l.replace(/^\d+\.\s/, "").trim())
        .map((l) => `<li>${l}</li>`)
        .join("");
      return `\n<ol>${items}</ol>`;
    }); // Sub-listas a) b) c)

    html = html.replace(
      /(^|\n)([a-z]\)\s.*(?:\n(?!\n|[a-z]\)\s).+)*)/g,
      (m) => {
        const items = m
          .trim()
          .split("\n")
          .map((l) => l.replace(/^[a-z]\)\s/, "").trim())
          .map((l) => `<li>${l}</li>`)
          .join("");
        return `\n<ol type="a">${items}</ol>`;
      }
    ); // Listas con guión

    html = html.replace(/(^|\n)(-\s.*(?:\n(?!\n|-\s).+)*)/g, (m) => {
      const items = m
        .trim()
        .split("\n")
        .map((l) => l.replace(/^-+\s/, "").trim())
        .map((l) => `<li>${l}</li>`)
        .join("");
      return `\n<ul>${items}</ul>`;
    }); // Párrafos (líneas dobles -> <p>)

    html = html
      .split(/\n{2,}/)
      .map((blk) => {
        if (/^<ol|^<ul|^<pre|^<p|^<h/.test(blk.trim())) return blk;
        return `<p>${blk.replace(/\n/g, "<br/>")}</p>`;
      })
      .join("");

    return html;
  }
  function exportThread(id) {
    const t = threads.find((x) => x.id === id);
    if (!t) return;
    const blob = new Blob([JSON.stringify(t, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `assistant-thread-${id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  } // --- Enviar a la IA via services/chat (USA ESTILOS de CONFIG) ---

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { id: Date.now(), role: "user", text, ts: Date.now() };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setErrMsg("");
    setLoading(true); // renombrar conversación si es nueva

    setThreads((prev) => {
      const next = prev.map((t) =>
        t.id === currentThreadId &&
        (t.title === T("NEW_CHAT_TITLE", "Nueva conversación") || !t.title)
          ? { ...t, title: text.slice(0, 60) }
          : t
      );
      localStorage.setItem("assistant_threads", JSON.stringify(next));
      return next;
    }); // contexto de sistema (APLICANDO assistantStyle, showEmojis y language)

    const systemPrompt = `Eres un asistente experto en gestión de proyectos.

    Responde SIEMPRE en el idioma **${
      language === "es" ? "Español" : language
    }** (código: ${language}).

    Responde SIEMPRE en **Markdown** y con estilo ${assistantStyle} siguiendo estas reglas:
    - Comienza con una **línea de título en negrita** que resuma la respuesta.
    - Luego entrega una **lista ordenada 1., 2., 3.** con pasos accionables (frases cortas, sin párrafos largos).
    - Si corresponde, usa **sub-pasos a), b), c)** dentro de un paso.
    - Usa **negrita** para artefactos/entregables clave y emojis suaves (${
      showEmojis ? "✅, 📌, ⚠️" : "SIN EMOJIS"
    }) **solo si aportan claridad**.
    - Si incluyes plantillas o ejemplos, enciérralos en bloques de código triple: \`\`\`.
    - Deja **una línea en blanco** entre secciones o bloques.
    - Evita encabezados enormes: usa **negritas** (o H4) en lugar de H1/H2.
    - Limita a **máximo 8–10 bullets**; prioriza lo esencial.
    - Cierra con **una línea final** de siguiente paso o pregunta de confirmación.

    Contexto:
    - Marco: ${kb.label}
    - Fase: ${phase}
    ${industry ? `- Industria: ${industry}\n` : ``}${
      artifacts.length
        ? `- Artefactos esperados: ${artifacts.join(", ")}\n`
        : ``
    }${checks.length ? `- Checks clave: ${checks.join(", ")}\n` : ``}`;

    const history = messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .slice(-8)
      .map((m) => ({ role: m.role, content: m.text }));

    const payload = [
      { role: "system", content: systemPrompt },
      ...history,
      { role: "user", content: text },
    ]; // “Pensando…” // 🎯 Usamos T()

    const thinking = {
      id: Date.now() + 1,
      role: "assistant",
      text: T("THINKING_MSG", "Pensando…"),
      ts: Date.now(),
      thinking: true,
    };
    setMessages((m) => [...m, thinking]);

    try {
      const content = await chat(payload); // llama a tu /api/chat
      setMessages((m) =>
        m.map((mm) =>
          mm.thinking ? { ...mm, thinking: false, text: content || "…" } : mm
        )
      );
    } catch (e) {
      console.error(e); // 🎯 Usamos T()
      setErrMsg(
        T(
          "ERROR_MSG",
          "Ocurrió un error consultando a la IA. Intenta de nuevo."
        )
      );
      setMessages((m) =>
        m.map(
          (
            mm // 🎯 Usamos T()
          ) =>
            mm.thinking
              ? {
                  ...mm,
                  thinking: false,
                  text: T(
                    "AI_FAIL_MSG",
                    "⚠️ No pude consultar a la IA ahora. ¿Quieres reintentar?"
                  ),
                }
              : mm
        )
      );
    } finally {
      setLoading(false);
    }
  } // --- Guardar como proyecto (sin cambios) ---

  function saveAsProject() {
    const projects = JSON.parse(localStorage.getItem("projects") || "[]"); // 🎯 Usamos T()

    const name = `${T("ASSISTANT_PROJECT_PREFIX", "Asistente")} · ${
      KB[standard].label
    } · ${phase}`;
    const templates = (KB[standard].artifacts[phase] || []).map((a) => ({
      // 🎯 Usamos T()
      name: a,
      why: T("ASSISTANT_PROJECT_REASON", "Sugerido por contexto del asistente"),
    }));

    const project = {
      id: (crypto?.randomUUID && crypto.randomUUID()) || String(Date.now()),
      name,
      stage: phase,
      methodology: standard,
      domain: industry || "general",
      templates,
      createdAt: Date.now(),
    };

    localStorage.setItem("projects", JSON.stringify([project, ...projects])); // 🎯 Usamos T()
    alert(
      T("PROJECT_SAVED_ALERT", "Proyecto guardado. Revísalo en el Dashboard.")
    );
  } // --- Botón Progreso (función auxiliar) ---

  function goToProgress() {
    navigate("/Progreso"); // Redirige a la ruta de la página de Progreso
  } // --- Grabación de voz (sin cambios) ---

  const [recording, setRecording] = useState(false);
  const recognitionRef = useRef(null);

  function startRecording() {
    if (!("webkitSpeechRecognition" in window)) {
      // 🎯 Usamos T()
      alert(
        T(
          "VOICE_UNSUPPORTED_ALERT",
          "Tu navegador no soporta reconocimiento de voz 😢"
        )
      );
      return;
    }

    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = language === "es" ? "es-ES" : "en-US"; // Ajustar idioma de reconocimiento
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setRecording(true);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput((prev) => (prev ? prev + " " + transcript : transcript));
    };

    recognition.onerror = (event) => {
      console.error("Error de voz:", event.error); // 🎯 Usamos T()
      alert(
        T("VOICE_ERROR_ALERT", "Ocurrió un error al grabar: ") + event.error
      );
    };

    recognition.onend = () => {
      setRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }

  function stopRecording() {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setRecording(false);
    }
  } // UI helpers

  const formatTime = (ts) =>
    new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); // --- MIGRAR HISTORIAL VIEJO (sin cambios, solo corregimos el default ts) ---

  useEffect(() => {
    // normaliza hilos y mensajes antiguos (strings o sin ts)
    const fixMsgs = (arr) =>
      (arr || []).filter(Boolean).map((m, i) => {
        if (typeof m === "string") {
          // si quedó texto suelto, asume que fue del asistente
          return {
            id: Date.now() + i,
            role: "assistant",
            text: m,
            ts: Date.now() + i,
          };
        }
        return {
          id: m.id ?? Date.now() + i,
          role: m.role === "user" ? "user" : "assistant",
          text: String(m.text ?? m.content ?? ""),
          ts: m.ts ?? Date.now() + i,
        };
      }); // corrige sesión simple

    const saved = JSON.parse(
      localStorage.getItem("assistant_session") || "null"
    );
    if (saved?.messages) {
      const fixed = fixMsgs(saved.messages);
      localStorage.setItem(
        "assistant_session",
        JSON.stringify({ ...saved, messages: fixed })
      );
    } // corrige hilos

    const th = JSON.parse(localStorage.getItem("assistant_threads") || "[]");
    if (th.length) {
      const fixedThreads = th.map((t) => ({
        ...t,
        messages: fixMsgs(t.messages),
      }));
      localStorage.setItem("assistant_threads", JSON.stringify(fixedThreads));
    }
  }, []); // 🎯 Render de cada burbuja (USA showTimestamps y T())

  const ChatMessage = ({ m, showTimestamps }) => {
    const isUser = m.role === "user";
    const time = showTimestamps ? ` • ${formatTime(m.ts || Date.now())}` : ""; // 🎯 Usamos T() para el rol
    const meta = `${
      isUser ? T("USER_LABEL", "Tú") : T("ASSISTANT_LABEL", "Asistente")
    }${time}`; // --- Lectura por voz (Text-to-Speech)
    const speak = () => {
      if (!window.speechSynthesis) {
        // 🎯 Usamos T()
        alert(
          T("TTS_UNSUPPORTED_ALERT", "Tu navegador no soporta lectura de voz.")
        );
        return;
      }

      const utter = new SpeechSynthesisUtterance(m.text);
      utter.lang = language === "es" ? "es-ES" : "en-US"; // Ajustar idioma de voz
      utter.rate = 1;
      utter.pitch = 1;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utter);
    }; // Markdown seguro y compacto

    const toHTML = (() => {
      try {
        const html = renderMarkdown(m.text || "");
        return { __html: html };
      } catch {
        return { __html: (m.text || "").replace(/\n/g, "<br/>") };
      }
    })();

    return (
      <div className={`msg-row ${isUser ? "right" : "left"}`}>
                {!isUser && <div className="avatar" aria-hidden />}       {" "}
        <div className={`bubble ${isUser ? "user" : "assistant"}`}>
                   {" "}
          <div className="bubble-meta">
                        <span className="who">{meta}</span>         {" "}
          </div>
                   {" "}
          <div
            className={`bubble-text ${m.thinking ? "muted" : ""} markdown`}
            dangerouslySetInnerHTML={toHTML}
          />
                    {/* Botón de voz solo para mensajes del asistente */}       {" "}
          {!isUser && !m.thinking && (
            <div className="voice-controls">
                           {" "}
              {/* 🎯 Usamos T() para los títulos de los botones */}             {" "}
              <button
                className="speak-btn"
                onClick={speak}
                title={T("SPEAK_BTN_TITLE", "Leer en voz alta")}
              >
                🔊
              </button>
                           {" "}
              <button
                className="speak-btn stop"
                onClick={() => window.speechSynthesis.cancel()}
                title={T("STOP_SPEAK_BTN_TITLE", "Detener lectura")}
              >
                ⏹️
              </button>
                         {" "}
            </div>
          )}
                 {" "}
        </div>
                {isUser && <div className="avatar user" aria-hidden />}     {" "}
      </div>
    );
  };
  localStorage.setItem(
    "auth_user",
    JSON.stringify({ email: "demo@test.com", name: "Demo" })
  );
  return (
    <main className="assistant">
           {" "}
      <div className="assistant-wrap">
                {/* Top bar */}       {" "}
        <div className="appbar">
                   {" "}
          <div className="appbar-left">
                        {/* 🎯 Usamos T() */}           {" "}
            <button className="appbar-btn" onClick={openWizard}>
              {T("WIZARD_BTN", "Abrir Wizard")}
            </button>
                        {/* 🎯 Usamos T() */}           {" "}
            <div className="appbar-title">
              📁 {T("APP_TITLE", "Asistente de Proyectos")}
            </div>
                        {/* PASAMOS LA FUNCIÓN refreshConfig */}
                        <UserMenu refreshConfig={refreshConfig} />         {" "}
          </div>
                   {" "}
          <div className="appbar-actions">
                        {/* 🎯 Usamos T() */}           {" "}
            <button
              className="appbar-btn ghost"
              onClick={() => setHistoryOpen((v) => !v)}
            >
              {T("HISTORY_BTN", "Historial")}
            </button>
                       {" "}
            {/* 🎯 CORRECCIÓN: Usamos T() para el botón principal de Nueva Conversación */}
                       {" "}
            <button className="appbar-btn" onClick={newThread}>
              {T("NEW_CHAT_BTN", "Nueva conversación")}
            </button>
                        {/* 🎯 Usamos T() */}           {" "}
            <button
              className="appbar-btn ghost"
              onClick={() => navigate("/dashboard")}
            >
              {T("DASHBOARD_BTN", "Volver al Dashboard")}
            </button>
                     {" "}
          </div>
                 {" "}
        </div>
                {/* Drawer Historial */}       {" "}
        {historyOpen && (
          <div className="history-drawer">
                       {" "}
            <div className="history-head">
                            {/* 🎯 Usamos T() */}             {" "}
              <div className="history-title">
                {T("HISTORY_TITLE", "Historial")}
              </div>
                           {" "}
              <button className="close-x" onClick={() => setHistoryOpen(false)}>
                ✕
              </button>
                         {" "}
            </div>
                       {" "}
            <div className="history-list">
                           {" "}
              {threads.map((t) => (
                <div
                  key={t.id}
                  className={`history-item ${
                    t.id === currentThreadId ? "active" : ""
                  }`}
                >
                                   {" "}
                  <div
                    className="history-info"
                    onClick={() => selectThread(t.id)}
                  >
                                        {/* 🎯 Usamos T() */}                   {" "}
                    <div className="history-title-line">
                      {t.title || T("NO_TITLE_LABEL", "Sin título")}
                    </div>
                                       {" "}
                    <div className="history-sub">
                                            {/* 🎯 Usamos T() */}               
                            {new Date(t.createdAt).toLocaleString()} ·{" "}
                      {t.messages?.length || 0} {T("MSGS_LABEL", "msgs")}       
                                 {" "}
                    </div>
                                     {" "}
                  </div>
                                   {" "}
                  <div className="history-actions">
                                        {/* 🎯 Usamos T() */}                   {" "}
                    <button className="mini" onClick={() => exportThread(t.id)}>
                      {T("EXPORT_BTN", "Exportar")}
                    </button>
                                        {/* 🎯 Usamos T() */}                   {" "}
                    <button
                      className="mini danger"
                      onClick={() => deleteThread(t.id)}
                    >
                      {T("DELETE_BTN", "Borrar")}
                    </button>
                                     {" "}
                  </div>
                                 {" "}
                </div>
              ))}
                            {/* 🎯 Usamos T() */}             {" "}
              {threads.length === 0 && (
                <div className="history-empty">
                  {T("HISTORY_EMPTY_MSG", "No hay conversaciones.")}
                </div>
              )}
                         {" "}
            </div>
                     {" "}
          </div>
        )}
                {/* Sidebar */}       {" "}
        <aside className="assistant-column">
                   {" "}
          <div className="assistant-card">
                        {/* 🎯 Usamos T() */}           {" "}
            <div className="assistant-subtitle">
              {T("CONTEXT_TITLE", "Contexto")}
            </div>
                        {/* 🎯 Usamos T() */}           {" "}
            <label className="assistant-label">
              {T("FRAMEWORK_LABEL", "Marco de trabajo")}
            </label>
                       {" "}
            <select
              value={standard}
              onChange={(e) => {
                setStandard(e.target.value);
                setPhase(KB[e.target.value].phases[0]);
              }}
              className="assistant-select"
            >
                            <option value="pmbok">{KB.pmbok.label}</option>     
                      <option value="iso21502">{KB.iso21502.label}</option>     
                      <option value="scrum">{KB.scrum.label}</option>           {" "}
            </select>
                        {/* 🎯 Usamos T() */}           {" "}
            <label className="assistant-label">
              {T("PHASE_LABEL", "Fase")}
            </label>
                       {" "}
            <select
              value={phase}
              onChange={(e) => setPhase(e.target.value)}
              className="assistant-select"
            >
                           {" "}
              {kb.phases.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
                         {" "}
            </select>
                        {/* 🎯 Usamos T() */}           {" "}
            <label className="assistant-label">
              {T("INDUSTRY_LABEL", "Industria (opcional)")}
            </label>
                       {" "}
            <input
              value={industry}
              onChange={(e) => setIndustry(e.target.value)} // 🎯 Usamos T()
              placeholder={T("INDUSTRY_PLACEHOLDER", "Salud, Retail, Banca…")}
              className="assistant-input"
            />
                        <div className="assistant-divider" />           {" "}
            <div className="assistant-chips">
                           {" "}
              {dynamicSuggestions.map((s, i) => (
                <button
                  key={i}
                  className="assistant-chip"
                  onClick={() =>
                    setInput((prev) => (prev ? prev + "\n" + s : s))
                  }
                >
                                    {s}               {" "}
                </button>
              ))}
                         {" "}
            </div>
                       {" "}
            <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
                            {/* Botón Progreso */}             {" "}
              <button
                className="assistant-btn ghost flex1"
                onClick={goToProgress}
              >
                                {T("PROGRESS_BTN", "Progreso")} 📈              {" "}
              </button>
                           {" "}
              {/* Botón Guardar como proyecto (con clase flex1 añadida) */}     
                     {" "}
              <button
                className="assistant-btn success flex1"
                onClick={saveAsProject}
              >
                                {T("SAVE_PROJECT_BTN", "Guardar como proyecto")}
                             {" "}
              </button>
                         {" "}
            </div>
                     {" "}
          </div>
                   {" "}
          <div className="assistant-card">
                        {/* 🎯 Usamos T() */}           {" "}
            <div className="assistant-subtitle">
              {T("KNOWLEDGE_TITLE", "Conocimiento")} · {kb.label}
            </div>
                        {/* 🎯 Usamos T() */}           {" "}
            <div className="assistant-meta">
              {T("PHASE_LABEL", "Fase")}: {phase}
            </div>
                       {" "}
            {artifacts.length > 0 && (
              <>
                                {/* 🎯 Usamos T() */}               {" "}
                <div className="assistant-meta-strong">
                  {T("ARTIFACTS_TITLE", "Artefactos")}
                </div>
                               {" "}
                <ul className="assistant-list">
                                   {" "}
                  {artifacts.map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                                 {" "}
                </ul>
                             {" "}
              </>
            )}
                       {" "}
            {checks.length > 0 && (
              <>
                                {/* 🎯 Usamos T() */}               {" "}
                <div className="assistant-meta-strong">
                  {T("CHECKS_TITLE", "Checks")}
                </div>
                               {" "}
                <ul className="assistant-list">
                                   {" "}
                  {checks.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                                 {" "}
                </ul>
                             {" "}
              </>
            )}
                     {" "}
          </div>
                 {" "}
        </aside>
                {/* Chat */}       {" "}
        <section className="assistant-column">
                   {" "}
          <div className="assistant-card">
                       {" "}
            {/* 💡 APLICACIÓN DEL TAMAÑO DE FUENTE COMO CLASE CSS */}           {" "}
            <div
              ref={boxRef}
              className={`assistant-chat chat-font-${fontSize}`}
            >
                            {/* PASAMOS showTimestamps */}             {" "}
              {messages.map((m) => (
                <ChatMessage key={m.id} m={m} showTimestamps={showTimestamps} />
              ))}
                                         {" "}
              {loading && (
                <div className="msg-row left">
                                    <div className="avatar">A</div>             
                     {" "}
                  <div className="bubble assistant">
                                       {" "}
                    <div className="bubble-meta">
                                            {/* 🎯 Usamos T() */}               
                           {" "}
                      <span className="who">
                        {T("ASSISTANT_LABEL", "Asistente")}
                      </span>
                                           {" "}
                      {/* Control de timestamp en mensaje de carga */}         
                                 {" "}
                      {showTimestamps && (
                        <span className="time">{formatTime(Date.now())}</span>
                      )}
                                         {" "}
                    </div>
                                        {/* 🎯 Usamos T() */}                   {" "}
                    <div className="bubble-text muted">
                      {T("THINKING_MSG", "Pensando…")}
                    </div>
                                     {" "}
                  </div>
                                 {" "}
                </div>
              )}
                         {" "}
            </div>
                        {/* 🎯 Usamos T() */}           {" "}
            {errMsg && <div className="assistant-error">{errMsg}</div>}         
             {" "}
            <div className="assistant-row">
                           {" "}
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Tab") {
                    e.preventDefault();
                    const { selectionStart, selectionEnd } = e.target;
                    const before = input.substring(0, selectionStart);
                    const selected = input.substring(
                      selectionStart,
                      selectionEnd
                    );
                    const after = input.substring(selectionEnd);

                    const lines = selected.split("\n");

                    if (e.shiftKey) {
                      // Shift+Tab: quitar tab al inicio de cada línea
                      const unindented = lines.map((line) =>
                        line.startsWith("\t") ? line.slice(1) : line
                      );
                      const newValue = before + unindented.join("\n") + after;
                      setInput(newValue); // recalcular cursor: mantenerlo relativo al final de la selección

                      const removedTabs =
                        lines.reduce(
                          (acc, line) =>
                            acc + (line.startsWith("\t") ? 1 : 0) + line.length,
                          0
                        ) - lines.join("\n").length;
                      setTimeout(() => {
                        e.target.selectionStart = selectionStart;
                        e.target.selectionEnd = selectionEnd - removedTabs;
                      }, 0);
                    } else {
                      // Tab normal: agregar tab al inicio de cada línea
                      const indented = lines.map((line) => "\t" + line);
                      const newValue = before + indented.join("\n") + after;
                      setInput(newValue); // cursor al final de la última línea insertada

                      const addedTabs = lines.length;
                      setTimeout(() => {
                        e.target.selectionStart = selectionStart + 1;
                        e.target.selectionEnd = selectionEnd + addedTabs;
                      }, 0);
                    }
                  }

                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }} // 🎯 Usamos T()
                placeholder={T("INPUT_PLACEHOLDER", "Escribe tu mensaje...")}
                className="assistant-input flex1"
                rows={3}
              />
                            {/* 🎙️ Botón de grabación */}             {" "}
              <button
                onClick={recording ? stopRecording : startRecording}
                className={`assistant-btn ${recording ? "recording" : ""}`} // 🎯 Usamos T()
                title={
                  recording
                    ? T("RECORD_STOP_TITLE", "Detener grabación")
                    : T("RECORD_START_TITLE", "Grabar mensaje de voz")
                }
              >
                                {recording ? "⏹️" : "🎙️"}             {" "}
              </button>
                           {" "}
              <button
                onClick={handleSend}
                className="assistant-btn"
                disabled={loading}
              >
                                {/* 🎯 Usamos T() */}               {" "}
                {loading
                  ? T("SENDING_BTN", "Enviando…")
                  : T("SEND_BTN", "Enviar")}
                             {" "}
              </button>
                         {" "}
            </div>
                     {" "}
          </div>
                 {" "}
        </section>
             {" "}
      </div>
         {" "}
    </main>
  );
}
