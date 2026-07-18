/* ============================================================
   FACTUR — minimal JS syntax highlighter
   Emits per-token <span> elements so the docent engine can
   target individual identifiers by exact text.
   ============================================================ */
window.FACTUR = window.FACTUR || {};

(function () {
  const KEYWORDS = new Set([
    'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'of',
    'in', 'while', 'new', 'this', 'break', 'continue', 'null', 'true', 'false',
    'undefined', 'typeof'
  ]);

  function escapeHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function span(cls, text) {
    return '<span class="tok ' + cls + '">' + escapeHtml(text) + '</span>';
  }

  /* tokenize a single line into HTML */
  function line(src) {
    let out = '';
    let i = 0;
    let prevReal = ''; // previous non-space token text (for '.' member detection)
    const n = src.length;

    while (i < n) {
      const ch = src[i];

      // whitespace — preserve verbatim
      if (ch === ' ' || ch === '\t') {
        let j = i; while (j < n && (src[j] === ' ' || src[j] === '\t')) j++;
        out += escapeHtml(src.slice(i, j));
        i = j; continue;
      }

      // line comment
      if (ch === '/' && src[i + 1] === '/') {
        out += span('k-com', src.slice(i));
        break;
      }

      // string literal
      if (ch === '"' || ch === "'" || ch === '`') {
        let j = i + 1;
        while (j < n && src[j] !== ch) { if (src[j] === '\\') j++; j++; }
        j = Math.min(j + 1, n);
        out += span('k-str', src.slice(i, j));
        i = j; prevReal = 'str'; continue;
      }

      // number (incl hex)
      if (/[0-9]/.test(ch) || (ch === '.' && /[0-9]/.test(src[i + 1] || ''))) {
        let j = i;
        if (ch === '0' && (src[i + 1] === 'x' || src[i + 1] === 'X')) {
          j = i + 2; while (j < n && /[0-9a-fA-F]/.test(src[j])) j++;
        } else {
          while (j < n && /[0-9.]/.test(src[j])) j++;
        }
        out += span('k-num', src.slice(i, j));
        i = j; prevReal = 'num'; continue;
      }

      // identifier
      if (/[A-Za-z_$]/.test(ch)) {
        let j = i; while (j < n && /[A-Za-z0-9_$]/.test(src[j])) j++;
        const word = src.slice(i, j);
        // peek next non-space char to detect a call
        let k = j; while (k < n && src[k] === ' ') k++;
        const isCall = src[k] === '(';
        let cls;
        if (KEYWORDS.has(word)) cls = 'k-key';
        else if (isCall) cls = 'k-fn';
        else if (prevReal === '.') cls = 'k-var';   // member access => variable yellow
        else cls = 'k-txt';
        out += span(cls, word);
        i = j; prevReal = word; continue;
      }

      // punctuation / operators
      {
        out += span('k-punc', ch);
        prevReal = ch === '.' ? '.' : 'punc';
        i++;
      }
    }
    return out;
  }

  /* returns an array of HTML strings, one per source line */
  FACTUR.highlight = function (src) {
    return src.split('\n').map(line);
  };
})();
