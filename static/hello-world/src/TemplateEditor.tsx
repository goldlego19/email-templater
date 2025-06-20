import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { ToolbarPlugin } from "./ToolbarPlugin";
import "./editor.css";

const editorConfig = {
  namespace: "EmailEditor",
  theme: {
    paragraph: "editor-paragraph",
    text: {
      bold: "editor-bold",
      italic: "editor-italic",
      underline: "editor-underline",
    },
    heading: {
      h1: "editor-heading-h1",
      h2: "editor-heading-h2",
    },
  },
  onError(error: any) {
    throw error;
  },
  nodes: [],
};

export default function TemplateEditor() {
  return (
    <div className="editor-wrapper">
      <LexicalComposer initialConfig={editorConfig}>
        <ToolbarPlugin />
        <div className="editor-container">
          <RichTextPlugin
            contentEditable={<ContentEditable className="editor-input" />}
            placeholder={
              <div className="editor-placeholder">
                Write your template here...
              </div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          <OnChangePlugin
            onChange={(editorState: import("lexical").EditorState) => {
              editorState.read(() => {
                // Handle updated content here if needed
              });
            }}
          />
        </div>
      </LexicalComposer>
    </div>
  );
}
