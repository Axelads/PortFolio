import React from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import TextAlign from "@tiptap/extension-text-align";

const ToolbarButton = ({ onClick, isActive, title, children }) => (
  <button
    type="button"
    onClick={onClick}
    className={`rte-btn${isActive ? " active" : ""}`}
    title={title}
  >
    {children}
  </button>
);

const Separator = () => <div className="rte-separator" />;

const RichTextEditor = ({ value, onChange }) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: { openOnClick: false },
      }),
      TextStyle,
      Color,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: value || "",
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) return null;

  const handleSetLink = () => {
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL du lien :", previousUrl || "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const currentColor = editor.getAttributes("textStyle").color || "#2f2f2f";

  return (
    <div className="rich-text-editor">
      <div className="rte-toolbar">
        {/* Titres */}
        <div className="rte-group">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            isActive={editor.isActive("heading", { level: 1 })}
            title="Titre 1"
          >
            H1
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            isActive={editor.isActive("heading", { level: 2 })}
            title="Titre 2"
          >
            H2
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            isActive={editor.isActive("heading", { level: 3 })}
            title="Titre 3"
          >
            H3
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setParagraph().run()}
            isActive={editor.isActive("paragraph")}
            title="Paragraphe"
          >
            ¶
          </ToolbarButton>
        </div>

        <Separator />

        {/* Mise en forme */}
        <div className="rte-group">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive("bold")}
            title="Gras"
          >
            <strong>B</strong>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive("italic")}
            title="Italique"
          >
            <em>I</em>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            isActive={editor.isActive("underline")}
            title="Souligné"
          >
            <span style={{ textDecoration: "underline" }}>U</span>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive("strike")}
            title="Barré"
          >
            <span style={{ textDecoration: "line-through" }}>S</span>
          </ToolbarButton>
        </div>

        <Separator />

        {/* Alignement */}
        <div className="rte-group">
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
            isActive={editor.isActive({ textAlign: "left" })}
            title="Aligner à gauche"
          >
            ≡
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
            isActive={editor.isActive({ textAlign: "center" })}
            title="Centrer"
          >
            ≡
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
            isActive={editor.isActive({ textAlign: "right" })}
            title="Aligner à droite"
          >
            ≡
          </ToolbarButton>
        </div>

        <Separator />

        {/* Listes */}
        <div className="rte-group">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive("bulletList")}
            title="Liste à puces"
          >
            • —
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive("orderedList")}
            title="Liste numérotée"
          >
            1. —
          </ToolbarButton>
        </div>

        <Separator />

        {/* Lien */}
        <div className="rte-group">
          <ToolbarButton
            onClick={handleSetLink}
            isActive={editor.isActive("link")}
            title="Insérer un lien"
          >
            🔗
          </ToolbarButton>
        </div>

        <Separator />

        {/* Couleur du texte */}
        <div className="rte-group">
          <label className="rte-color-label" title="Couleur du texte">
            <span
              className="rte-color-preview"
              style={{ borderBottomColor: currentColor }}
            >
              A
            </span>
            <input
              type="color"
              value={currentColor}
              onChange={(e) =>
                editor.chain().focus().setColor(e.target.value).run()
              }
            />
          </label>
        </div>

        <Separator />

        {/* Effacer la mise en forme */}
        <div className="rte-group">
          <ToolbarButton
            onClick={() =>
              editor.chain().focus().clearNodes().unsetAllMarks().run()
            }
            title="Effacer la mise en forme"
          >
            ✕
          </ToolbarButton>
        </div>
      </div>

      <EditorContent editor={editor} className="rte-content" />
    </div>
  );
};

export default RichTextEditor;
