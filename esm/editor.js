import hljs from "https://esm.sh/@pfmcodes/highlight.js@1.0.0/es/core.js"; // Use default export
import languages from "./languages.js";

languages.init();

async function createEditor(editor, data) {
    const editor1 = document.createElement("textarea");
    const highlighted = document.createElement("pre");
    const caret = document.createElement("div");
    const measureCanvas = document.createElement("canvas");
    const measureCtx = measureCanvas.getContext("2d");
    const isDark = data.theme && (data.theme.includes("dark") || data.theme.includes("night"));
    const caretColor = isDark ? "#fff" : "#7116d8";
    const lineColor = isDark ? "#fff" : "#000";
    const lineCounter = document.createElement("div");

    editor1.id = "Caret-textarea";
    highlighted.id = "Caret-highlighted";
    caret.id = "Caret-caret";
    lineCounter.id = "Caret-lineCounter";
    editor1.className = 'dark';
    highlighted.className = 'dark';
    caret.className = 'dark';
    lineCounter.className = 'dark';
    editor1.style.backgroundColor = isDark ? "#222" : "#fff";
    let code = data.value || "";
    let language = data.language;
    let theme = data.theme;
    if (!languages.registeredLanguages.includes(language)) {
        const mod = await import(`https://esm.sh/@pfmcodes/highlight.js@1.0.0/es/languages/${language}.js`);
        languages.registerLanguage(language, mod.default);
        languages.registeredLanguages.push(language);
    }
    if (theme) {
        let themeLink = document.getElementById("Caret-theme")
        if (!themeLink) {
            const link = document.createElement("link");
            link.rel = "stylesheet";
            link.id = "Caret-theme";
            link.href = `https://esm.sh/@pfmcodes/highlight.js@1.0.0/styles/${theme}.css`;
            document.head.appendChild(link);
        } else {
            themeLink.href = `https://esm.sh/@pfmcodes/highlight.js@1.0.0/styles/${theme}.css`;
        }
    } else {
        let themeLink  = document.getElementById("Caret-theme");
        if (!themeLink) {
            const link = document.createElement("link");
            link.rel = "stylesheet";
            link.id = "Caret-theme";
            link.href = `https://esm.sh/@pfmcodes/highlight.js@1.0.0/styles/hybrid.css`;
            document.head.appendChild(link);
        } else {
            themeLink.href = `./highlight.js/styles/hybrid.css`;
        }
    }
    editor1.spellcheck = false;
    editor1.autocapitalize = "off";
    editor1.autocomplete = "off";
    editor1.autocorrect = "off";
    editor.style = "position: relative; width: 600px; height: 300px; overflow: hidden; /* 👈 CRITICAL */ font-size: 14px;"   
    if (code && editor && editor1 && language && highlighted) {
        editor1.style.paddingTop = "-9px";
        console.log(data.value + " data.value");
        editor1.value = data.value;
        highlighted.innerHTML = await _render(data.value, language, editor1);
    }
    const keyDown = async (e) => {
        if (e.key !== "Tab") return;

        e.preventDefault();

        const value = editor1.value;
        const start = editor1.selectionStart;
        const end = editor1.selectionEnd;

        const indent = "    ";

        // Find line start & end
        const lineStart = value.lastIndexOf("\n", start - 1) + 1;
        const lineEnd = value.indexOf("\n", end);
        const finalLineEnd = lineEnd === -1 ? value.length : lineEnd;

        const block = value.slice(lineStart, finalLineEnd);
        const lines = block.split("\n");

        let newLines;
        let delta = 0;

        if (e.shiftKey) {
            // UNINDENT
            newLines = lines.map(line => {
                if (line.startsWith(indent)) {
                    delta -= indent.length;
                    return line.slice(indent.length);
                }
                if (line.startsWith("\t")) {
                    delta -= 1;
                    return line.slice(1);
                }
                return line;
            });
        } else {
            // INDENT
            newLines = lines.map(line => indent + line);
            delta = indent.length;
        }

        const newBlock = newLines.join("\n");

        editor1.value =
            value.slice(0, lineStart) +
            newBlock +
            value.slice(finalLineEnd);

        // Fix selection
        editor1.selectionStart = start + delta;
        editor1.selectionEnd =
            end + delta * newLines.length;

        highlighted.innerHTML = await _render(editor1.value, language, editor1);
        updateLineNumbers();
        updateCaret();
    }
    editor1.addEventListener("keydown", keyDown);
    editor.appendChild(lineCounter);
    editor.appendChild(highlighted);
    editor.appendChild(editor1);
    editor.appendChild(caret);

    function updateFontMetrics() {
        const style = getComputedStyle(editor1);
        measureCtx.font = `${style.fontSize} ${style.fontFamily}`;
    }

    function updateLineNumbers() {
        const lineCount = editor1.value.split("\n").length;

        let html = "";
        for (let i = 1; i <= lineCount; i++) {
            html += `<div class="Caret-lineCounter-number" style="color: ${lineColor}">${i}</div>`;
        }

        lineCounter.innerHTML = html;
    }

    highlighted.style.paddingTop = "12px"

    function getFontMetrics() {
        const metrics = measureCtx.measureText("Mg");
        return {
            ascent: metrics.actualBoundingBoxAscent,
            descent: metrics.actualBoundingBoxDescent,
            height: metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent
        };
    }
    const focus = () => {
        caret.style.opacity = "1";
        caret.style.background = caretColor;
    };

    editor1.addEventListener("focus", focus);

    const blur = () => {
        caret.style.opacity = "0";
    };

    editor1.addEventListener("blur", blur);

    function updateCaret() {
        const start = editor1.selectionStart;
        const text = editor1.value.slice(0, start);

        const lines = text.split("\n");
        const lineIndex = lines.length - 1;
        const lineText = lines[lineIndex].replace(/\t/g, "  ");

        const style = getComputedStyle(editor1);
        const paddingLeft = parseFloat(style.paddingLeft);
        const paddingTop = parseFloat(style.paddingTop);
        const lineHeight = parseFloat(style.lineHeight);

        updateFontMetrics();
        const metrics = measureCtx.measureText("Mg");
        const ascent = metrics.actualBoundingBoxAscent;

        caret.style.left =
            paddingLeft + measureCtx.measureText(lineText).width + "px";
        caret.style.top =
           -9 +
            paddingTop +
            lineIndex * lineHeight +
            (lineHeight - ascent) +
            "px";

        caret.style.height = `${lineHeight - 5}px`;
    }
    const input = async () => {
        caret.style.opacity = "1";
        highlighted.innerHTML = await _render(editor1.value, language, editor1);
        updateLineNumbers();
        updateCaret();
    };
    editor1.addEventListener("input", input);
    const scroll = async () => {
        const x = -editor1.scrollLeft;
        const y = -editor1.scrollTop;
        highlighted.innerHTML = await _render(editor1.value, language, editor1);
        highlighted.style.transform = `translate(${x}px, ${y}px)`;
        caret.style.transform = `translate(${x}px, ${y}px)`;
        lineCounter.style.transform = `translateY(${y}px)`;
    };
    editor1.addEventListener("scroll", scroll);

    updateFontMetrics();
    getFontMetrics();

    editor1.addEventListener("click", updateCaret);
    editor1.addEventListener("keyup", updateCaret);
    
    // Initial caret position
    updateLineNumbers();
    updateCaret();
    
    // Focus the editor
    editor1.focus();
    function destroy() {
        editor1.removeEventListener('click', updateCaret);
        editor1.removeEventListener('keyup', updateCaret);
        editor1.removeEventListener('scroll', scroll);
        editor1.removeEventListener('keydown', keyDown);
        editor.innerHTML = "";
    }
    async function refresh() {
        highlighted.innerHTML = await _render(editor1.value, language, editor1);
        updateLineNumbers();
        updateCaret();
    }
    function getValue() {
        return editor1.value;
    }
    function setValue(i) {
        editor1.value = i;
        refresh();
    }
    async function setLanguage(l) {
        if (!languages.registeredLanguages.includes(l)) {
            if (l === "html" || l === "svg") {
                language = "xml";
                l = "xml";
            }
            const mod = await import(`https://esm.sh/@pfmcodes/highlight.js@1.0.0/es/languages/${l}.js`);
            
        }
        language = l;
        refresh();
    }
    return {
        getValue,
        setValue,
        focus,
        setLanguage,
        destroy
    };
}

function escapeHtml(str) {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

async function _render(code, language, editor) {
    // If no editor context provided, just highlight everything (initial load)
    if (!editor) {
        return hljs.highlight(code, { language }).value;
    }
    
    const scrollTop = editor.scrollTop;
    const scrollBottom = scrollTop + editor.clientHeight;
    const style = getComputedStyle(editor);
    const lineHeight = parseFloat(style.lineHeight);
    
    // Calculate visible line range
    const startLine = Math.floor(scrollTop / lineHeight);
    const endLine = Math.ceil(scrollBottom / lineHeight);
    
    const lines = code.split("\n");
    
    // Add buffer (render extra lines above/below for smooth scrolling)
    const bufferLines = 10;
    const visibleStart = Math.max(0, startLine - bufferLines) || 0;
    const visibleEnd = Math.min(lines.length, endLine + bufferLines) || 0;
    
    // Split into three sections
    const beforeLines = lines.slice(0, visibleStart);
    const visibleLines = lines.slice(visibleStart, visibleEnd);
    const afterLines = lines.slice(visibleEnd);
    
    // Only highlight visible portion
    
    const highlightedVisible = hljs.highlight(visibleLines.join("\n"), { language }).value;
    // Plain text for non-visible areas (no highlighting = faster)
    if (highlightedVisible.trim() === "") {
        return hljs.highlight(escapeHtml(code), { language }).value;
    }
    const beforeHTML = "\n".repeat(beforeLines.length);
    const afterHTML = "\n".repeat(afterLines.length);
    return beforeHTML + highlightedVisible + afterHTML;
}

const editor = {
    createEditor
};

export default editor;

/* 

createEditor: creates the main editor, using html Elements like, textarea and etc.
                refresh: refreshs the editor
                getValue: return the current value from the editor
                setValue: sets a certain value to the editor's value
                focus: focusses the editor
                destroy: destroys and removeEventListeners
                updateCaret: updates the caret positon, height and other metrics using math
                updateLineNumbers: just add new line numbers
                getFontMetrics: returns back the font's metrics like height
                updateFontMetrics: update the fontMetrics
*/