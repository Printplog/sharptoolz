// components/CodeEditor.tsx
import CodeMirror from "@uiw/react-codemirror";
import { html } from "@codemirror/lang-html";
import { useTheme } from "next-themes";

type Props = {
  value: string;
  onChange: (val: string) => void;
};

export default function CodeEditor({ value, onChange }: Props) {
  const { theme } = useTheme(); // Optional if you want dark/light support

  return (
    <CodeMirror
      value={value}
      height="150px"
      extensions={[html()]}
      theme={theme === "dark" ? "dark" : "light"}
      onChange={onChange}
      basicSetup={{
        lineNumbers: true,
        highlightActiveLine: true,
        foldGutter: true,
      }}
      className="rounded-md border border-white/10"
    />
  );
}
