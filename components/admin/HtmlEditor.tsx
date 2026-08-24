"use client";

import { useEffect, useId, useRef } from "react";

type HtmlEditorProps = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
};

function ToolbarButton({
  label,
  title,
  onMouseDown,
}: {
  label: string;
  title: string;
  onMouseDown: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => {
        e.preventDefault();
        onMouseDown();
      }}
      className="border border-black bg-white px-2 py-1 font-[family-name:var(--font-geist-mono)] text-[0.6rem] uppercase tracking-[0.08em] text-black hover:bg-neutral-100"
    >
      {label}
    </button>
  );
}

export default function HtmlEditor({
  value,
  onChange,
  placeholder = "Write HTML content…",
  minHeight = "180px",
}: HtmlEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const lastEmitted = useRef(value);
  const id = useId();

  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    el.innerHTML = value || "";
    lastEmitted.current = value;
    // initial mount only — later edits flow through onInput
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    if (value !== lastEmitted.current) {
      el.innerHTML = value || "";
      lastEmitted.current = value;
    }
  }, [value]);

  function emit() {
    const el = editorRef.current;
    if (!el) return;
    const html = el.innerHTML;
    lastEmitted.current = html;
    onChange(html);
  }

  function run(command: string, commandValue?: string) {
    editorRef.current?.focus();
    document.execCommand(command, false, commandValue);
    emit();
  }

  function addLink() {
    const url = window.prompt("Link URL");
    if (!url) return;
    run("createLink", url);
  }

  const empty =
    !value ||
    value === "<br>" ||
    value.replace(/<[^>]*>/g, "").trim() === "";

  return (
    <div className="border border-black bg-white">
      <div className="flex flex-wrap gap-1 border-b border-black bg-neutral-50 p-2">
        <ToolbarButton label="B" title="Bold" onMouseDown={() => run("bold")} />
        <ToolbarButton
          label="I"
          title="Italic"
          onMouseDown={() => run("italic")}
        />
        <ToolbarButton
          label="U"
          title="Underline"
          onMouseDown={() => run("underline")}
        />
        <ToolbarButton
          label="H2"
          title="Heading"
          onMouseDown={() => run("formatBlock", "h2")}
        />
        <ToolbarButton
          label="P"
          title="Paragraph"
          onMouseDown={() => run("formatBlock", "p")}
        />
        <ToolbarButton
          label="• List"
          title="Bullet list"
          onMouseDown={() => run("insertUnorderedList")}
        />
        <ToolbarButton
          label="1. List"
          title="Numbered list"
          onMouseDown={() => run("insertOrderedList")}
        />
        <ToolbarButton label="Link" title="Insert link" onMouseDown={addLink} />
        <ToolbarButton
          label="Clear"
          title="Remove formatting"
          onMouseDown={() => run("removeFormat")}
        />
      </div>

      <div className="relative">
        {empty ? (
          <p
            className="pointer-events-none absolute left-3 top-3 text-sm text-neutral-400"
            aria-hidden
          >
            {placeholder}
          </p>
        ) : null}
        <div
          id={id}
          ref={editorRef}
          role="textbox"
          aria-multiline="true"
          contentEditable
          suppressContentEditableWarning
          onInput={emit}
          onBlur={emit}
          className="blog-html px-3 py-3 text-sm leading-relaxed text-black outline-none [&_a]:underline [&_h2]:mb-2 [&_h2]:mt-3 [&_h2]:font-[family-name:var(--font-hero-serif)] [&_h2]:text-xl [&_li]:ml-5 [&_li]:list-disc [&_ol_li]:list-decimal [&_p]:mb-2"
          style={{ minHeight }}
        />
      </div>
    </div>
  );
}

export function htmlIsEmpty(html: string) {
  return html.replace(/<[^>]*>/g, " ").replace(/&nbsp;/gi, " ").trim() === "";
}
