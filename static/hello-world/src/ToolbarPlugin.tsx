// static/hello-world/src/ToolbarPlugin.tsx
import { FORMAT_TEXT_COMMAND, FORMAT_ELEMENT_COMMAND } from "lexical";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

export function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();

  const applyAlignment = (align: "left" | "center" | "right" | "justify") => {
    editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, align);
  };

  return (
    <div className="editor-toolbar">
      <button
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")}
      >
        Bold
      </button>
      <button
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")}
      >
        Italic
      </button>
      <button
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline")}
      >
        Underline
      </button>
      <button onClick={() => applyAlignment("left")}>Left</button>
      <button onClick={() => applyAlignment("center")}>Center</button>
      <button onClick={() => applyAlignment("right")}>Right</button>
      <button onClick={() => applyAlignment("justify")}>Justify</button>
    </div>
  );
}
