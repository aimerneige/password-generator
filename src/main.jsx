import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Check,
  Clipboard,
  Copy,
  Dices,
  Hash,
  KeyRound,
  LetterText,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-500.css';
import '@fontsource/inter/latin-600.css';
import '@fontsource/inter/latin-700.css';
import '@fontsource/jetbrains-mono/latin-500.css';
import './styles.css';

const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const NUMBERS = '0123456789';
const SYMBOLS = '!@#$%^&*()-_=+[]{};:,.?/';
const CONFUSING_CHARACTERS = new Set('0O1Il|`\'"');

const defaultOptions = {
  length: 20,
  lowercase: true,
  uppercase: true,
  numbers: true,
  symbols: true,
  avoidConfusing: true,
};

function removeConfusingCharacters(value) {
  return [...value].filter((item) => !CONFUSING_CHARACTERS.has(item)).join('');
}

function getCharacterGroups(options) {
  const groups = [];

  if (options.lowercase) {
    groups.push(removeConfusingCharactersIfNeeded(LOWERCASE, options.avoidConfusing));
  }

  if (options.uppercase) {
    groups.push(removeConfusingCharactersIfNeeded(UPPERCASE, options.avoidConfusing));
  }

  if (options.numbers) {
    groups.push(removeConfusingCharactersIfNeeded(NUMBERS, options.avoidConfusing));
  }

  if (options.symbols) {
    groups.push(removeConfusingCharactersIfNeeded(SYMBOLS, options.avoidConfusing));
  }

  return groups.filter(Boolean);
}

function removeConfusingCharactersIfNeeded(value, shouldRemove) {
  if (!shouldRemove) {
    return value;
  }

  return removeConfusingCharacters(value);
}

function getRandomIndex(max) {
  if (max <= 0) {
    return 0;
  }

  const randomValues = new Uint32Array(1);
  crypto.getRandomValues(randomValues);
  return randomValues[0] % max;
}

function pickRandomCharacter(characters) {
  return characters[getRandomIndex(characters.length)];
}

function shuffleCharacters(characters) {
  const shuffled = [...characters];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = getRandomIndex(index + 1);
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled.join('');
}

function generatePassword(options) {
  const groups = getCharacterGroups(options);

  if (groups.length === 0) {
    return '';
  }

  const allCharacters = groups.join('');
  const password = groups.map(pickRandomCharacter);

  for (let index = password.length; index < options.length; index += 1) {
    password.push(pickRandomCharacter(allCharacters));
  }

  return shuffleCharacters(password).slice(0, options.length);
}

function getStrength(options) {
  const groups = getCharacterGroups(options);
  const poolSize = groups.join('').length;

  if (poolSize === 0) {
    return { label: '无效', level: 'empty' };
  }

  const entropy = Math.log2(poolSize) * options.length;

  if (entropy >= 100) {
    return { label: '很强', level: 'strong' };
  }

  if (entropy >= 70) {
    return { label: '强', level: 'good' };
  }

  if (entropy >= 45) {
    return { label: '中等', level: 'medium' };
  }

  return { label: '偏弱', level: 'weak' };
}

function ToggleButton({ active, children, icon: Icon, onClick }) {
  return (
    <button
      className={`toggle ${active ? 'is-active' : ''}`}
      type="button"
      aria-pressed={active}
      onClick={onClick}
    >
      <Icon aria-hidden="true" size={18} />
      <span>{children}</span>
    </button>
  );
}

function App() {
  const [options, setOptions] = useState(defaultOptions);
  const [password, setPassword] = useState(() => generatePassword(defaultOptions));
  const [copied, setCopied] = useState(false);
  const strength = useMemo(() => getStrength(options), [options]);
  const canGenerate = getCharacterGroups(options).length > 0;

  useEffect(() => {
    setPassword(generatePassword(options));
    setCopied(false);
  }, [options]);

  function updateOption(key, value) {
    setOptions((current) => ({ ...current, [key]: value }));
  }

  function toggleOption(key) {
    setOptions((current) => ({ ...current, [key]: !current[key] }));
  }

  function refreshPassword() {
    setPassword(generatePassword(options));
    setCopied(false);
  }

  async function copyPassword() {
    if (!password) {
      return;
    }

    await navigator.clipboard.writeText(password);
    setCopied(true);
  }

  return (
    <main className="app-shell">
      <section className="generator" aria-label="密码生成器">
        <div className="title-row">
          <div className="brand-mark" aria-hidden="true">
            <KeyRound size={28} />
          </div>
          <div>
            <p className="eyebrow">Secure static password tool</p>
            <h1>密码生成器</h1>
          </div>
        </div>

        <div className="password-panel">
          <div className="password-value" aria-live="polite">
            {password || '请选择至少一种字符类型'}
          </div>
          <button
            className="copy-button"
            type="button"
            disabled={!password}
            onClick={copyPassword}
          >
            {copied ? <Check size={20} /> : <Copy size={20} />}
            <span>{copied ? '已复制' : '复制'}</span>
          </button>
        </div>

        <div className="quick-row">
          <button className="primary-action" type="button" disabled={!canGenerate} onClick={refreshPassword}>
            <RefreshCw size={18} />
            <span>重新生成</span>
          </button>
          <div className={`strength strength-${strength.level}`}>
            <ShieldCheck size={18} />
            <span>强度：{strength.label}</span>
          </div>
        </div>

        <div className="controls">
          <label className="length-control">
            <span className="control-header">
              <span>长度</span>
              <strong>{options.length}</strong>
            </span>
            <input
              type="range"
              min="8"
              max="48"
              value={options.length}
              onChange={(event) => updateOption('length', Number(event.target.value))}
            />
          </label>

          <div className="toggle-grid" aria-label="字符选项">
            <ToggleButton
              active={options.lowercase}
              icon={LetterText}
              onClick={() => toggleOption('lowercase')}
            >
              小写字母
            </ToggleButton>
            <ToggleButton
              active={options.uppercase}
              icon={Sparkles}
              onClick={() => toggleOption('uppercase')}
            >
              大写字母
            </ToggleButton>
            <ToggleButton active={options.numbers} icon={Hash} onClick={() => toggleOption('numbers')}>
              数字
            </ToggleButton>
            <ToggleButton active={options.symbols} icon={Dices} onClick={() => toggleOption('symbols')}>
              符号
            </ToggleButton>
            <ToggleButton
              active={options.avoidConfusing}
              icon={Clipboard}
              onClick={() => toggleOption('avoidConfusing')}
            >
              忽略混淆字符
            </ToggleButton>
          </div>
        </div>
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
